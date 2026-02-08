#!/bin/bash

# Cores para ficar bonito no terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}   VERIFICAÇÃO DO AMBIENTE DOCKER - STREAMPRO (BASH)   ${NC}"
echo -e "${GREEN}========================================================${NC}"
echo ""

# 1. VERIFICAR SE O DOCKER ESTÁ A CORRER
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}[OK] O Docker já está a correr!${NC}"
else
    echo -e "${YELLOW}[!] O Docker não está a correr.${NC}"
    echo -e "${YELLOW}[...] A tentar iniciar o Docker Desktop...${NC}"

    # Tenta iniciar o Docker Desktop no caminho padrão do Windows
    # Nota: "/c/Program Files" é como o Git Bash vê o "C:\Program Files"
    if [ -f "/c/Program Files/Docker/Docker/Docker Desktop.exe" ]; then
        "/c/Program Files/Docker/Docker/Docker Desktop.exe" &
    else
        echo -e "${RED}[ERRO] Não encontrei o Docker Desktop no local padrão.${NC}"
        echo -e "${RED}Por favor, inicie o Docker manualmente.${NC}"
        exit 1
    fi

    # 2. LOOP DE ESPERA
    echo -e "${YELLOW}[...] A aguardar que o motor do Docker arranque (pode demorar 1 min)...${NC}"
    
    # Loop 'while' que espera até o 'docker info' responder com sucesso (exit code 0)
    while ! docker info > /dev/null 2>&1; do
        printf "."
        sleep 5
    done
    
    echo ""
    echo -e "${GREEN}[SUCESSO] Docker iniciado e pronto!${NC}"
fi

echo ""
echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}   A CONSTRUIR E INICIAR SERVIÇOS 🚀                   ${NC}"
echo -e "${GREEN}========================================================${NC}"

# 3. ABRIR NO NAVEGADOR (Comando 'start' do Windows invocado via Bash)
# O '&' no fim serve para não bloquear o terminal
start http://localhost:5173 &
start http://localhost:3000/api-docs &

# 4. LEVANTAR O AMBIENTE
docker-compose up --build