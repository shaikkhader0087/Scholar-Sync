# Research Paper Knowledge Graph

An intelligent system to manage, analyze, and discover connections between research papers using AI.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose

### Setup

1. **Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   # Set up .env file with your API keys
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Databases**
   ```bash
   docker-compose up -d
   ```

## Services
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Neo4j Browser**: http://localhost:7474
- **Qdrant Dashboard**: http://localhost:6333/dashboard
