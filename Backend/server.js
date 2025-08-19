require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');
const express = require('express');
const authRoutes = require('./routes/auth');
const { handleConnection } = require('./socket/socketHandler');
const chatRoutes = require('./routes/chat');
const messagesRoutes = require('./routes/messages');
const userRoutes = require('./routes/user');
const cors = require('./config/cors');

const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors);

// Serve static files from assets directory
app.use('/assets', express.static('assets'));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/chat', chatRoutes);

// Start server

//Integrating Socket.io
const server = http.createServer(app);

const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

// Socket.IO setup
const io = socketIo(server, {
  cors: corsOptions
});


// Socket.IO connection handling
handleConnection(io);

server.listen(process.env.BACKEND_PORT, () => console.log(`Server running on port ${process.env.BACKEND_PORT}`));