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
        const data = JSON.parse(message.toString()); // Ensure message is a string
        console.log('Received signaling message:', data);
        if (data.type === 'offer') {
            await pc.setRemoteDescription(new wrtc.RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify(answer));
            console.log('Answer sent');
        } else if (data.type === 'candidate' && data.candidate) {
            try {
                const candidateObj = {
                    candidate: data.candidate,
                    sdpMid: data.sdpMid || '0',
                    sdpMLineIndex: data.sdpMLineIndex !== undefined ? Number(data.sdpMLineIndex) : 0
                };
                await pc.addIceCandidate(new wrtc.RTCIceCandidate(candidateObj));
                console.log('ICE candidate added:', candidateObj);
            } catch (err) {
                console.error('Error adding ICE candidate:', err.message);
            }
        }
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            const candidateMsg = {
                type: 'candidate',
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
            };
            ws.send(JSON.stringify(candidateMsg));
            console.log('Sent ICE candidate:', candidateMsg);
        }
    };

    console.log('Waiting for client offer...');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
