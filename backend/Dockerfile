# 1. Usar uma imagem base estável de Node.js
FROM node:20-alpine

# 2. Definir o diretório de trabalho dentro do contentor
WORKDIR /app

# 3. Copiar os ficheiros de dependências
COPY package*.json ./

# 4. Instalar as dependências (incluindo bcrypt e socket.io)
RUN npm install

# 5. Copiar todo o código fonte para o contentor
COPY . .

# 6. Expor a porta que o servidor utiliza
EXPOSE 3000

# 7. Comando para iniciar o servidor
CMD ["node", "servidor.js"]