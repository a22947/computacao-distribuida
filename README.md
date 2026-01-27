
# **🎥 StreamPro Enterprise \- Sistema de Chat Distribuído**

Este projeto foi desenvolvido para a unidade curricular de **Computação Distribuída**.<br>
Consiste numa plataforma de streaming e chat empresarial que utiliza uma arquitetura baseada em microserviços, garantindo escalabilidade e comunicação em tempo real através de WebSockets.


## **🚀 Tecnologias Utilizadas**

**Backend**



* **Node.js & Express:** Servidor API REST.
* **Socket.IO:** Comunicação bidirecional em tempo real para o chat.
* **MongoDB:** Base de dados NoSQL para persistência de utilizadores, canais e mensagens.
* **Redis:** Cache e suporte para escalabilidade horizontal.
* **JWT (JSON Web Tokens):** Autenticação segura de utilizadores.
* **Swagger (OpenAPI):** Documentação interativa da API.

**Frontend**



* **React (Vite):** Interface de utilizador moderna e reativa.
* **Axios:** Cliente HTTP para comunicação com a API.
* **CSS3:** Design "Enterprise" personalizado com suporte a dashboards e analytics.

**Infraestrutura**



* **Docker & Docker Compose:** Orquestração de contentores para garantir que o ambiente é idêntico em qualquer máquina.


---


## **🛠️ Instalação e Configuração**

### **1. Configurar o Backend (Docker)**

Na raiz do projeto (onde está o ficheiro `docker-compose.yml`), executa o seguinte comando no terminal:


```
docker-compose up --build -d
```


Este comando irá iniciar os serviços:



* **Servidor Node.js:** http://localhost:3000
* **MongoDB:** Porta 27017
* **Redis:** Porta 6379


### **2. Configurar o Frontend**

Navega até à pasta `frontend` e instala as dependências:


```
cd frontend npm install
```


Inicia o servidor de desenvolvimento:


```
npm run dev
```


O frontend ficará disponível em: http://localhost:5173


---


## **📖 Como Utilizar**



1. **Documentação da API:** Acede a `http://localhost:3000/api-docs` para ver e testar todas as rotas disponíveis via Swagger.
2. **Registo:** Cria uma conta através da rota **POST /api/auth/register** no Swagger.
3. **Login:** Acede à interface web (`http://localhost:5173`), faz login e começa a trocar mensagens em tempo real.
4. **Chat Distribuído:** Abre duas janelas do navegador (uma normal e outra incógnita) com utilizadores diferentes para testar a entrega instantânea de mensagens via Socket.IO.


---


## **📂 Estrutura do Repositório**


* **/backend:** Código fonte do servidor, configurações do Docker e modelos de dados.
* **/frontend:** Aplicação React, estilos CSS e lógica de comunicação com o socket.
* **docker-compose.yml:** Ficheiro de orquestração de todos os serviços.


---


## **Conclusão**

"O maior desafio técnico deste projeto foi a integração e orquestração de múltiplos serviços distribuídos.<br>
A correção da sintaxe YAML no Swagger e a garantia de que o Frontend (React) comunicava corretamente com o Backend (Node.js) dentro de uma rede isolada pelo Docker foram etapas cruciais que consolidaram conhecimentos sobre autenticação JWT e eventos em tempo real com Socket.IO."


---
