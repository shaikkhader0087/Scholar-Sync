import os
import time
import json
from openai import OpenAI
from google import genai
import anthropic

class AIService:
    """Unified service for calling different AI providers"""
    
    MAX_RETRIES = 3
    RETRY_DELAY = 4  # seconds between retries (increases with backoff)
    CALL_DELAY = 3  # seconds between sequential API calls to avoid rate limits
    
    def __init__(self):
        # DeepSeek uses OpenAI-compatible API
        deepseek_key = os.getenv('DEEPSEEK_API_KEY')
        if deepseek_key:
            self.deepseek_client = OpenAI(
                api_key=deepseek_key,
                base_url="https://api.deepseek.com"
            )
        else:
            self.deepseek_client = None
        
        # Optional: OpenAI (only if key exists)
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key and openai_key != 'your-api-key-here':
            self.openai_client = OpenAI(api_key=openai_key)
        else:
            self.openai_client = None
        
        # Google Gemini
        google_key = os.getenv('GOOGLE_API_KEY')
        if google_key:
            self.gemini_client = genai.Client(api_key=google_key)
        else:
            self.gemini_client = None

        # Anthropic Claude
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)
        else:
            self.anthropic_client = None
    
    def _call_with_retry(self, call_fn, provider_name, max_retries=None):
        """Call an AI provider with retry logic for rate limit (429) errors"""
        retries = max_retries or self.MAX_RETRIES
        last_error = None
        
        for attempt in range(retries):
            try:
                return call_fn()
            except Exception as e:
                last_error = e
                error_str = str(e)
                # Retry on rate limit errors
                if '429' in error_str or 'rate' in error_str.lower() or 'exhausted' in error_str.lower():
                    wait_time = self.RETRY_DELAY * (attempt + 1)  # exponential-ish backoff
                    print(f"{provider_name} rate limited (attempt {attempt + 1}/{retries}). Waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    # Non-rate-limit error, don't retry
                    raise e
        
        raise last_error
    
    def call_gemini(self, prompt, system_message=None):
        """Call Google Gemini API with retry logic"""
        if not self.gemini_client:
            raise ValueError("Google API key not configured")
        
        full_prompt = ""
        if system_message:
            full_prompt = f"{system_message}\n\n{prompt}"
        else:
            full_prompt = f"You are a helpful research assistant that provides detailed, well-structured analysis of academic papers and research documents. Format your responses in clean markdown.\n\n{prompt}"
        
        def _call():
            response = self.gemini_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=full_prompt
            )
            return response.text
        
        return self._call_with_retry(_call, "Gemini")
    
    def call_deepseek(self, prompt, system_message=None):
        """Call DeepSeek API (OpenAI-compatible) with retry logic"""
        if not self.deepseek_client:
            raise ValueError("DeepSeek API key not configured")
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        else:
            messages.append({"role": "system", "content": "You are a helpful research assistant that provides detailed, well-structured analysis of academic papers and research documents. Format your responses in clean markdown."})
        messages.append({"role": "user", "content": prompt})
        
        def _call():
            response = self.deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                temperature=0.7,
                max_tokens=4000
            )
            return response.choices[0].message.content
        
        return self._call_with_retry(_call, "DeepSeek")
    
    def call_openai(self, model, prompt, system_message=None):
        """Call OpenAI GPT models"""
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        def _call():
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        
        return self._call_with_retry(_call, "OpenAI")

    def call_anthropic(self, prompt, system_message=None):
        """Call Anthropic Claude API with retry logic"""
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")
        
        system = system_message or "You are a helpful research assistant that provides detailed, well-structured analysis of academic papers and research documents. Format your responses in clean markdown."
        
        def _call():
            message = self.anthropic_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=4000,
                system=system,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return message.content[0].text
        
        return self._call_with_retry(_call, "Anthropic")
    
    def _call_with_fallback(self, prompt, model_id, system_message=None):
        """Try Gemini first (with retry), then Anthropic, then DeepSeek, then OpenAI as fallback."""
        errors = []
        
        # 1. Try Gemini first (primary provider)
        if self.gemini_client:
            try:
                return self.call_gemini(prompt, system_message)
            except Exception as e:
                errors.append(f"Gemini: {e}")
                print(f"Gemini failed: {e}. Trying Anthropic...")
        
        # 2. Fallback to Anthropic
        if self.anthropic_client:
            try:
                return self.call_anthropic(prompt, system_message)
            except Exception as e:
                errors.append(f"Anthropic: {e}")
                print(f"Anthropic failed: {e}. Trying DeepSeek...")

        # 3. Fallback to DeepSeek
        if self.deepseek_client:
            try:
                return self.call_deepseek(prompt, system_message)
            except Exception as e:
                errors.append(f"DeepSeek: {e}")
                print(f"DeepSeek failed: {e}.")
        
        # 4. Try OpenAI as last resort
        if self.openai_client:
            try:
                return self.call_openai(model_id, prompt, system_message)
            except Exception as e:
                errors.append(f"OpenAI: {e}")
        
        raise Exception(f"All AI providers failed: {'; '.join(errors)}")
    
    def generate_summary(self, text, model_id, task_type="summary", custom_instructions=""):
        """Generate content based on task type using specified model"""
        
        # Build custom instruction prefix
        custom_prefix = ""
        if custom_instructions:
            custom_prefix = f"ADDITIONAL USER INSTRUCTIONS: {custom_instructions}\n\nApply these instructions to your analysis below.\n\n"
        
        prompts = {
            "summary": f"""{custom_prefix}Analyze the following research document and provide a comprehensive summary. Include:

## Overview
A brief overview of the document's scope and purpose.

## Main Themes
Identify and explain the major themes discussed.

## Content Analysis
Analyze the key arguments, methodologies, and findings.

## Significance
Explain why this work matters and its contributions.

Document content:
{text}""",
            
            "qa": f"""{custom_prefix}Based on the following research document, generate insightful questions and detailed answers that would help someone deeply understand the material.

Format each Q&A as:
### Question
[Question text]

[Detailed answer with specific references to the document]

Document content:
{text}""",
            
            "studyGuide": f"""{custom_prefix}Create a comprehensive study guide for the following research document. Include:

## Content Overview
Document specifications and structure.

## Key Terms and Concepts
Define important terms with context.

## Critical Analysis Framework
Main arguments with supporting evidence.

## Discussion Questions
Thought-provoking questions for deeper understanding.

## Study Recommendations
Focus areas and further exploration suggestions.

Document content:
{text}""",
            
            "faq": f"""{custom_prefix}Generate a detailed FAQ section for the following research document. Each FAQ should have a substantive answer based on the actual content.

Format as:
**Q: [Question]**
A: [Detailed answer]

Document content:
{text}""",
            
            "keyTopics": f"""{custom_prefix}Identify and analyze the key topics and entities discussed in the following research document. Include:

## Primary Subject Areas
Main focus areas with explanations.

## Content Highlights
Key observations and findings.

## Conceptual Framework
How themes relate to each other.

## Areas for Further Investigation
Recommended follow-up research.

Document content:
{text}"""
        }
        
        prompt = prompts.get(task_type, prompts["summary"])
        
        # Use the smart fallback chain for all models
        return self._call_with_fallback(prompt, model_id)
    
    def generate_flashcards(self, text, model_id, custom_instructions=""):
        """Generate Q&A flashcards from paper content in JSON format"""
        custom_prefix = ""
        if custom_instructions:
            custom_prefix = f"ADDITIONAL USER INSTRUCTIONS: {custom_instructions}\n\n"
        
        prompt = f"""{custom_prefix}Based on the following research document, generate 15-25 flashcards for study purposes.

IMPORTANT: Return ONLY a valid JSON array, no markdown code fences, no extra text.
Each flashcard should be an object with "front" (question) and "back" (answer) keys.

Rules:
- Questions should test understanding, not just recall
- Answers should be concise but complete (2-3 sentences max)
- Cover key concepts, methodologies, findings, and terminology
- Progress from basic to advanced concepts

Example format:
[
  {{"front": "What is the main hypothesis of this study?", "back": "The study hypothesizes that..."}},
  {{"front": "What methodology was used?", "back": "The researchers employed..."}}
]

Document content:
{text}"""
        
        result = self._call_with_fallback(prompt, model_id)
        
        # Parse and validate JSON
        try:
            # Clean up common AI response issues
            cleaned = result.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            cards = json.loads(cleaned)
            if isinstance(cards, list):
                # Validate structure
                valid_cards = []
                for card in cards:
                    if isinstance(card, dict) and 'front' in card and 'back' in card:
                        valid_cards.append({
                            'front': str(card['front']),
                            'back': str(card['back'])
                        })
                return json.dumps(valid_cards)
        except json.JSONDecodeError:
            pass
        
        # Fallback: return as-is wrapped in a single card
        return json.dumps([{"front": "Study this content", "back": result[:500]}])
    
    def generate_literature_review(self, papers_data, model_id, custom_instructions=""):
        """Generate a comparative literature review from multiple papers.
        papers_data: list of dicts with 'title' and 'content' keys
        """
        custom_prefix = ""
        if custom_instructions:
            custom_prefix = f"ADDITIONAL USER INSTRUCTIONS: {custom_instructions}\n\n"
        
        papers_text = ""
        for i, paper in enumerate(papers_data, 1):
            content_preview = paper['content'][:4000]  # Limit each paper
            papers_text += f"\n--- PAPER {i}: {paper['title']} ---\n{content_preview}\n"
        
        prompt = f"""{custom_prefix}You are an expert academic researcher. Generate a comprehensive LITERATURE REVIEW based on the following {len(papers_data)} research papers.

Structure your review as:

## Introduction
Brief overview of the research landscape these papers cover.

## Thematic Analysis
Group findings by common themes across papers. Cite specific papers by title.

## Methodological Comparison
Compare and contrast the research methods used across the papers.

## Key Findings & Consensus
What do the papers agree on? What are the established findings?

## Contradictions & Debates
Where do the papers disagree or present conflicting evidence?

## Synthesis & Implications
What broader conclusions can be drawn from this body of work?

## Gaps in the Literature
What questions remain unanswered? What should future research address?

## References
List all papers analyzed with their key contributions.

Papers to analyze:
{papers_text}"""
        
        return self._call_with_fallback(prompt, model_id)
    
    def generate_research_gaps(self, papers_data, model_id, custom_instructions=""):
        """Identify research gaps across multiple papers.
        papers_data: list of dicts with 'title' and 'content' keys
        """
        custom_prefix = ""
        if custom_instructions:
            custom_prefix = f"ADDITIONAL USER INSTRUCTIONS: {custom_instructions}\n\n"
        
        papers_text = ""
        for i, paper in enumerate(papers_data, 1):
            content_preview = paper['content'][:4000]
            papers_text += f"\n--- PAPER {i}: {paper['title']} ---\n{content_preview}\n"
        
        prompt = f"""{custom_prefix}You are an expert research advisor. Analyze the following {len(papers_data)} research papers and identify RESEARCH GAPS — areas that have not been adequately studied, unanswered questions, and opportunities for future research.

Structure your analysis as:

## Overview of Current Research
What has been studied so far across these papers?

## Identified Research Gaps

### Gap 1: [Title]
- **What's missing**: Description of the gap
- **Evidence**: Which papers hint at this gap
- **Potential research questions**: 2-3 specific questions
- **Suggested methodology**: How to investigate this gap

### Gap 2: [Title]
(same structure, repeat for each gap found)

## Methodological Gaps
What methods haven't been tried? What populations haven't been studied?

## Theoretical Gaps
What theoretical frameworks are underexplored?

## Practical/Applied Gaps
What real-world applications are missing from the research?

## Recommended Research Agenda
Prioritized list of the most impactful research directions, with feasibility notes.

## Potential Thesis/Dissertation Topics
5-10 specific research project ideas based on the identified gaps.

Papers analyzed:
{papers_text}"""
        
        return self._call_with_fallback(prompt, model_id)
    
    def process_document(self, file_content, model_id, custom_instructions=""):
        """Process uploaded document and generate all analysis types"""
        results = {}
        
        # Generate all analysis types with delays between calls to avoid rate limits
        task_types = ["summary", "qa", "study_guide", "faq", "key_topics"]
        
        for i, task_type in enumerate(task_types):
            try:
                prompt_key = task_type
                if task_type == "study_guide":
                    prompt_key = "studyGuide"
                elif task_type == "key_topics":
                    prompt_key = "keyTopics"
                
                results[task_type] = self.generate_summary(file_content, model_id, prompt_key, custom_instructions)
                
                # Add delay between calls to avoid rate limiting (skip after last call)
                if i < len(task_types) - 1:
                    time.sleep(self.CALL_DELAY)
                    
            except Exception as e:
                results[task_type] = f"Error generating {task_type}: {str(e)}"
        
        # Generate flashcards
        try:
            time.sleep(self.CALL_DELAY)
            results['flashcards'] = self.generate_flashcards(file_content, model_id, custom_instructions)
        except Exception as e:
            results['flashcards'] = '[]'
        
        return results
