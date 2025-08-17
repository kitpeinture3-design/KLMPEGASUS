# Utiliser une image Node pour build
FROM node:20-alpine AS build

WORKDIR /app

# Installer les dépendances
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install


# Copier le code et build
COPY . .
RUN pnpm run build

# Utiliser une image Nginx pour servir le build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
