import os
import sys
import django

# Add backend directory to path
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
    from config import urls
    print('config.urls imported successfully')
    print('urlpatterns found:', len(urls.urlpatterns))
except Exception as e:
    print(f'Failed to import config.urls: {e}')
    sys.exit(1)
