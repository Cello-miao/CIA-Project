#!/bin/bash
# Build production image

echo "Building production images..."

cd back_student
docker build -t cia-api:latest .
cd ..

cd front_student
npm run build
docker build -t cia-web:latest .
cd ..

echo "Build complete!"
