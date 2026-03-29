from django.db import models
from django.contrib.auth.models import User

class Paper(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='papers', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class AnalysisResult(models.Model):
    paper = models.OneToOneField(Paper, on_delete=models.CASCADE, related_name='analysis')
    summary = models.TextField()
    qa = models.TextField()
    study_guide = models.TextField()
    faq = models.TextField()
    key_topics = models.TextField()
    flashcards = models.TextField(blank=True, default='[]')  # JSON array of {front, back}
    tables_figures = models.TextField(blank=True, default='[]')  # JSON array of extracted tables/figures
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis for {self.paper.title}"
