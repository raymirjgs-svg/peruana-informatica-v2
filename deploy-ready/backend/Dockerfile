# Usar una imagen de Node.js estable y ligera
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar el código TypeScript
RUN npm run build

# Exponer el puerto del backend
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["npm", "start"]
