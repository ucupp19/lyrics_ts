import fs from 'fs';
import { Client } from 'lrclib-api';
import fetch from 'node-fetch'; // add fetch import for API calls


// Type for query object
interface Query {
  track_name: string;
  artist_name: string;
}

// Type for new API lyrics JSON format
interface ApiLyric {
  hundredths: number;
  minutes: number;
  seconds: number;
  text: string;
}

interface ApiResponse {
  lyrics: ApiLyric[];
}

// Function to read the file and extract metadata
const readFileAndExtractData = (): Promise<{ title: string; artist: string }> => {
  return new Promise((resolve, reject) => {
    fs.readFile('lyrics.txt', 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const lines = data.split('\n');
      let title = '';
      let artist = '';

      lines.forEach(line => {
        if (line.startsWith('Title:')) {
          title = line.replace('Title:', '').trim();
        } else if (line.startsWith('Artist:')) {
          artist = line.replace('Artist:', '').trim();
        }
      });

      resolve({ title, artist });
    });
  });
};

const fetchLyricsFromApi = async (artist: string, title: string): Promise<ApiLyric[] | null> => {
  try {
    const url = `http://127.0.0.1:5000/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('API response not ok:', response.status);
      return null;
    }
    const data = await response.json() as ApiResponse;
    if (!data.lyrics || data.lyrics.length === 0) {
      return null;
    }
    return data.lyrics;
  } catch (error) {
    console.error('Error fetching from API:', error);
    return null;
  }
};

// Exported function to fetch lyrics and write output.lrc
export const fetchLyricsAndWriteLRC = async (): Promise<void> => {
  try {
    const { title, artist } = await readFileAndExtractData();

    if (!title || !artist) {
      console.log('Title or artist missing in the file.');
      return;
    }

    // Try fetching from new API first
    const apiLyrics = await fetchLyricsFromApi(artist, title);

    let lrcContent = '';

    if (apiLyrics && apiLyrics.length > 0) {
      console.log('Lyrics fetched from new API.');
      lrcContent = apiLyrics
        .map(({ hundredths, minutes, seconds, text }) => {
          const totalSeconds = minutes * 60 + seconds + hundredths / 100;
          const min = Math.floor(totalSeconds / 60);
          const sec = (totalSeconds % 60).toFixed(2).padStart(5, '0');
          return `[${min.toString().padStart(2, '0')}:${sec}]${text}`;
        })
        .join('\n');
    } else {
      console.log('No lyrics from new API, falling back to lrclib-api.');

      const query: Query = {
        track_name: title,
        artist_name: artist,
      };

      const client = new Client();

      const syncedLyrics = await client.getSynced(query);
      console.log('Synced Lyrics:', syncedLyrics);

      if (!syncedLyrics) {
        console.error('No synced lyrics found.');
        return;
      }

      // Function to convert synced lyrics array to LRC format string
      const convertToLRC = (lyrics: Array<{ text: string; startTime?: number }>): string => {
        return lyrics
          .map(({ text, startTime }) => {
            const time = startTime ?? 0;
            const minutes = Math.floor(time / 60);
            const seconds = (time % 60).toFixed(2).padStart(5, '0');
            return `[${minutes.toString().padStart(2, '0')}:${seconds}]${text}`;
          })
          .join('\n');
      };

      lrcContent = convertToLRC(syncedLyrics);
    }

    // Write LRC content to output.lrc file
    fs.writeFile('output.lrc', lrcContent, (err) => {
      if (err) {
        console.error('Error writing LRC file:', err);
      } else {
        console.log('LRC file has been saved as output.lrc');
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
};
