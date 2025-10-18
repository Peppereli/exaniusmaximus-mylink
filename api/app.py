# api/app.py

from flask import Flask, jsonify
# flask_cors is necessary to allow your React app (on one port) to talk 
# to your Flask app (on another port).
from flask_cors import CORS 

app = Flask(__name__)
# Initialize CORS for all routes
CORS(app) 

# --- Data Source ---
# In a real application, this data would be fetched from a database (SQL, NoSQL, etc.)
MY_LINKS = [
    {"id": 1, "name": "GitHub Profile", "url": "https://github.com/Peppereli"},
    {"id": 2, "name": "LinkedIn (Professional)", "url": "https://linkedin.com/in/yourprofile"},
    {"id": 3, "name": "Twitter/X Feed", "url": "https://twitter.com/yourhandle"},
    {"id": 4, "name": "My Blog", "url": "https://example.com/blog"},
]

# --- API Endpoint ---
@app.route('/api/links', methods=['GET'])
def get_links():
    """
    Handles GET requests to /api/links and returns the links data as JSON.
    """
    # The jsonify function serializes the Python list/dictionary to JSON
    return jsonify(MY_LINKS)

# --- Server Start ---
if __name__ == '__main__':
    # Flask typically runs on port 5000. Ensure this port is open.
    # The 'debug=True' option provides helpful error messages during development.
    app.run(debug=True, port=5000)
