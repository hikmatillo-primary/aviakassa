# 1-bosqich: Next.js statik eksportini yig'ish (Alpine)
FROM node:20-alpine AS builder

WORKDIR /app

# Keshdan unumli foydalanish uchun dependency fayllarini alohida nusxalash
COPY package.json package-lock.json ./
RUN npm ci

# Barcha frontend fayllarini ko'chirish va yig'ish
COPY . .
RUN npm run build

# 2-bosqich: Yengil Nginx Alpine orqali tarqatish (Production)
FROM nginx:alpine

# Nginx konfiguratsiyasi
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Yig'ilgan out papkasini nginx papkasiga ko'chirish
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
