import fs from 'fs';
import { Client } from 'lrclib-api';

// Type for query object
interface Query {
  track_name: string;
  artist_name: string;
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

// Exported function to fetch lyrics and write output.lrc
export const fetchLyricsAndWriteLRC = async (): Promise<void> => {
  try {
    const { title, artist } = await readFileAndExtractData();

    if (!title || !artist) {
      console.log('Title or artist missing in the file.');
      return;
    }

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

    // Convert synced lyrics to LRC format
    const lrcContent = convertToLRC(syncedLyrics);

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
