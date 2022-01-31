from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from gdetector import GDetector
from bluepy import btle

import serial
import numpy as np
import eventlet

# -- Monkeypatch for socketio 
eventlet.monkey_patch()

# -- Flask / Socketio
app = Flask(__name__)
app.config['SECRET_KEY'] = '!secretugabooga'

socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# -- Path for RFC model
model_path = "./app/RF_clf_ble.joblib"

# -- Parameters for Gesture Detector
TRESHOLD = 2
window_size = 30

classmap = {0: 'right', 1: 'left', 2: 'norm',
            3: 'push', 4: 'shake', 5: 'down', 6: 'up'}


gdetector = GDetector(TRESHOLD, window_size,
                      classmap, model_path, socketio, ble="24:6F:28:8F:7E:42")


# SOCKET IO
@socketio.on('connect')
def initial_connection():
    print('A new client connect')

# -- run detector and app

if __name__ == '__main__':
    gdetector.run()

    with app.app_context():
        socketio.run(app, debug=False, host='0.0.0.0', port=5050)
