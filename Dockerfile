# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Kopiera package files
COPY package*.json ./

# Installera dependencies
RUN npm install

# Kopiera source code
COPY . .

# Bygg appen
RUN npm run build

# Production stage
FROM nginx:alpine

# Kopiera built files
COPY --from=build /app/dist /usr/share/nginx/html

# Fixa permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
