# **🎥 StreamPro Enterprise \- Sistema de Chat Distribuído**

Este projeto foi desenvolvido para a unidade curricular de **Computação Distribuída**. Consiste numa plataforma de streaming e chat empresarial que utiliza uma arquitetura baseada em micro serviços, garantindo escalabilidade e comunicação em tempo real através de WebSockets.

## **🚀 Tecnologias Utilizadas**

### **Backend**

* **Node.js & Express**: Servidor API REST.  
* **Socket.IO**: Comunicação bidirecional em tempo real para o chat.  
* **MongoDB**: Base de dados NoSQL para persistência de utilizadores, canais e mensagens.  
* **Redis**: Cache e suporte para escalabilidade horizontal.  
* **JWT (JSON Web Tokens)**: Autenticação segura de utilizadores.  
* **Swagger (OpenAPI)**: Documentação interativa da API.

### **Frontend**

* **React (Vite)**: Interface de utilizador moderna e reativa.  
* **Axios**: Cliente HTTP para comunicação com a API.  
* **CSS3**: Design "Enterprise" personalizado com suporte a dashboards e analytics.

### **Infraestrutura**

* **Docker & Docker Compose**: Orquestração de contentores para garantir que o ambiente é idêntico em qualquer máquina.

---

## **🛠️ Instalação e Configuração**

### **Pré-requisitos**

* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.  
* [Node.js](https://nodejs.org/) (opcional, apenas para desenvolvimento local do frontend).

### **1\. Configurar o Backend (Docker)**

Na raiz do projeto (onde se encontra o ficheiro `docker-compose.yml`), executa:

Bash  
docker-compose up \--build \-d

Este comando irá iniciar:

* O servidor Node.js em `http://localhost:3000`.  
* A base de dados MongoDB na porta `27017`.  
* O serviço Redis na porta `6379`.

### **2\. Configurar o Frontend**

Navega até à pasta `frontend` e instala as dependências:

Bash  
cd frontend  
npm install

Inicia o servidor de desenvolvimento:

Bash  
npm run dev

O frontend estará disponível em `http://localhost:5173`.

---

## **📖 Como Utilizar**

1. **Documentação da API**: Aceder a `http://localhost:3000/api-docs` para ver e testar todas as rotas disponíveis via Swagger.  
2. **Registo**: Cria uma conta através da rota **POST `/api/auth/register`** no Swagger.  
3. **Login**: Aceder à interface web (`localhost:5173`), faz login e começa a trocar mensagens em tempo real.  
4. **Chat Distribuído**: Abre duas janelas do navegador (uma normal e outra incógnita) com utilizadores diferentes para testar a entrega instantânea de mensagens via Socket.IO.

---

## **📂 Estrutura do Repositório**

* `/backend`: Código fonte do servidor, configurações do Docker e modelos de dados.  
* `/frontend`: Aplicação React, estilos CSS e lógica de comunicação com o socket.  
* `docker-compose.yml`: Ficheiro de orquestração de todos os serviços.

