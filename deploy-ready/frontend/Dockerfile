# Usar una imagen de Node.js actual
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Argumento para la URL de la API durante el build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Construir la aplicación para producción
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]
