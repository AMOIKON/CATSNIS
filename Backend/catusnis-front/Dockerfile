FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV CI=false
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# ✅ Les images statiques sont déjà dans /app/build/images/equipements/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]