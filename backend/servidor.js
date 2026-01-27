// ==========================================================
// SERVIDOR BACKEND - SISTEMA DE STREAMING/CHAT EMPRESARIAL
// Node.js + Express + Socket.IO + MongoDB
// ==========================================================

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// SWAGGER
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// CONFIGURAÇÕES GERAIS
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_distribuida';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/streaming_chat';

// ============================================
// CONFIGURAÇÃO SWAGGER
// ============================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Chat Distribuído',
      version: '1.0.0',
      description: 'API para Sistema de Streaming e Chat Empresarial',
      contact: { name: "Aluno DWM-PL" }
    },
    servers: [{ url: 'http://localhost:3000', description: 'Servidor Docker' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./servidor.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ============================================
// SERVIDOR HTTP & SOCKET.IO
// ============================================
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// BASE DE DADOS (MONGODB)
// ============================================
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado com sucesso!'))
  .catch(err => console.error('❌ Erro ao conectar MongoDB:', err));

// ============================================
// SCHEMAS E MODELS
// ============================================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Moderador', 'utilizador'], default: 'utilizador' },
  status: { type: String, default: 'offline' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  type: { type: String, default: 'public' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Channel = mongoose.model('Channel', channelSchema);

const messageSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const streamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  scheduledDate: Date,
  startedAt: Date,
  endedAt: Date,
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true }
});
const Stream = mongoose.model('Stream', streamSchema);

// ============================================
// MIDDLEWARE AUTENTICAÇÃO
// ============================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// ============================================
// ROTAS: AUTENTICAÇÃO
// ============================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Regista um novo utilizador
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *     responses:
 *       201:
 *         description: Utilizador criado com sucesso
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email já existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: role || 'utilizador' });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registado com sucesso', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no registo' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de utilizador
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login efetuado com sucesso
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    user.status = 'online';
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Login OK', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ============================================
// ROTAS: CANAIS
// ============================================

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Lista todos os canais
 *     tags: [Canais]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de canais obtida
 */
app.get('/api/channels', authenticateToken, async (req, res) => {
  const channels = await Channel.find().populate('createdBy', 'name');
  res.json({ channels });
});

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: Cria um novo canal
 *     tags: [Canais]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Canal criado
 */
app.post('/api/channels', authenticateToken, async (req, res) => {
  try {
    const channel = new Channel({ ...req.body, createdBy: req.user.id, members: [req.user.id] });
    await channel.save();
    io.emit('channel_created', { channel });
    res.status(201).json({ channel });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar canal' });
  }
});

// ============================================
// ROTAS: MENSAGENS
// ============================================

/**
 * @swagger
 * /api/messages/{channelId}:
 *   get:
 *     summary: Obtém histórico de mensagens
 *     tags: [Mensagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de mensagens
 */
app.get('/api/messages/:channelId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ channel: req.params.channelId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar mensagens' });
  }
});

/**
 * @swagger
 * /api/messages/{channelId}:
 *   post:
 *     summary: Envia uma nova mensagem
 *     tags: [Mensagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201:
 *         description: Mensagem enviada
 */
app.post('/api/messages/:channelId', authenticateToken, async (req, res) => {
  try {
    const message = new Message({
      channel: req.params.channelId,
      user: req.user.id,
      text: req.body.text
    });
    await message.save();
    await message.populate('user', 'name');
    io.to(req.params.channelId).emit('new_message', { message });
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// ============================================
// ROTAS: UTILIZADORES
// ============================================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lista todos os utilizadores registados
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de utilizadores retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 */

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // O .select('-password') garante que a password NÃO é enviada para o frontend
    const users = await User.find().select('-password'); 
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

// ============================================
// SOCKET.IO EVENTOS
// ============================================
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.emit('authenticated', { success: true });
    } catch (e) {
      socket.emit('auth_error');
    }
  });

  socket.on('join_channel', (id) => socket.join(id));
  socket.on('join_stream', (id) => socket.join(id));
});

// ============================================
// ARRANQUE
// ============================================
server.listen(PORT, () => {
  console.log('\n🚀 SERVIDOR PRONTO!');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`📄 Swagger: http://localhost:${PORT}/api-docs\n`);
});
