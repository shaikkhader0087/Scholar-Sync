from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "name": "ScholarSyn API",
        "status": "running",
        "endpoints": {
            "papers": "/api/papers/",
            "auth": "/api/auth/",
            "admin": "/admin/"
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/papers/', include('papers.urls')),
    path('api/auth/', include('authentication.urls')),
]
