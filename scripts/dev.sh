#!/bin/bash
# Start development environment

echo "Starting development environment..."

# Start backend
echo "Starting backend services..."
cd back_student
docker-compose up -d
cd ..

# Start frontend
echo "Starting frontend development server..."
cd front_student
npm start &
cd ..

echo "Development environment started!"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:3000"
