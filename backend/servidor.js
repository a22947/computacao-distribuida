// ============================================
// SERVIDOR BACKEND - SISTEMA DE STREAMING/CHAT EMPRESARIAL
// Node.js + Express + Socket.IO + MongoDB
// ============================================
import express from 'express';


// ============================================
// DEPENDÊNCIAS E CONFIGURAÇÕES
// ============================================

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurações
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streaming_chat';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ============================================
// CONEXÃO COM BANCO DE DADOS
// ============================================

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB conectado com sucesso!'))
.catch(err => console.error('❌ Erro ao conectar MongoDB:', err));

// ============================================
// SCHEMAS E MODELS
// ============================================

// Schema de Usuário
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Moderador', 'Usuário'], default: 'Usuário' },
    avatar: { type: String, default: null },
    status: { type: String, enum: ['online', 'away', 'offline'], default: 'offline' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Schema de Canal
const channelSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    type: { type: String, enum: ['public', 'private'], default: 'public' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const Channel = mongoose.model('Channel', channelSchema);

// Schema de Mensagem
const messageSchema = new mongoose.Schema({
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Schema de Stream
const streamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
    scheduledDate: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 }, // em segundos
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxViewers: { type: Number, default: 0 },
    recordingUrl: { type: String },
    isPublic: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Stream = mongoose.model('Stream', streamSchema);

// Schema de Analytics
const analyticsSchema = new mongoose.Schema({
    stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
    date: { type: Date, default: Date.now },
    totalViews: { type: Number, default: 0 },
    avgWatchTime: { type: Number, default: 0 }, // em segundos
    engagement: { type: Number, default: 0 }, // percentual
    chatMessages: { type: Number, default: 0 },
    reactions: {
        likes: { type: Number, default: 0 },
        loves: { type: Number, default: 0 }
    }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Verificar se usuário já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'Usuário'
        });

        await user.save();

        // Gerar token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuário
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Atualizar status e último login
        user.status = 'online';
        user.lastLogin = new Date();
        await user.save();

        // Gerar token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
});

// ============================================
// ROTAS DE USUÁRIOS
// ============================================

// Listar usuários
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ name: 1 });

        res.json({ users });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// Buscar usuário por ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// Atualizar status do usuário
app.patch('/api/users/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Notificar via WebSocket
        io.emit('user_status_changed', {
            userId: user._id,
            status: user.status,
            name: user.name
        });

        res.json({ user });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// ============================================
// ROTAS DE CANAIS
// ============================================

// Listar canais
app.get('/api/channels', authenticateToken, async (req, res) => {
    try {
        const channels = await Channel.find()
            .populate('createdBy', 'name email')
            .populate('members', 'name email status')
            .sort({ name: 1 });

        res.json({ channels });
    } catch (error) {
        console.error('Erro ao listar canais:', error);
        res.status(500).json({ error: 'Erro ao listar canais' });
    }
});

// Criar canal
app.post('/api/channels', authenticateToken, async (req, res) => {
    try {
        const { name, description, type } = req.body;

        const channel = new Channel({
            name,
            description,
            type: type || 'public',
            createdBy: req.user.id,
            members: [req.user.id]
        });

        await channel.save();
        await channel.populate('createdBy', 'name email');

        io.emit('channel_created', { channel });

        res.status(201).json({
            message: 'Canal criado com sucesso',
            channel
        });
    } catch (error) {
        console.error('Erro ao criar canal:', error);
        res.status(500).json({ error: 'Erro ao criar canal' });
    }
});

// Entrar em um canal
app.post('/api/channels/:id/join', authenticateToken, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: 'Canal não encontrado' });
        }

        if (!channel.members.includes(req.user.id)) {
            channel.members.push(req.user.id);
            await channel.save();
        }

        await channel.populate('members', 'name email status');

        io.to(req.params.id).emit('user_joined_channel', {
            userId: req.user.id,
            channelId: channel._id
        });

        res.json({ message: 'Entrou no canal com sucesso', channel });
    } catch (error) {
        console.error('Erro ao entrar no canal:', error);
        res.status(500).json({ error: 'Erro ao entrar no canal' });
    }
});

// ============================================
// ROTAS DE MENSAGENS
// ============================================

