import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import auctionHandler from './socket/auctionHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enhanced CORS configuration
const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL, "http://127.0.0.1:3000"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling'] // Explicitly enable both transports
});

// Connect to MongoDB
connectDB();

// Enhanced Express CORS middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL, "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.IO
auctionHandler(io);

// Socket.IO connection logging for debugging
io.engine.on("connection", (rawSocket) => {
    console.log("Raw socket connection established");
});

io.on("connection", (socket) => {
    console.log("Socket.IO client connected:", socket.id);

    socket.on("disconnect", (reason) => {
        console.log("Socket.IO client disconnected:", socket.id, reason);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS enabled for: ${process.env.FRONTEND_URL}, http://127.0.0.1:3000`);
});