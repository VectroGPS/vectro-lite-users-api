# Etapa 1: Construir la aplicación
FROM node:18.14.2-alpine AS build

# Establece el directorio de trabajo
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el código fuente de la aplicación
COPY . .

# Compila la aplicación con nestjs
RUN npm run build

# Etapa 2: Crear una imagen ligera
FROM node:18.14.2-alpine AS production

# Establece el directorio de trabajo
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install --omit=dev

# Copia los archivos de la etapa 1
COPY --from=build /app/dist ./dist

# Expone el puerto 3000
EXPOSE 3000

# Inicia la aplicación con npm start:prod
CMD ["npm", "run", "start:prod"]