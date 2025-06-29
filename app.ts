import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fetchLyricsAndWriteLRC } from './lyricsApp';
import { Client } from 'lrclib-api';

// Import or replicate webnowplaying.ts logic here
const wss = new WebSocketServer({ port: 8000 });

let currentPosition = '0';

wss.on('connection', (ws) => {
  console.log('Client connected');

  let track_name = 'Sample Track';
  let artist_name = 'Sample Artist';
  let position = currentPosition;

  let lastTrack = '';
  let lastArtist = '';

  const normalizeArtistName = (name: string): string => {
    return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const sendTrackInfo = () => {
    const trackInfo = {
      track_name,
      artist_name,
      position,
    };
    ws.send(JSON.stringify(trackInfo));
  };

  const writeToFile = () => {
    let cleanedTitle = track_name;

    if (cleanedTitle.includes(' - ')) {
      cleanedTitle = cleanedTitle.split(' - ').slice(1).join(' - ').trim();
    }

    cleanedTitle = cleanedTitle.replace(/\(official( music| lyric)? video\)/i, '').trim();
    cleanedTitle = cleanedTitle.replace(/^\s*-\s*/, '').replace(/\s*-\s*$/, '').trim();
    cleanedTitle = cleanedTitle.replace(/\s{2,}/g, ' ');

    const normalizedArtist = normalizeArtistName(artist_name);

    const content = `Title: ${cleanedTitle}\nArtist: ${normalizedArtist}\nPosition: ${position}\n`;

    // Only update files if track or artist changed
    if (cleanedTitle !== lastTrack || normalizedArtist !== lastArtist) {
      lastTrack = cleanedTitle;
      lastArtist = normalizedArtist;

      fs.writeFile('lyrics.txt', content, (err) => {
        if (err) {
          console.error('Error writing to lyrics.txt:', err);
        } else {
          console.log('lyrics.txt updated');
          // After updating lyrics.txt, fetch lyrics and write output.lrc
          fetchLyricsAndWriteLRC();
        }
      });
    }
  };

  sendTrackInfo();
  writeToFile();

  ws.on('message', (message: any) => {
    const msg = message.toString();
    //console.log('Received from client:', msg);

    if (msg.startsWith('TITLE:')) {
      track_name = msg.substring('TITLE:'.length);
      sendTrackInfo();
      writeToFile();
    } else if (msg.startsWith('ARTIST:')) {
      artist_name = msg.substring('ARTIST:'.length);
      sendTrackInfo();
      writeToFile();
    } else if (msg.startsWith('POSITION:')) {
      position = msg.substring('POSITION:'.length);
      currentPosition = position;
      sendTrackInfo();
      // Do not write file or fetch lyrics on position update
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
const positionServer = http.createServer((req, res) => {
  if (req.url === '/position') {
    //console.log('HTTP /position requested, currentPosition:', currentPosition);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ position: currentPosition }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

positionServer.listen(8080, () => {
  console.log('HTTP server listening on port 8080');
});

// Lyrics display server logic from lyricsDisplayServer.ts
const PORT = 8090;

interface LyricLine {
  time: number;
  text: string;
}

const parseLRC = (lrcContent: string): LyricLine[] => {
  const lines = lrcContent.split('\n');
  const lyricLines: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2}\.\d{2})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const timeInSeconds = minutes * 60 + seconds;
      const text = line.replace(timeRegex, '').trim();
      lyricLines.push({ time: timeInSeconds, text });
    }
  }
  return lyricLines;
};

const lyricsServer = http.createServer((req, res) => {
  if (req.url === '/') {
    const filePath = path.join(__dirname, 'lyricsDisplay.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/lyrics') {
    fs.readFile(path.join(__dirname, 'output.lrc'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading lyrics');
        return;
      }
      const lyrics = parseLRC(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(lyrics));
    });
  } else if (req.url === '/position') {
    http.get('http://localhost:8080/position', (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      apiRes.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', () => {
      res.writeHead(500);
      res.end('Error fetching position');
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

lyricsServer.listen(PORT, () => {
  console.log(`Lyrics display server running at http://localhost:${PORT}`);
});
