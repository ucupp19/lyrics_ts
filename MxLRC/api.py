from flask import Flask, request, jsonify
import logging
from mxlrc import Musixmatch, Song

app = Flask(__name__)

# Setup logging
logging.basicConfig(level=logging.INFO)

# Use default token from mxlrc.py or environment variable if needed
DEFAULT_MX_TOKEN = "25060875d0b0d5587da1f138617c4d5fb2fdaf359b2c96b04eb29d"

@app.route('/lyrics', methods=['GET'])
def get_lyrics():
    artist = request.args.get('artist')
    title = request.args.get('title')

    if not artist or not title:
        return jsonify({"error": "Missing required query parameters: artist and title"}), 400

    mx = Musixmatch(DEFAULT_MX_TOKEN)
    song = Song(artist, title)

    logging.info(f"Fetching lyrics for: {artist} - {title}")
    body = mx.find_lyrics(song)
    if body is None:
        return jsonify({"error": "Lyrics not found or an error occurred"}), 404

    song.update_info(body)
    mx.get_synced(song, body)
    mx.get_unsynced(song, body)

    # Prepare JSON response
    response = {
        "lyrics": []
    }

    # Prefer synced lyrics if available
    if song.subtitles:
        for line in song.subtitles:
            response["lyrics"].append({
                "text": line.get("text", ""),
                "minutes": line.get("minutes", 0),
                "seconds": line.get("seconds", 0),
                "hundredths": line.get("hundredths", 0)
            })
    elif song.lyrics:
        # Unsynced lyrics have no timing info, set to 0
        for line in song.lyrics:
            response["lyrics"].append({
                "text": line.get("text", ""),
                "minutes": 0,
                "seconds": 0,
                "hundredths": 0
            })
    else:
        response["lyrics"] = []

    return jsonify(response)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
