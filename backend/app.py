#!/usr/bin/env python3

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import json
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API key from environment
TORN_API_KEY = os.getenv('TORN_API_KEY', '')
TORN_API_URL = 'https://api.torn.com'


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


@app.route('/api/torn/user', methods=['GET'])
def get_user_data():
    """Get user data from Torn API"""
    api_key = request.args.get('key', TORN_API_KEY)
    selections = request.args.get('selections', 'basic')
    
    try:
        response = requests.get(
            f'{TORN_API_URL}/user/?selections={selections}&key={api_key}',
            timeout=10
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        logger.error(f'Error fetching user data: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/torn/faction', methods=['GET'])
def get_faction_data():
    """Get faction data from Torn API"""
    api_key = request.args.get('key', TORN_API_KEY)
    selections = request.args.get('selections', 'basic')
    
    try:
        response = requests.get(
            f'{TORN_API_URL}/faction/?selections={selections}&key={api_key}',
            timeout=10
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        logger.error(f'Error fetching faction data: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/torn/alerts', methods=['POST'])
def set_alerts():
    """Configure user alerts"""
    data = request.json
    # Process alert settings - this would be expanded with real functionality
    logger.info(f'Alert settings updated: {data}')
    return jsonify({"status": "success", "message": "Alerts updated"})


@app.route('/api/torn/userscripts', methods=['GET'])
def get_userscripts():
    """Get available userscripts"""
    # In a real app, this would fetch from a database or file system
    userscripts = [
        {
            "id": 1,
            "name": "Torn Stats Helper",
            "description": "Adds statistics insights to profile pages",
            "enabled": True,
            "code": "// Sample userscript code\n(function() {\n  console.log('Torn Stats Helper loaded');\n  // Add your userscript code here\n})();"
        },
        {
            "id": 2,
            "name": "Trade Calculator",
            "description": "Adds profit calculation to trade pages",
            "enabled": False,
            "code": "// Sample userscript code\n(function() {\n  console.log('Trade Calculator loaded');\n  // Add your userscript code here\n})();"
        }
    ]
    return jsonify(userscripts)


if __name__ == '__main__':
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)
