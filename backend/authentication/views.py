from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser
from django.contrib.auth import authenticate
from papers.models import Paper, AnalysisResult
import firebase_admin
from firebase_admin import auth

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    firebase_token = request.data.get('firebase_token')
    
    if not firebase_token:
        # Fallback to direct registration for backward compatibility or direct API usage
        username = request.data.get('email')
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name')

        if not username or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        user.first_name = name or ''
        user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}}, status=status.HTTP_201_CREATED)

    # Firebase registration flow
    try:
        decoded_token = auth.verify_id_token(firebase_token)
        uid = decoded_token.get('uid')
        email = decoded_token.get('email')
        name = request.data.get('username') or decoded_token.get('name') or ''
        
        # User might already exist if they just logged in with Google for the first time
        user, created = User.objects.get_or_create(username=uid, defaults={'email': email})
        
        if created:
            user.first_name = name
            user.save()
            
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': f'Invalid Firebase token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    firebase_token = request.data.get('firebase_token')
    
    if not firebase_token:
        # Fallback to direct login
        username = request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}}, status=status.HTTP_200_OK)

    # Firebase login flow
    try:
        decoded_token = auth.verify_id_token(firebase_token)
        uid = decoded_token.get('uid')
        email = decoded_token.get('email')
        
        # In case the user hasn't hit the register endpoint yet (Google login direct)
        user, created = User.objects.get_or_create(username=uid, defaults={'email': email})
        
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f'Invalid Firebase token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    total_users = User.objects.count()
    total_papers = Paper.objects.count()
    total_analyses = AnalysisResult.objects.count()
    
    recent_users = User.objects.order_by('-date_joined')[:5].values('username', 'first_name', 'date_joined')
    recent_papers = Paper.objects.order_by('-created_at')[:5].values('title', 'user__username', 'created_at')
    
    return Response({
        'stats': {
            'total_users': total_users,
            'total_papers': total_papers,
            'total_analyses': total_analyses,
        },
        'recent_activity': {
            'users': list(recent_users),
            'papers': list(recent_papers),
        }
    })
