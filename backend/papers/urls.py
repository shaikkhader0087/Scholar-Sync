from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.analyze_document, name='analyze_document'),
    path('history/', views.get_user_papers, name='get_user_papers'),
    path('health/', views.health_check, name='health_check'),
    path('chat/', views.chat_with_paper, name='chat_with_paper'),
    path('<int:paper_id>/delete/', views.delete_paper, name='delete_paper'),
    path('literature-review/', views.generate_literature_review, name='literature_review'),
    path('research-gaps/', views.generate_research_gaps, name='research_gaps'),
    path('flashcards/', views.generate_flashcards_view, name='generate_flashcards'),
    path('<int:paper_id>/flashcards/export/', views.export_flashcards_anki, name='export_flashcards'),
]
