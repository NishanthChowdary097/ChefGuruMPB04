# ===========================
# Stage 1: Build frontend
# ===========================
FROM node:22.19.0 AS builder

WORKDIR /app

COPY frontend/todo-ui/package*.json ./

RUN npm install --frozen-lockfile

COPY frontend .

RUN npm run build


# ===========================
# Stage 2: Serve with Nginx
# ===========================
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
