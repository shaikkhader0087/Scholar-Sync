from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser
from django.contrib.auth import authenticate
from papers.models import Paper, AnalysisResult


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    firebase_uid = request.data.get('firebase_uid')
    firebase_token = request.data.get('firebase_token')

    # --- Firebase / Google auth flow ---
    # The frontend already verified the user via Firebase Auth on the client side.
    # We accept firebase_uid + email directly to create/find the Django user.
    if firebase_token or firebase_uid:
        uid = firebase_uid or request.data.get('uid')
        email = request.data.get('email', '')
        name = request.data.get('username') or request.data.get('name') or ''

        if not uid and not email:
            return Response({'error': 'Firebase UID or email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Look up user by UID first, then by email
        user = None
        if uid:
            user = User.objects.filter(username=uid).first()
        if not user and email:
            user = User.objects.filter(email=email).first()

        if user:
            # User already exists — just return token
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}
            }, status=status.HTTP_201_CREATED)

        # Create new user
        username = uid or email
        user = User.objects.create_user(username=username, email=email, password=None)
        user.set_unusable_password()
        user.first_name = name
        user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}
        }, status=status.HTTP_201_CREATED)

    # --- Direct email/password registration (non-Firebase) ---
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
    return Response({
        'token': token.key,
        'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    firebase_uid = request.data.get('firebase_uid')
    firebase_token = request.data.get('firebase_token')

    # --- Firebase / Google auth flow ---
    if firebase_token or firebase_uid:
        uid = firebase_uid or request.data.get('uid')
        email = request.data.get('email', '')

        # Look up user by UID first, then by email
        user = None
        if uid:
            user = User.objects.filter(username=uid).first()
        if not user and email:
            user = User.objects.filter(email=email).first()

        if not user:
            # Auto-create user on first Google login
            username = uid or email
            name = request.data.get('username') or request.data.get('name') or ''
            user = User.objects.create_user(username=username, email=email, password=None)
            user.set_unusable_password()
            user.first_name = name
            user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}
        }, status=status.HTTP_200_OK)

    # --- Direct email/password login (non-Firebase) ---
    username = request.data.get('email')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': {'name': user.first_name, 'email': user.email, 'is_staff': user.is_staff}
    }, status=status.HTTP_200_OK)


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
