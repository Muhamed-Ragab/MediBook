# Setup Guide — Medical Appointment System

## Prerequisites

- Python 3.10+
- Node.js 18+
- Git

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
# or .\venv\Scripts\Activate.ps1  # Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Running Tests

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm run test
```

## Git Workflow

```bash
# Each developer works on their wave/task branch
git checkout -b wave-1-task-1  # Django scaffolding
git checkout -b wave-1-task-2  # React scaffolding
# Merge to main after each wave completes
```
