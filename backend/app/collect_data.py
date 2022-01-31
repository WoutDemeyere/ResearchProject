from gdetector import GDetector
from bluepy import btle
from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS

# ble = btle.Peripheral("24:6F:28:8F:7E:42")

TRESHOLD = 2
window_size = 20

app = Flask(__name__)
app.config['SECRET_KEY'] = '!secretugabooga'

socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

model_path = "docker/backend/app/RF_clf_data4.joblib"

classmap = {0: 'right', 1: 'left', 2: 'norm',
            3: 'push', 4: 'shake', 5: 'down', 6: 'up'}

gdetector = GDetector(TRESHOLD, window_size, 
                classmap, model_path, socketio, ble="24:6F:28:8F:7E:42")

file_name = "norm"

if __name__ == '__main__':
    gdetector.collect_data(file_name)