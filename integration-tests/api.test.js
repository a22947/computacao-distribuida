const axios = require('axios');

// O URL deve apontar para o servidor na porta 3000
const API_URL = 'http://localhost:3000/api/auth/register';

describe('🧪 Teste de Infraestrutura: Backend + MongoDB', () => {
    
    // Gerar um email aleatório para evitar erro de "Email já cadastrado"
    const emailTeste = `aluno_${Date.now()}@ipca.pt`;

    test('Deverá persistir um novo utilizador na base de dados', async () => {
        const novoUtilizador = {
            name: "Estudante de Engenharia",
            email: emailTeste,
            password: "p-p-p-password123",
            role: "Usuário" // Role padrão definida no teu schema
        };

        const resposta = await axios.post(API_URL, novoUtilizador);

        // Verificações baseadas na lógica do teu servidor
        expect(resposta.status).toBe(201);
        expect(resposta.data.message).toBe('Usuário criado com sucesso');
        expect(resposta.data.user).toHaveProperty('id');
        
        console.log(`✅ Utilizador guardado com o ID: ${resposta.data.user.id}`);
    });
});