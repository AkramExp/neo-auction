import { io } from 'socket.io-client';

// Use the same port as your server
const SOCKET_URL = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : 'https://neo-auction.onrender.com';

console.log('Connecting to Socket.IO server:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
    // Force WebSocket first, fallback to polling
    transports: ['websocket', 'polling'],

    // Auto-connection settings - allow public access
    autoConnect: true,

    // Authentication (only for logged-in users)
    auth: (cb) => {
        const token = localStorage.getItem('token');
        cb({ token });
    },

    // Reconnection settings
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

// Add connection event listeners for debugging
socket.on('connect', () => {
    const token = localStorage.getItem('token');
    console.log('✅ Socket.IO connected successfully. ID:', socket.id, 'Authenticated:', !!token);
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection error:', error.message);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Socket.IO disconnected:', reason);
});

socket.on('reconnect_attempt', (attempt) => {
    console.log(`🔄 Socket.IO reconnection attempt: ${attempt}`);
});

socket.on('reconnect_failed', () => {
    console.error('❌ Socket.IO reconnection failed');
});

// Public event listeners for spectator mode
socket.on('auction:state', (data) => {
    console.log('Spectator: Received auction state update');
});

socket.on('auction:newPlayer', (data) => {
    console.log('Spectator: New player on block');
});

socket.on('auction:bidUpdate', (data) => {
    console.log('Spectator: Bid update received');
});

export const connectSocket = (token) => {
    if (token) {
        socket.auth = { token };
    }
    socket.connect();
};

export const disconnectSocket = () => {
    socket.disconnect();
};