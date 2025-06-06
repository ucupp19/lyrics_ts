"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const wss = new ws_1.WebSocketServer({ port: 8000 });
let currentPosition = '0';
wss.on('connection', (ws) => {
    console.log('Client connected');
    // Initialize track, artist names, and position
    let track_name = 'Sample Track';
    let artist_name = 'Sample Artist';
    let position = currentPosition;
    // Function to add spaces between words in artist_name if missing
    const normalizeArtistName = (name) => {
        return name.replace(/([a-z])([A-Z])/g, '$1 $2');
    };
    // Function to send current track info to client
    const sendTrackInfo = () => {
        const trackInfo = {
            track_name,
            artist_name,
            position,
        };
        ws.send(JSON.stringify(trackInfo));
    };
    // Function to write current info to lyrics.txt
    const writeToFile = () => {
        // Clean the track_name by removing artist name prefix and (official video)
        let cleanedTitle = track_name;
        // Remove artist name prefix if title contains "Artist - Song" format
        if (cleanedTitle.includes(' - ')) {
            cleanedTitle = cleanedTitle.split(' - ').slice(1).join(' - ').trim();
        }
        // Remove (official video), (official music video), and (official lyric video) phrases case insensitive
        cleanedTitle = cleanedTitle.replace(/\(official( music| lyric)? video\)/i, '').trim();
        // Remove extra spaces and hyphens leftover
        cleanedTitle = cleanedTitle.replace(/^\s*-\s*/, '').replace(/\s*-\s*$/, '').trim();
        // Remove multiple spaces
        cleanedTitle = cleanedTitle.replace(/\s{2,}/g, ' ');
        // Normalize artist_name before writing
        const normalizedArtist = normalizeArtistName(artist_name);
        const content = `Title: ${cleanedTitle}\nArtist: ${normalizedArtist}\nPosition: ${position}\n`;
        fs_1.default.writeFile('lyrics.txt', content, (err) => {
            if (err) {
                console.error('Error writing to lyrics.txt:', err);
            }
            else {
                console.log('lyrics.txt updated');
            }
        });
    };
    // Send initial track info and write to file
    sendTrackInfo();
    writeToFile();
    ws.on('message', (message) => {
        const msg = message.toString();
        console.log('Received from client:', msg);
        if (msg.startsWith('TITLE:')) {
            track_name = msg.substring('TITLE:'.length);
            sendTrackInfo();
            writeToFile();
        }
        else if (msg.startsWith('ARTIST:')) {
            artist_name = msg.substring('ARTIST:'.length);
            sendTrackInfo();
            writeToFile();
        }
        else if (msg.startsWith('POSITION:')) {
            position = msg.substring('POSITION:'.length);
            currentPosition = position;
            sendTrackInfo();
            writeToFile();
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
// HTTP server to expose current position
const server = http_1.default.createServer((req, res) => {
    if (req.url === '/position') {
        console.log('HTTP /position requested, currentPosition:', currentPosition); // Debug log
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ position: currentPosition }));
    }
    else {
        res.writeHead(404);
        res.end();
    }
});
server.listen(8080, () => {
    console.log('HTTP server listening on port 8080');
});