// Listar mensagens de um canal
app.get('/messages', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, skip = 0 } = req.query;

        const messages = await Message.find({ channel: req.params.channelId })
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ messages: messages.reverse() });
    } catch (error) {
        console.error('Erro ao listar mensagens:', error);
        res.status(500).json({ error: 'Erro ao listar mensagens' });
    }
});

// Enviar mensagem
app.post('messages', authenticateToken, async (req, res) => {
    try {
        const { text, attachments } = req.body;

        const message = new Message({
            channel: req.params.channelId,
            user: req.user.id,
            text,
            attachments: attachments || []
        });

        await message.save();
        await message.populate('user', 'name email avatar');

        // Enviar via WebSocket para todos no canal
        io.to(req.params.channelId).emit('new_message', { message });

        res.status(201).json({ message });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// ============================================
// ROTAS DE STREAMS
// ============================================

// Listar streams
app.get('streams', authenticateToken, async (req, res) => {
    try {
        const { status, limit = 20 } = req.query;
        const query = status ? { status } : {};

        const streams = await Stream.find(query)
            .populate('host', 'name email avatar')
            .sort({ scheduledDate: -1 })
            .limit(parseInt(limit));

        res.json({ streams });
    } catch (error) {
        console.error('Erro ao listar streams:', error);
        res.status(500).json({ error: 'Erro ao listar streams' });
    }
});

// Criar stream
app.post('streams', authenticateToken, async (req, res) => {
    try {
        const { title, description, scheduledDate, isPublic } = req.body;

        const stream = new Stream({
            title,
            description,
            host: req.user.id,
            scheduledDate: new Date(scheduledDate),
            isPublic: isPublic !== false
        });

        await stream.save();
        await stream.populate('host', 'name email avatar');

        io.emit('stream_scheduled', { stream });

        res.status(201).json({
            message: 'Stream agendada com sucesso',
            stream
        });
    } catch (error) {
        console.error('Erro ao criar stream:', error);
        res.status(500).json({ error: 'Erro ao criar stream' });
    }
});

// Iniciar stream
app.post('streams/', authenticateToken, async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id);
        if (!stream) {
            return res.status(404).json({ error: 'Stream não encontrada' });
        }

        if (stream.host.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Apenas o host pode iniciar a stream' });
        }

        stream.status = 'live';
        stream.startedAt = new Date();
        await stream.save();

        io.emit('stream_started', { streamId: stream._id, stream });

        res.json({ message: 'Stream iniciada', stream });
    } catch (error) {
        console.error('Erro ao iniciar stream:', error);
        res.status(500).json({ error: 'Erro ao iniciar stream' });
    }
});

// Encerrar stream
app.post('/streams/', authenticateToken, async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id);
        if (!stream) {
            return res.status(404).json({ error: 'Stream não encontrada' });
        }

        if (stream.host.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Apenas o host pode encerrar a stream' });
        }

        stream.status = 'ended';
        stream.endedAt = new Date();
        stream.duration = Math.floor((stream.endedAt - stream.startedAt) / 1000);
        await stream.save();

        // Criar analytics
        const analytics = new Analytics({
            stream: stream._id,
            totalViews: stream.viewers.length,
            maxViewers: stream.maxViewers
        });
        await analytics.save();

        io.emit('stream_ended', { streamId: stream._id });

        res.json({ message: 'Stream encerrada', stream, analytics });
    } catch (error) {
        console.error('Erro ao encerrar stream:', error);
        res.status(500).json({ error: 'Erro ao encerrar stream' });
    }
});

// Entrar como viewer na stream
app.post('/streams/', authenticateToken, async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id);
        if (!stream) {
            return res.status(404).json({ error: 'Stream não encontrada' });
        }

        if (!stream.viewers.includes(req.user.id)) {
            stream.viewers.push(req.user.id);
            if (stream.viewers.length > stream.maxViewers) {
                stream.maxViewers = stream.viewers.length;
            }
            await stream.save();
        }

        io.to(req.params.id).emit('viewer_joined', {
            streamId: stream._id,
            viewerCount: stream.viewers.length
        });

        res.json({ message: 'Entrou na stream', stream });
    } catch (error) {
        console.error('Erro ao entrar na stream:', error);
        res.status(500).json({ error: 'Erro ao entrar na stream' });
    }
});

