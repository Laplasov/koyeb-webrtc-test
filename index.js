const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve a simple homepage
app.get('/', (req, res) => {
    res.send('WebSocket Echo Server is running!');
});

// WebSocket connection
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log('Received:', message);
        ws.send(message); // Echo the message back
    });
    ws.on('close', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});