import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

function App() {
  // --- ESTADOS ---
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Canais e Mensagens
  const [channels, setChannels] = useState([]); // Lista de canais vinda da BD
  const [currentChannel, setCurrentChannel] = useState(null); // ID do canal selecionado
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const socketRef = useRef();

  // --- 1. SETUP INICIAL ---
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setupSocket(token);
      fetchChannels(token); // Carrega os canais ao iniciar
    }
  }, []);

  // --- 2. QUANDO MUDA O CANAL ---
  useEffect(() => {
    if (currentChannel && user) {
      fetchMessages(currentChannel);
      if (socketRef.current) {
        socketRef.current.emit('join_channel', currentChannel);
      }
    }
  }, [currentChannel]);

  // --- FUNÇÕES DE API ---
  const fetchChannels = async (tokenOverride) => {
    try {
      const token = tokenOverride || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChannels(response.data.channels);

      // Se não houver canal selecionado e existirem canais, seleciona o primeiro
      if (response.data.channels.length > 0 && !currentChannel) {
        setCurrentChannel(response.data.channels[0]._id);
      }
    } catch (error) {
      console.error("Erro ao buscar canais", error);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/messages/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Erro ao buscar mensagens", error);
    }
  };

  // --- WEBSOCKETS ---
  const setupSocket = (token) => {
    if (socketRef.current) return; // Evita conexões duplicadas

    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('authenticate', token);
    });

    // Ouve novas mensagens
    socketRef.current.on('new_message', (data) => {
      // Só adiciona se a mensagem for do canal que estamos a ver
      if (data.message.channel === currentChannel || data.message.channel._id === currentChannel) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    // Ouve novos canais criados (Tempo Real!)
    socketRef.current.on('channel_created', (data) => {
      setChannels((prev) => [...prev, data.channel]);
    });
  };

  // --- LOGIN / LOGOUT ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setupSocket(token);
      fetchChannels(token);
    } catch (error) {
      alert('Login falhou: Verifique as credenciais');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socketRef.current) socketRef.current.disconnect();
    socketRef.current = null;
    setUser(null);
    setChannels([]);
    setMessages([]);
  };

  // --- ENVIAR MENSAGEM ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChannel) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/messages/${currentChannel}`, {
        text: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
    }
  };

  // --- RENDER ---
  if (!user) {
    return (
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>StreamPro Login</h2>
          <input 
            type="email" 
            placeholder="Email" 
            value={loginData.email}
            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="Password"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
          />
          <button type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="main-header">
        <div className="logo">🎥 StreamPro Enterprise</div>
        <nav>
          <button onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
          <button onClick={() => setCurrentPage('chat')} className="active">Chat</button>
        </nav>
        <div className="user-info">
          <span>Olá, {user.name}</span>
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </header>

      <div className="content-area">
        {/* DASHBOARD PLACEHOLDER */}
        {currentPage === 'dashboard' && (
          <div className="dashboard-view">
            <h1>Bem-vindo ao StreamPro</h1>
            <p>Selecione a aba Chat para comunicar com a equipa.</p>
          </div>
        )}

        {/* CHAT VIEW */}
        {currentPage === 'chat' && (
          <div className="chat-layout">
            
            {/* BARRA LATERAL (CANAIS) */}
            <div className="channels-sidebar">
              <h3>Canais</h3>
              <div className="channels-list">
                {channels.map((channel) => (
                  <div 
                    key={channel._id} 
                    className={`channel-item ${currentChannel === channel._id ? 'active' : ''}`}
                    onClick={() => setCurrentChannel(channel._id)}
                  >
                    <span className="hash">#</span> 
                    {channel.name}
                    {channel.type === 'private' && <span className="lock">🔒</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* ÁREA DE MENSAGENS */}
            <div className="chat-container">
              <div className="chat-header">
                {channels.find(c => c._id === currentChannel)?.name || 'Selecione um canal'}
              </div>
              
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div className={`message ${msg.user?._id === user.id ? 'my-message' : ''}`} key={index}>
                    <div className="message-avatar">
                      {msg.user?.name?.charAt(0) || '?'}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-user">{msg.user?.name || 'Desconhecido'}</span>
                        <span className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="message-text">{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <form className="chat-input" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder={`Mensagem para #${channels.find(c => c._id === currentChannel)?.name || '...'}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit">Enviar</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;