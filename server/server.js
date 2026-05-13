/**
 * School Battle Royale - Express Server
 * Socket.IO multiplayer game server
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { GameManager } = require('./multiplayer.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Game manager instance
const gameManager = new GameManager(io);

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    /**
     * Player joins game
     */
    socket.on('joinGame', (data) => {
        gameManager.playerJoin(socket, data);
    });
    
    /**
     * Player movement
     */
    socket.on('playerMoved', (data) => {
        gameManager.updatePlayerPosition(data);
    });
    
    /**
     * Player ready for match
     */
    socket.on('matchReady', (data) => {
        gameManager.playerReady(data.playerID);
    });
    
    /**
     * Player leaves game
     */
    socket.on('leaveGame', (data) => {
        gameManager.playerLeave(data.playerID);
    });
    
    /**
     * Loot collected
     */
    socket.on('lootCollected', (data) => {
        gameManager.collectLoot(data);
    });
    
    /**
     * Player attack
     */
    socket.on('playerAttack', (data) => {
        gameManager.playerAttack(data);
    });
    
    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        gameManager.playerDisconnect(socket.id);
    });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🎮 School Battle Royale Server Running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`\n✨ Game is ready for players...\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = { app, server, io };
