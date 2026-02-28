#!/bin/bash

set -e

echo "Dockerizing FOGNET-X (Production Mode)..."

# Create structure
mkdir -p backend frontend nginx

echo "Folders ensured: backend/, frontend/, nginx/"

# Backend Dockerfile
cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "cloud_server.py"]
EOF

echo "backend/Dockerfile created"

# Frontend Dockerfile (multi-stage)
cat > frontend/Dockerfile << 'EOF'
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ../nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EOF

echo "frontend/Dockerfile created"

# Nginx config
cat > nginx/nginx.conf << 'EOF'
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://backend:8000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

echo "nginx/nginx.conf created"

# Docker Compose
cat > docker-compose.yml << 'EOF'
version: "3.9"

services:
  backend:
    build: ./backend
    container_name: fognetx-backend
    volumes:
      - sqlite_data:/app
    env_file:
      - ./backend/.env
    expose:
      - "8000"

  frontend:
    build: ./frontend
    container_name: fognetx-frontend
    depends_on:
      - backend
    ports:
      - "80:80"

volumes:
  sqlite_data:
EOF

echo "docker-compose.yml created"

# .dockerignore
cat > .dockerignore << 'EOF'
venv
node_modules
__pycache__
*.pyc
*.db
.git
EOF

echo ".dockerignore created"

echo ""
echo "Docker structure ready."
echo ""
echo "Next steps:"
echo "1) Move Flask files into backend/"
echo "2) Move React app into frontend/"
echo "3) Ensure Flask runs on host 0.0.0.0"
echo "4) Replace frontend API calls with /api/"
echo ""
echo "Then run:"
echo "docker compose up --build"
