# Usa uma imagem leve do Node.js
FROM node:22-alpine

# Define a pasta de trabalho dentro do contentor
WORKDIR /app

# Copia os ficheiros de dependências primeiro (para aproveitar o cache)
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código do projeto
COPY . .

# Expõe a porta do Vite
EXPOSE 5173

# O comando --host é OBRIGATÓRIO para o Docker expor o IP para fora
CMD ["npm", "run", "dev", "--", "--host"]