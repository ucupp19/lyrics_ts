import fs from 'fs';
import http from 'http';

// Interface for a single lyric line with timestamp
interface LyricLine {
  time: number; // time in seconds
  text: string;
}

// Function to parse LRC formatted lyrics into LyricLine array
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

// Function to find the current lyric index based on position in seconds
const findCurrentLyricIndex = (lyrics: LyricLine[], position: number): number => {
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (position >= lyrics[i].time) {
      return i;
    }
  }
  return -1;
};

// Function to clear console (for better display)
const clearConsole = () => {
  // Commented out to avoid clearing console and losing logs
process.stdout.write('\x1Bc');
};

// Function to fetch current position from HTTP API
const fetchPosition = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8080/position', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const posStr = json.position;
          console.log('Raw position string:', posStr); // Debug log
          let posSeconds = 0;
          if (posStr.includes(':')) {
            // Parse mm:ss format
            const posParts = posStr.split(':');
            if (posParts.length === 2) {
              const minutes = parseInt(posParts[0], 10);
              const seconds = parseFloat(posParts[1]);
              posSeconds = minutes * 60 + seconds;
            } else {
              posSeconds = 0;
            }
          } else {
            posSeconds = parseFloat(posStr);
          }
          console.log('Parsed position in seconds:', posSeconds); // Debug log
          resolve(posSeconds);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Main function to read files, parse, and display synced lyrics continuously
const displaySyncedLyrics = () => {
  try {
    const lrcContent = fs.readFileSync('output.lrc', 'utf8');
    const lyrics = parseLRC(lrcContent);

    const updateDisplay = async () => {
      try {
        const position = await fetchPosition();
        console.log('Fetched position:', position); // Debug log
        const currentIndex = findCurrentLyricIndex(lyrics, position);
        console.log('Current lyric index:', currentIndex); // Debug log

        clearConsole();
        console.log('Lyrics synced to position:', position, 'seconds');
        if (currentIndex >= 0 && currentIndex < lyrics.length) {
          console.log('> ' + lyrics[currentIndex].text); // Display only current line
        } else {
          console.log('No lyric line found for current position.');
        }
      } catch (error) {
        console.error('Error fetching position:', error);
      }
    };

    // Initial display
    updateDisplay();

    // Update every second
    setInterval(updateDisplay, 1000);

  } catch (error) {
    console.error('Error reading or processing output.lrc:', error);
  }
};

// Run the display function
displaySyncedLyrics();
