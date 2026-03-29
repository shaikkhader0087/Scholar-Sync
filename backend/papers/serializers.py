from rest_framework import serializers
from .models import Paper, AnalysisResult

class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = '__all__'

class PaperSerializer(serializers.ModelSerializer):
    analysis = AnalysisResultSerializer(read_only=True)
    class Meta:
        model = Paper
        fields = ['id', 'title', 'content', 'user', 'created_at', 'analysis']
