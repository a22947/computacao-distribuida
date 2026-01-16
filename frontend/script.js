// ============================================
// SISTEMA DE STREAMING/CHAT EMPRESARIAL - JAVASCRIPT
// ============================================

// Estado Global da Aplicação
const AppState = {
    currentPage: 'dashboard',
    isStreaming: false,
    isMuted: false,
    isVideoOff: false,
    streamDuration: 0,
    viewerCount: 0,
    currentChannel: 'geral',
    messages: {},
    users: [
        { id: 1, name: 'Tobana Tamba', status: 'online', role: 'Admin' },
        { id: 2, name: 'Maria Santos', status: 'online', role: 'Moderador' },
        { id: 3, name: 'Pedro Costa', status: 'away', role: 'Usuário' },
        { id: 4, name: 'Ana Oliveira', status: 'online', role: 'Usuário' },
        { id: 5, name: 'Carlos Souza', status: 'offline', role: 'Usuário' }
    ],
    channels: ['geral', 'tech', 'marketing', 'vendas', 'suporte']
};

// Inicializar mensagens para cada canal
AppState.channels.forEach(channel => {
    AppState.messages[channel] = [
        { user: 'João Silva', text: 'Bem-vindos ao canal!', time: '09:30', avatar: 'J' },
        { user: 'Maria Santos', text: 'Bom dia a todos', time: '09:32', avatar: 'M' },
        { user: 'Pedro Costa', text: 'Quando será a próxima reunião?', time: '09:35', avatar: 'P' }
    ];
});

// ============================================
// NAVEGAÇÃO ENTRE PÁGINAS
// ============================================

function showPage(pageName) {
    // Remover active de todas as páginas e botões
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Ativar página e botão selecionados
    document.getElementById(pageName).classList.add('active');
    event.target.classList.add('active');
    
    AppState.currentPage = pageName;
    
    // Ações específicas ao entrar em cada página
    if (pageName === 'dashboard') {
        updateDashboardStats();
    } else if (pageName === 'streaming') {
        updateStreamingUI();
    } else if (pageName === 'chat') {
        loadChatMessages();
    } else if (pageName === 'analytics') {
        updateAnalytics();
    }
}

// ============================================
// DASHBOARD - FUNÇÕES
// ============================================

function updateDashboardStats() {
    // Simular atualização de estatísticas em tempo real
    const stats = {
        totalStreams: Math.floor(Math.random() * 100) + 1200,
        activeViewers: Math.floor(Math.random() * 500) + 3500,
        monthlyMinutes: Math.floor(Math.random() * 5000) + 40000,
        storageUsed: (Math.random() * 2 + 2).toFixed(1)
    };
    
    console.log('Dashboard Stats Updated:', stats);
}

// ============================================
// STREAMING - FUNÇÕES
// ============================================

function toggleStream() {
    AppState.isStreaming = !AppState.isStreaming;
    const streamBtn = document.getElementById('streamBtn');
    const videoArea = document.getElementById('videoArea');
    
    if (AppState.isStreaming) {
        // Iniciar stream
        streamBtn.innerHTML = '⏹️ Encerrar Stream';
        streamBtn.classList.remove('btn-success');
        streamBtn.classList.add('btn-danger');
        
        videoArea.innerHTML = `
            <div class="live-badge">
                <div class="pulse"></div>
                AO VIVO
            </div>
            <div style="text-align: center; color: white;">
                <div style="font-size: 80px; margin-bottom: 20px;">🎥</div>
                <h2 style="font-size: 28px; margin-bottom: 10px;">Stream ao Vivo</h2>
                <p style="font-size: 16px; opacity: 0.8;"><span id="viewerCount">0</span> espectadores</p>
            </div>
        `;
        videoArea.classList.add('video-active');
        
        // Iniciar contador de duração
        startStreamTimer();
        
        // Simular viewers entrando
        simulateViewers();
        
        console.log('Stream iniciada!');
    } else {
        // Parar stream
        streamBtn.innerHTML = '▶️ Iniciar Stream';
        streamBtn.classList.remove('btn-danger');
        streamBtn.classList.add('btn-success');
        
        videoArea.innerHTML = `
            <div class="video-placeholder">
                <h2>📹 Stream não iniciada</h2>
                <p>Clique em "Iniciar Stream" para começar</p>
            </div>
        `;
        videoArea.classList.remove('video-active');
        
        // Parar timer
        if (AppState.streamTimer) {
            clearInterval(AppState.streamTimer);
        }
        AppState.streamDuration = 0;
        
        console.log('Stream encerrada!');
    }
}

