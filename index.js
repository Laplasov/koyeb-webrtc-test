const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const wrtc = require('wrtc');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
    res.send('WebRTC Server is running!');
});

wss.on('connection', async (ws) => {
    console.log('Client connected via WebSocket');

    const pc = new wrtc.RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    const dc = pc.createDataChannel('testChannel');
    dc.onopen = () => console.log('Data channel opened');
    dc.onmessage = (event) => {
        const message = event.data;
        console.log('Received via WebRTC:', message);
        dc.send(message); // Echo back
    };
    dc.onclose = () => console.log('Data channel closed');

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        if (data.type === 'offer') {
            await pc.setRemoteDescription(new wrtc.RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify(answer));
        } else if (data.candidate) {
            await pc.addIceCandidate(new wrtc.RTCIceCandidate(data));
        }
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
    };

    console.log('Waiting for client offer...');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});