import os
import sys
import django

# Add backend directory to path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
try:
    django.setup()
    print('Django setup successful')
except Exception as e:
    print(f'Django setup failed: {e}')
    sys.exit(1)

try:
    from papers.views import analyze_document
    print('papers.views imported successfully')
except Exception as e:
    print(f'Failed to import papers.views: {e}')
    sys.exit(1)

try:
    from papers.services.ai_service import AIService
    print('AIService imported successfully')
except Exception as e:
    print(f'Failed to import AIService: {e}')
    sys.exit(1)
