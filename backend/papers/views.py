from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse
from .models import Paper, AnalysisResult
from .serializers import PaperSerializer
from .services.ai_service import AIService
import json
import pdfplumber
import docx
import io

def extract_tables_from_pdf(uploaded_file):
    """Extract tables from a PDF file using pdfplumber"""
    tables_data = []
    try:
        uploaded_file.seek(0)
        with pdfplumber.open(uploaded_file) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                tables = page.extract_tables()
                for table_idx, table in enumerate(tables):
                    if table and len(table) > 1:
                        # First row as headers
                        headers = [str(cell or '').strip() for cell in table[0]]
                        rows = []
                        for row in table[1:]:
                            rows.append([str(cell or '').strip() for cell in row])
                        tables_data.append({
                            'page': page_num,
                            'table_index': table_idx + 1,
                            'headers': headers,
                            'rows': rows
                        })
    except Exception as e:
        print(f"Table extraction error: {e}")
    return tables_data


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def analyze_document(request):
    title = request.data.get('title', 'Untitled Paper')
    model = request.data.get('model', 'gpt-4')
    custom_prompt = request.data.get('custom_prompt', '')
    
    # Handle file upload or raw text
    content = request.data.get('content', '')
    tables_figures_json = '[]'
    
    if 'file' in request.FILES:
        uploaded_file = request.FILES['file']
        try:
            # If no title provided, use filename
            if not request.data.get('title'):
                title = uploaded_file.name
                
            # Extract text from PDF
            if uploaded_file.content_type == 'application/pdf' or uploaded_file.name.endswith('.pdf'):
                # Extract tables first
                tables_data = extract_tables_from_pdf(uploaded_file)
                tables_figures_json = json.dumps(tables_data)
                
                uploaded_file.seek(0)
                with pdfplumber.open(uploaded_file) as pdf:
                    extracted_text = ""
                    for page in pdf.pages:
                        extracted_text += page.extract_text() or ""
                    content = extracted_text
            elif uploaded_file.name.endswith('.docx') or uploaded_file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                # Extract text from DOCX
                doc = docx.Document(io.BytesIO(uploaded_file.read()))
                content = '\n'.join([para.text for para in doc.paragraphs])
            else:
                # Try to read as text for other formats
                content = uploaded_file.read().decode('utf-8')
        except Exception as e:
            return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not content:
        return Response({'error': 'Content is required (either text or file)'}, status=status.HTTP_400_BAD_REQUEST)

    # Use AI Service
    ai_service = AIService()
    try:
        # returns dict with keys: summary, qa, study_guide, faq, key_topics, flashcards
        results = ai_service.process_document(content, model, custom_prompt)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Save to database
    paper = Paper.objects.create(title=title, content=content, user=request.user)
    
    # Ensure values are strings
    summary = str(results.get('summary', ''))
    qa = str(results.get('qa', ''))
    study_guide = str(results.get('study_guide', ''))
    faq = str(results.get('faq', ''))
    key_topics = str(results.get('key_topics', ''))
    flashcards = str(results.get('flashcards', '[]'))
    
    AnalysisResult.objects.create(
        paper=paper,
        summary=summary,
        qa=qa,
        study_guide=study_guide,
        faq=faq,
        key_topics=key_topics,
        flashcards=flashcards,
        tables_figures=tables_figures_json
    )

    serializer = PaperSerializer(paper)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_papers(request):
    papers = Paper.objects.filter(user=request.user).order_by('-created_at')
    serializer = PaperSerializer(papers, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok"})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_paper(request, paper_id):
    """Delete a paper and its analysis."""
    try:
        paper = Paper.objects.get(id=paper_id, user=request.user)
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)
    
    paper.delete()
    return Response({'message': 'Paper deleted successfully'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_paper(request):
    """Interactive Q&A: ask follow-up questions about an analyzed paper."""
    paper_id = request.data.get('paper_id')
    message = request.data.get('message', '').strip()

    if not paper_id or not message:
        return Response(
            {'error': 'paper_id and message are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        paper = Paper.objects.get(id=paper_id, user=request.user)
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)

    # Build a contextual prompt with the paper content
    system_message = (
        "You are an expert research assistant. The user has uploaded a research document "
        "and is asking follow-up questions about it. Answer based on the document content below. "
        "Be specific, cite relevant sections when possible, and format your response in clean markdown.\n\n"
        f"--- DOCUMENT CONTENT ---\n{paper.content[:8000]}\n--- END DOCUMENT ---"
    )

    ai_service = AIService()
    try:
        # Try each provider with the fallback chain
        errors = []
        answer = None

        if ai_service.gemini_client:
            try:
                answer = ai_service.call_gemini(message, system_message)
            except Exception as e:
                errors.append(f"Gemini: {e}")

        if answer is None and ai_service.anthropic_client:
            try:
                answer = ai_service.call_anthropic(message, system_message)
            except Exception as e:
                errors.append(f"Anthropic: {e}")

        if answer is None and ai_service.deepseek_client:
            try:
                answer = ai_service.call_deepseek(message, system_message)
            except Exception as e:
                errors.append(f"DeepSeek: {e}")

        if answer is None:
            raise Exception(f"All AI providers failed: {'; '.join(errors)}")

        return Response({'answer': answer})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_literature_review(request):
    """Generate a literature review from multiple papers."""
    paper_ids = request.data.get('paper_ids', [])
    custom_prompt = request.data.get('custom_prompt', '')
    model = request.data.get('model', 'gemini-2.0-flash')
    
    if not paper_ids or len(paper_ids) < 2:
        return Response(
            {'error': 'At least 2 paper IDs are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    papers = Paper.objects.filter(id__in=paper_ids, user=request.user)
    if papers.count() < 2:
        return Response({'error': 'At least 2 valid papers required'}, status=status.HTTP_400_BAD_REQUEST)
    
    papers_data = [{'title': p.title, 'content': p.content} for p in papers]
    
    ai_service = AIService()
    try:
        review = ai_service.generate_literature_review(papers_data, model, custom_prompt)
        return Response({'review': review, 'papers_count': len(papers_data)})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_research_gaps(request):
    """Identify research gaps across multiple papers."""
    paper_ids = request.data.get('paper_ids', [])
    custom_prompt = request.data.get('custom_prompt', '')
    model = request.data.get('model', 'gemini-2.0-flash')
    
    if not paper_ids or len(paper_ids) < 2:
        return Response(
            {'error': 'At least 2 paper IDs are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    papers = Paper.objects.filter(id__in=paper_ids, user=request.user)
    if papers.count() < 2:
        return Response({'error': 'At least 2 valid papers required'}, status=status.HTTP_400_BAD_REQUEST)
    
    papers_data = [{'title': p.title, 'content': p.content} for p in papers]
    
    ai_service = AIService()
    try:
        gaps = ai_service.generate_research_gaps(papers_data, model, custom_prompt)
        return Response({'gaps': gaps, 'papers_count': len(papers_data)})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_flashcards_view(request):
    """Generate flashcards for a specific paper."""
    paper_id = request.data.get('paper_id')
    custom_prompt = request.data.get('custom_prompt', '')
    model = request.data.get('model', 'gemini-2.0-flash')
    
    if not paper_id:
        return Response({'error': 'paper_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        paper = Paper.objects.get(id=paper_id, user=request.user)
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)
    
    ai_service = AIService()
    try:
        flashcards_json = ai_service.generate_flashcards(paper.content, model, custom_prompt)
        
        # Save to analysis result
        try:
            analysis = paper.analysis
            analysis.flashcards = flashcards_json
            analysis.save()
        except AnalysisResult.DoesNotExist:
            pass
        
        return Response({'flashcards': json.loads(flashcards_json), 'paper_id': paper_id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_flashcards_anki(request, paper_id):
    """Export flashcards as Anki-compatible tab-separated text file."""
    try:
        paper = Paper.objects.get(id=paper_id, user=request.user)
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        analysis = paper.analysis
    except AnalysisResult.DoesNotExist:
        return Response({'error': 'No analysis found for this paper'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        cards = json.loads(analysis.flashcards)
    except (json.JSONDecodeError, TypeError):
        return Response({'error': 'No flashcards available'}, status=status.HTTP_404_NOT_FOUND)
    
    if not cards:
        return Response({'error': 'No flashcards available'}, status=status.HTTP_404_NOT_FOUND)
    
    # Build Anki-compatible tab-separated format
    # Format: front\tback\ttags
    lines = []
    tag = paper.title.replace(' ', '_')[:30]
    for card in cards:
        front = card.get('front', '').replace('\t', ' ').replace('\n', '<br>')
        back = card.get('back', '').replace('\t', ' ').replace('\n', '<br>')
        lines.append(f"{front}\t{back}\tScholarSyn::{tag}")
    
    content = '\n'.join(lines)
    
    response = HttpResponse(content, content_type='text/plain; charset=utf-8')
    safe_title = paper.title.replace(' ', '_')[:40]
    response['Content-Disposition'] = f'attachment; filename="flashcards_{safe_title}.txt"'
    return response
