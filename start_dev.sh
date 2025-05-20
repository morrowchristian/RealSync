#!/bin/bash

echo "🔧 Starting RealSync Dev Environment..."

# Activate virtualenv
if [ -d "env" ]; then
  echo "✅ Activating Python virtual environment..."
  source env/bin/activate
else
  echo "❌ Virtual environment not found at ./env. Please create one with 'python -m venv env'"
  exit 1
fi

# Start backend in background
echo "🚀 Starting Django backend..."
cd backend
python manage.py runserver &

cd ..

# Start frontend
if [ -d "frontend" ]; then
  echo "🌐 Starting React frontend (Vite)..."
  cd frontend
  npm run dev
else
  echo "❌ Frontend directory not found. Make sure it exists at ./frontend"
  exit 1
fi
