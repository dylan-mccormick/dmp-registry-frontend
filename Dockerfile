# Building
FROM node:25-alpine AS builder

ARG VITE_API_URL

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

# Serving
FROM ghcr.io/nginx/nginx-unprivileged:1.30.7-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]