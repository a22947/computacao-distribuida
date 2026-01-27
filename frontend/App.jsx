import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

function App() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentChannel, setCurrentChannel] = useState('geral');
  
  // --- NOVOS ESTADOS PARA MENSAGENS REAIS ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef();

  // 1. Recuperar sessão e configurar Socket
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setupSocket(token);
    }
  }, []);

  // 2. Lógica de WebSockets (Mensagens em tempo real)
  const setupSocket = (token) => {
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('authenticate', token);
      socketRef.current.emit('join_channel', currentChannel);
    });

    // Ouvir novas mensagens vindas do servidor
    socketRef.current.on('new_message', (data) => {
      setMessages((prev) => [...prev, data.message]);
    });
  };

  // 3. Carregar Histórico do MongoDB quando mudar de canal
  useEffect(() => {
    if (user && currentPage === 'chat') {
      fetchMessages();
      if (socketRef.current) {
        socketRef.current.emit('join_channel', currentChannel);
      }
    }
  }, [currentChannel, currentPage]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/messages/${currentChannel}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    }
  };

  // 4. Enviar Mensagem Real para o Backend
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/messages/${currentChannel}`, 
        { text: newMessage }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage(''); // Limpa o input, o Socket.io tratará de exibir a mensagem
    } catch (err) {
      alert("Erro ao enviar mensagem");
    }
  };

  // --- LÓGICA DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setupSocket(token);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro no login');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    if (socketRef.current) socketRef.current.disconnect();
  };

  if (!user) {
    return (
      <div className="auth-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="auth-card" style={{background: 'white', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px'}}>
          <h2 style={{textAlign: 'center', marginBottom: '20px'}}>🎥 StreamPro Login</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" className="input-auth" onChange={(e) => setLoginData({...loginData, email: e.target.value})} required />
            <input type="password" placeholder="Password" className="input-auth" onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
            <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '10px'}}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <div className="logo">🎥 StreamPro Enterprise</div>
        <nav className="nav-menu">
          <button className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${currentPage === 'chat' ? 'active' : ''}`} onClick={() => setCurrentPage('chat')}>Chat</button>
          <button className="nav-btn" onClick={handleLogout} style={{color: '#ef4444'}}>Sair</button>
        </nav>
      </header>

      <div className="content">
        {currentPage === 'dashboard' && (
          <div className="page active">
            <h1 className="section-title">Painel de Controlo</h1>
            <div className="stats-grid">
              <div className="stat-card"><h3>Utilizador Atual</h3><div className="value">{user.name}</div></div>
              <div className="stat-card"><h3>Estado</h3><div className="value">Online 🟢</div></div>
            </div>
          </div>
        )}

        {currentPage === 'chat' && (
          <div className="page active">
            <div className="chat-page-container">
              <div className="channels-sidebar">
                <h3>Canais</h3>
                {['geral', 'tech', 'vendas'].map(ch => (
                  <div key={ch} className={`channel-item ${currentChannel === ch ? 'active' : ''}`} onClick={() => setCurrentChannel(ch)}># {ch}</div>
                ))}
              </div>

              <div className="chat-container">
                <div className="chat-header"># {currentChannel}</div>
                <div className="chat-messages">
                  {messages.map((msg, index) => (
                    <div className="message" key={index}>
                      <div className="message-avatar">{msg.user?.name?.charAt(0) || 'U'}</div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-user">{msg.user?.name || 'Utilizador'}</span>
                          <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="message-text">{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form className="chat-input" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder="Digite sua mensagem..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">Enviar</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;