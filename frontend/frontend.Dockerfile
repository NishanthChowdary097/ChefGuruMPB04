# ===========================
# Stage 1: Build frontend
# ===========================
FROM node:22.19.0 AS builder

WORKDIR /app

# Copy only package files first for caching
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --frozen-lockfile

# Copy the rest of frontend files
COPY frontend/ ./

# Build production
RUN npm run build

# ===========================
# Stage 2: Serve with Nginx
# ===========================
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]