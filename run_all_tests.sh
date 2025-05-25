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
(cd backend && python manage.py runserver) &

# Start frontend in background
if [ -d "frontend" ]; then
  echo "🌐 Starting React frontend (Vite)..."
  (cd frontend && npm run dev) &
else
  echo "❌ Frontend directory not found. Make sure it exists at ./frontend"
  exit 1
fi

# Wait for servers to initialize
echo "⏳ Waiting for servers to initialize..."
sleep 10  # Optional: Adjust this sleep time as needed

# Run backend tests
echo "🧪 Running Django backend tests..."
(cd backend && python manage.py test)
if [ $? -ne 0 ]; then
  echo "❌ Backend tests failed"
else
  echo "✅ Backend tests passed"
fi

# Run frontend tests if test script exists
echo "🧪 Running React frontend tests..."
if grep -q "\"test\":" frontend/package.json; then
  (cd frontend && npm run test)
  if [ $? -ne 0 ]; then
    echo "❌ Frontend tests failed"
  else
    echo "✅ Frontend tests passed"
  fi
else
  echo "⚠️ No test script found in frontend/package.json. Skipping frontend tests."
fi

# Stop background servers (optional if you start with &)
echo "🛑 Stopping servers..."
jobs -p | xargs kill

echo "✅ All tests completed and servers stopped!"
