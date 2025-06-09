import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8090;

// Function to parse LRC formatted lyrics into JSON array
interface LyricLine {
  time: number; // seconds
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

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    // Serve the HTML page
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
    // Serve the lyrics JSON
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
    // Proxy the position from webnowplaying.ts API
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

server.listen(PORT, () => {
  console.log(`Lyrics display server running at http://localhost:${PORT}`);
});