function startStreamTimer() {
    AppState.streamDuration = 0;
    AppState.streamTimer = setInterval(() => {
        AppState.streamDuration++;
        const minutes = Math.floor(AppState.streamDuration / 60);
        const seconds = AppState.streamDuration % 60;
        const durationElement = document.getElementById('duration');
        if (durationElement) {
            durationElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

function simulateViewers() {
    AppState.viewerCount = 1;
    const viewerInterval = setInterval(() => {
        if (!AppState.isStreaming) {
            clearInterval(viewerInterval);
            return;
        }
        
        // Aumentar viewers gradualmente
        if (Math.random() > 0.3 && AppState.viewerCount < 500) {
            AppState.viewerCount += Math.floor(Math.random() * 5) + 1;
        } else if (Math.random() > 0.7 && AppState.viewerCount > 10) {
            AppState.viewerCount -= Math.floor(Math.random() * 3);
        }
        
        const viewerElements = document.querySelectorAll('#viewerCount');
        viewerElements.forEach(el => {
            el.textContent = AppState.viewerCount;
        });
    }, 3000);
}

function toggleMic() {
    AppState.isMuted = !AppState.isMuted;
    const micBtn = document.getElementById('micBtn');
    
    if (AppState.isMuted) {
        micBtn.innerHTML = '🔇 Microfone (Mudo)';
        micBtn.classList.add('active');
    } else {
        micBtn.innerHTML = '🎤 Microfone';
        micBtn.classList.remove('active');
    }
    
    console.log('Microfone:', AppState.isMuted ? 'Mudo' : 'Ativo');
}

function toggleVideo() {
    AppState.isVideoOff = !AppState.isVideoOff;
    const videoBtn = document.getElementById('videoBtn');
    
    if (AppState.isVideoOff) {
        videoBtn.innerHTML = '📹 Vídeo (Desligado)';
        videoBtn.classList.add('active');
    } else {
        videoBtn.innerHTML = '📹 Vídeo';
        videoBtn.classList.remove('active');
    }
    
    console.log('Vídeo:', AppState.isVideoOff ? 'Desligado' : 'Ligado');
}

function updateStreamingUI() {
    // Atualizar UI quando entrar na página de streaming
    const streamBtn = document.getElementById('streamBtn');
    if (streamBtn && AppState.isStreaming) {
        streamBtn.innerHTML = '⏹️ Encerrar Stream';
        streamBtn.classList.remove('btn-success');
        streamBtn.classList.add('btn-danger');
    }
}

function sendStreamMessage() {
    const input = document.getElementById('streamMessageInput');
    const messageText = input.value.trim();
    
    if (messageText === '') return;
    
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const message = {
        user: 'Você',
        text: messageText,
        time: time,
        avatar: 'V'
    };
    
    addMessageToStreamChat(message);
    input.value = '';
    
    console.log('Mensagem enviada no stream:', messageText);
}

function addMessageToStreamChat(message) {
    const chatMessages = document.getElementById('streamChatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div class="message-avatar">${message.avatar}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-user">${message.user}</span>
                <span class="message-time">${message.time}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================
// CHAT - FUNÇÕES
// ============================================

function selectChannel(channelName, element) {
    AppState.currentChannel = channelName;
    
    // Remover active de todos os canais
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar active ao canal selecionado
    element.classList.add('active');
    
    // Atualizar nome do canal
    document.getElementById('currentChannel').textContent = channelName.charAt(0).toUpperCase() + channelName.slice(1);
    
    // Carregar mensagens do canal
    loadChatMessages();
    
    console.log('Canal selecionado:', channelName);
}

function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    const channelMessages = AppState.messages[AppState.currentChannel] || [];
    
    channelMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `
            <div class="message-avatar">${message.avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-user">${message.user}</span>
                    <span class="message-time">${message.time}</span>
                </div>
                <div class="message-text">${message.text}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const messageText = input.value.trim();
    
    if (messageText === '') return;
    
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const message = {
        user: 'Você',
        text: messageText,
        time: time,
        avatar: 'V'
    };
    
    // Adicionar mensagem ao canal atual
    if (!AppState.messages[AppState.currentChannel]) {
        AppState.messages[AppState.currentChannel] = [];
    }
    AppState.messages[AppState.currentChannel].push(message);
    
    // Adicionar mensagem à UI
    addMessageToChat(message);
    
    input.value = '';
    
    console.log(`Mensagem enviada no canal ${AppState.currentChannel}:`, messageText);
    
    // Simular resposta automática
    setTimeout(() => {
        simulateAutoReply();
    }, 2000 + Math.random() * 3000);
}

function addMessageToChat(message) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div class="message-avatar">${message.avatar}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-user">${message.user}</span>
                <span class="message-time">${message.time}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function simulateAutoReply() {
    const replies = [
        { user: 'João Silva', text: 'Ótima pergunta! Vou verificar isso.', avatar: 'J' },
        { user: 'Maria Santos', text: 'Concordo totalmente!', avatar: 'M' },
        { user: 'Pedro Costa', text: 'Obrigado pela informação.', avatar: 'P' },
        { user: 'Ana Oliveira', text: 'Isso faz sentido, valeu!', avatar: 'A' }
    ];
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const message = {
        user: randomReply.user,
        text: randomReply.text,
        time: time,
        avatar: randomReply.avatar
    };
    
    AppState.messages[AppState.currentChannel].push(message);
    
    if (AppState.currentPage === 'chat') {
        addMessageToChat(message);
    }
}

// ============================================
// ANALYTICS - FUNÇÕES
// ============================================

function updateAnalytics() {
    console.log('Analytics atualizados');
    
    // Simular atualização de métricas
    const metrics = {
        totalHours: Math.floor(Math.random() * 500) + 1000,
        engagement: Math.floor(Math.random() * 20) + 75,
        activeUsers: Math.floor(Math.random() * 1000) + 2000
    };
    
    console.log('Métricas:', metrics);
}

function exportReport(format) {
    console.log(`Exportando relatório em formato: ${format}`);
    alert(`Relatório exportado com sucesso em ${format.toUpperCase()}!`);
}

function generateReport() {
    console.log('Gerando novo relatório...');
    alert('Relatório personalizado gerado com sucesso!');
}

// ============================================
// SETTINGS - FUNÇÕES
// ============================================

function saveSettings() {
    console.log('Configurações salvas com sucesso!');
    alert('✅ Configurações salvas com sucesso!');
}

function resetSettings() {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
        console.log('Configurações restauradas para o padrão');
        alert('✅ Configurações restauradas!');
    }
}

// ============================================
// SIMULAÇÕES E ATUALIZAÇÕES EM TEMPO REAL
// ============================================

function startRealtimeUpdates() {
    // Atualizar estatísticas a cada 30 segundos
    setInterval(() => {
        if (AppState.currentPage === 'dashboard') {
            updateDashboardStats();
        }
    }, 30000);
    
    // Simular novos usuários online/offline
    setInterval(() => {
        const randomUser = AppState.users[Math.floor(Math.random() * AppState.users.length)];
        const statuses = ['online', 'away', 'offline'];
        randomUser.status = statuses[Math.floor(Math.random() * statuses.length)];
        console.log(`Status de ${randomUser.name} alterado para: ${randomUser.status}`);
    }, 45000);
}

// ============================================
// NOTIFICAÇÕES
// ============================================

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#667eea'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// WEBSOCKET SIMULATION (para futura integração)
// ============================================

class WebSocketSimulator {
    constructor() {
        this.connected = false;
        this.listeners = {};
    }
    
    connect() {
        console.log('🔌 Conectando ao servidor WebSocket...');
        setTimeout(() => {
            this.connected = true;
            console.log('✅ Conectado ao servidor WebSocket!');
            showNotification('Conectado ao servidor', 'success');
            this.emit('connected', { timestamp: new Date() });
        }, 1000);
    }
    
    disconnect() {
        this.connected = false;
        console.log('🔌 Desconectado do servidor WebSocket');
        showNotification('Desconectado do servidor', 'error');
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    send(event, data) {
        if (!this.connected) {
            console.error('❌ WebSocket não conectado');
            return;
        }
        console.log(`📤 Enviando: ${event}`, data);
        // Simular resposta do servidor
        setTimeout(() => {
            this.emit(`${event}_response`, { success: true, data });
        }, 500);
    }
}

// Instância global do WebSocket
const ws = new WebSocketSimulator();

// ============================================
// API SIMULATION (para futura integração)
// ============================================

const API = {
    baseURL: 'https://api.streampro.enterprise/v1',
    
    async get(endpoint) {
        console.log(`📥 GET ${this.baseURL}${endpoint}`);
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, data: {} };
    },
    
    async post(endpoint, data) {
        console.log(`📤 POST ${this.baseURL}${endpoint}`, data);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, data: {} };
    },
    
    async delete(endpoint) {
        console.log(`🗑️ DELETE ${this.baseURL}${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de Streaming/Chat Empresarial iniciado!');
    console.log('📊 Estado inicial:', AppState);
    
    // Conectar WebSocket
    ws.connect();
    
    // Iniciar atualizações em tempo real
    startRealtimeUpdates();
    
    // Carregar mensagens iniciais
    loadChatMessages();
    
    // Eventos do WebSocket
    ws.on('connected', (data) => {
        console.log('WebSocket conectado:', data);
    });
    
    ws.on('new_message', (data) => {
        console.log('Nova mensagem recebida:', data);
        if (AppState.currentPage === 'chat' && data.channel === AppState.currentChannel) {
            addMessageToChat(data.message);
        }
    });
    
    ws.on('user_joined', (data) => {
        console.log('Usuário entrou:', data);
        showNotification(`${data.username} entrou no chat`, 'info');
    });
    
    ws.on('user_left', (data) => {
        console.log('Usuário saiu:', data);
    });
    
    // Log de sistema
    console.log('✅ Todas as funcionalidades carregadas com sucesso!');
    console.log('💡 Use as funções globais para interagir com o sistema:');
    console.log('   - showPage(pageName)');
    console.log('   - toggleStream()');
    console.log('   - sendMessage()');
    console.log('   - selectChannel(channelName, element)');
});

// ============================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ============================================

window.showPage = showPage;
window.toggleStream = toggleStream;
window.toggleMic = toggleMic;
window.toggleVideo = toggleVideo;
window.sendMessage = sendMessage;
window.sendStreamMessage = sendStreamMessage;
window.selectChannel = selectChannel;
window.exportReport = exportReport;
window.generateReport = generateReport;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.API = API;
window.ws = ws;
window.AppState = AppState;

console.log('🎉 Sistema pronto para uso!');