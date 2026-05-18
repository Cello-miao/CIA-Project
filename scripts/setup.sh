#!/bin/bash
# Setup script for the entire project

echo "Setting up CIA Project..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd back_student
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd front_student
npm install
cd ..

# Create environment files
echo "Creating environment files..."
cp front_student/.env.example front_student/.env

echo "Setup complete!"
echo "Remember to update .env files with your configuration"