// ============================================
// ROTAS DE ANALYTICS
// ============================================

// Dashboard de analytics
app.get('/dashboard/', authenticateToken, async (req, res) => {
    try {
        const totalStreams = await Stream.countDocuments();
        const liveStreams = await Stream.countDocuments({ status: 'live' });
        
        const monthlyStats = await Stream.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setDate(1))
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    avgViewers: { $avg: '$maxViewers' }
                }
            }
        ]);

        const topStreams = await Stream.find({ status: 'ended' })
            .populate('host', 'name')
            .sort({ maxViewers: -1 })
            .limit(5);

        res.json({
            totalStreams,
            liveStreams,
            monthlyMinutes: monthlyStats[0]?.totalDuration / 60 || 0,
            avgViewers: Math.floor(monthlyStats[0]?.avgViewers || 0),
            topStreams
        });
    } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        res.status(500).json({ error: 'Erro ao buscar analytics' });
    }
});

// Analytics por stream
app.get('/streams/', authenticateToken, async (req, res) => {
    try {
        const analytics = await Analytics.findOne({ stream: req.params.id })
            .populate('stream', 'title host duration');

        if (!analytics) {
            return res.status(404).json({ error: 'Analytics não encontrados' });
        }

        res.json({ analytics });
    } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        res.status(500).json({ error: 'Erro ao buscar analytics' });
    }
});

// ============================================
// WEBSOCKET - SOCKET.IO
// ============================================

io.on('connection', (socket) => {
    console.log('🔌 Novo cliente conectado:', socket.id);

    // Autenticar socket
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.id;
            socket.userEmail = decoded.email;

            // Atualizar status do usuário
            await User.findByIdAndUpdate(decoded.id, { status: 'online' });

            socket.emit('authenticated', { success: true });
            console.log('✅ Socket autenticado:', decoded.email);
        } catch (error) {
            socket.emit('authentication_error', { error: 'Token inválido' });
        }
    });

    // Entrar em um canal
    socket.on('join_channel', (channelId) => {
        socket.join(channelId);
        console.log(`👤 Usuário ${socket.userId} entrou no canal ${channelId}`);
        socket.to(channelId).emit('user_joined', { userId: socket.userId });
    });

    // Sair de um canal
    socket.on('leave_channel', (channelId) => {
        socket.leave(channelId);
        console.log(`👤 Usuário ${socket.userId} saiu do canal ${channelId}`);
        socket.to(channelId).emit('user_left', { userId: socket.userId });
    });

    // Entrar em uma stream
    socket.on('join_stream', (streamId) => {
        socket.join(`stream_${streamId}`);
        console.log(`📺 Usuário ${socket.userId} entrou na stream ${streamId}`);
        io.to(`stream_${streamId}`).emit('viewer_count_update', {
            streamId,
            count: io.sockets.adapter.rooms.get(`stream_${streamId}`)?.size || 0
        });
    });

    // Sair de uma stream
    socket.on('leave_stream', (streamId) => {
        socket.leave(`stream_${streamId}`);
        console.log(`📺 Usuário ${socket.userId} saiu da stream ${streamId}`);
        io.to(`stream_${streamId}`).emit('viewer_count_update', {
            streamId,
            count: io.sockets.adapter.rooms.get(`stream_${streamId}`)?.size || 0
        });
    });

    // Usuário está digitando
    socket.on('typing', ({ channelId, isTyping }) => {
        socket.to(channelId).emit('user_typing', {
            userId: socket.userId,
            isTyping
        });
    });

    // Desconexão
    socket.on('disconnect', async () => {
        console.log('🔌 Cliente desconectado:', socket.id);
        if (socket.userId) {
            await User.findByIdAndUpdate(socket.userId, { status: 'offline' });
            io.emit('user_disconnected', { userId: socket.userId });
        }
    });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 ============================================');
    console.log('🚀 SERVIDOR STREAMING/CHAT INICIADO COM SUCESSO!');
    console.log('🚀 ============================================');
    console.log(`📡 Servidor rodando na porta: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
    console.log('🔌 WebSocket (Socket.IO) ativo');
    console.log('✅ Todas as rotas e serviços prontos!');
    console.log('');
    app.listen(3000);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});