"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLyricsAndWriteLRC = void 0;
const fs_1 = __importDefault(require("fs"));
const lrclib_api_1 = require("lrclib-api");
const node_fetch_1 = __importDefault(require("node-fetch")); // add fetch import for API calls
// Function to read the file and extract metadata
const readFileAndExtractData = () => {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile('lyrics.txt', 'utf8', (err, data) => {
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
                }
                else if (line.startsWith('Artist:')) {
                    artist = line.replace('Artist:', '').trim();
                }
            });
            resolve({ title, artist });
        });
    });
};
const fetchLyricsFromApi = (artist, title) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `http://127.0.0.1:5000/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
        const response = yield (0, node_fetch_1.default)(url);
        if (!response.ok) {
            console.error('API response not ok:', response.status);
            return null;
        }
        const data = yield response.json();
        if (!data.lyrics || data.lyrics.length === 0) {
            return null;
        }
        return data.lyrics;
    }
    catch (error) {
        console.error('Error fetching from API:', error);
        return null;
    }
});
// Exported function to fetch lyrics and write output.lrc
const fetchLyricsAndWriteLRC = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, artist } = yield readFileAndExtractData();
        if (!title || !artist) {
            console.log('Title or artist missing in the file.');
            return;
        }
        // Try fetching from new API first
        const apiLyrics = yield fetchLyricsFromApi(artist, title);
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
        }
        else {
            console.log('No lyrics from new API, falling back to lrclib-api.');
            const query = {
                track_name: title,
                artist_name: artist,
            };
            const client = new lrclib_api_1.Client();
            const syncedLyrics = yield client.getSynced(query);
            console.log('Synced Lyrics:', syncedLyrics);
            if (!syncedLyrics) {
                console.error('No synced lyrics found.');
                return;
            }
            // Function to convert synced lyrics array to LRC format string
            const convertToLRC = (lyrics) => {
                return lyrics
                    .map(({ text, startTime }) => {
                    const time = startTime !== null && startTime !== void 0 ? startTime : 0;
                    const minutes = Math.floor(time / 60);
                    const seconds = (time % 60).toFixed(2).padStart(5, '0');
                    return `[${minutes.toString().padStart(2, '0')}:${seconds}]${text}`;
                })
                    .join('\n');
            };
            lrcContent = convertToLRC(syncedLyrics);
        }
        // Write LRC content to output.lrc file
        fs_1.default.writeFile('output.lrc', lrcContent, (err) => {
            if (err) {
                console.error('Error writing LRC file:', err);
            }
            else {
                console.log('LRC file has been saved as output.lrc');
            }
        });
    }
    catch (error) {
        console.error('Error:', error);
    }
});
exports.fetchLyricsAndWriteLRC = fetchLyricsAndWriteLRC;
