import threading
from bluepy import btle
import numpy as np
import joblib
import time

# -- Class to handle connections and gesture detections

class GDetector():

    # -- Init
    def __init__(self, treshold, window_size, classmap, model_path, socket, serial=None, ble=None):

        # -- Give the option between serial com and BLE
        if serial and not ble:
            self.serial = True
            self.ser = serial

        if ble and not serial:
            self.serial = False
            self.p = btle.Peripheral()
            self.p_mac = ble

        # --- Can't have both options
        if serial and ble:
            raise Exception("Serial or BLE, pick one")

        # -- Transfer parameters
        self.TRESHOLD = treshold
        self.window_size = window_size
        self.model = joblib.load(model_path)
        self.socketio = socket
        self.classmap = classmap

        self.data_filename = ""
        self.collection = False
    
    # -- Initialize the BLE device once connection is established
    def init_ble(self):    
        print("INIT BLE") 
        self.p.setMTU(128)          
        svc = self.p.getServiceByUUID("6E400001-B5A3-F393-E0A9-E50E24DCCA9E")
        ch_Tx = svc.getCharacteristics("6E400002-B5A3-F393-E0A9-E50E24DCCA9E")[0]
        ch_Rx = svc.getCharacteristics("6E400003-B5A3-F393-E0A9-E50E24DCCA9E")[0]

        self.p.setDelegate(self.BleDelegate(self))

        setup_data = b"\x01\00"
        self.p.writeCharacteristic(ch_Rx.valHandle+1, setup_data)
    
    # -- Function when collecting gesture data
    def collect_data(self, filename):
        self.data_filename = filename
        while 1:
            if self.serial:
                pass
            else:
                self.collection = True
                if self.p.waitForNotifications(0.01):
                    pass

    # -- Run detection as thread to not interfere with flask
    def run(self):
        self.collection = False
        self.detection = threading.Thread(target=self.run_detection)
        self.detection.start()

    # -- Function to check if the forces given by accelormeter are that of a movement
    def is_moving(self, arr):
        return int(sum(abs(number) for number in arr)) > self.TRESHOLD

    # -- Helper function
    def format_serial_input(self, line):
        line = line.decode('utf-8').strip('\n').strip('\r').split("|")
        d = {}
        for seg in line:
            temp = seg.split(',')
            d[temp[0]] = [float(i) for i in temp[1:]]
        return d
    
    # -- Predict gesture based on given array
    def prediction(self, arr):
        temp_np = np.array(arr)
        temp_np = temp_np.reshape((1, -1))

        pred = self.model.predict(temp_np)

        # -- Get index from classmap
        self.send_gesture(self.classmap[pred[0]])
        print(f"Movment detected: {self.classmap[pred[0]]}", flush=True)

        return 


    def run_detection(self):
        connected = False
        
        if self.serial:
            while 1:
                data = self.format_serial_input(self.ser.readline())

                # -- always send rotation data
                self.send_rotation(data['orr'])

                # -- if module is moving 
                if self.is_moving(data['gyro']):
                    temp = []

                    # -- record next n samples and do prediction on them
                    for i in range(self.window_size):
                        temp_data = self.format_serial_input(self.ser.readline())

                        self.send_rotation(data['orr'])
                        temp += (temp_data['gyro'] + temp_data['acc'])

                    prediction = self.prediction(temp)

                    self.socketio.emit('B2F_new_gesture', {
                        'data': self.classmap[prediction[0]]})

                    print(
                        f"Movment detected: {self.classmap[prediction[0]]}", flush=True)
        else:
            while 1:

                # -- Stuff to keep bluetooth connection alive
                if not connected:
                    while 1:
                        try:
                            self.p.connect(self.p_mac, timeout=0.3)

                            if self.p.getState() == "conn":
                                self.init_ble()
                                connected = True
                                break
                        except Exception as e:
                            # print(e)
                            pass

                elif connected:

                    while 1:
                        try:
                            # Wait for notification (= new ble data)           
                            if self.p.waitForNotifications(0.1):
                                pass
                        except Exception as e:
                            # print(e)
                            self.p = btle.Peripheral()
                            connected = False
                            break
    
    def send_gesture(self, gesture):
        print(f"Sending gesture {gesture}", flush=True)
        self.socketio.emit('B2F_new_gesture', {'data': gesture})
    
    class BleDelegate(btle.DefaultDelegate):

        def __init__(self, gdetector):
            btle.DefaultDelegate.__init__(self)
            self.count = 0
            self.moving = False
            self.buffer = []
            self.str_buffer = ""
            self.gdetector = gdetector
            self.collect_counter = 0
            self.start = None

        def listToString(self, s, delim=""): 
            temp = "" 
            for ele in s: 
                temp += delim  
                temp += str(ele)
            return temp[1:]
                

        def handleNotification(self, cHandle, data_raw):
            data = self.gdetector.format_serial_input(data_raw)

            # -- always send rotation and gyro data
            self.gdetector.send_rotation(data['orr'])
            self.gdetector.send_gyro(data['gyro'])

            if self.gdetector.is_moving(data['gyro']):
                self.moving = True

            if not self.gdetector.collection:
                if self.moving:

                    self.buffer += (data['gyro'] + data['acc'])
                    self.count += 1

                    if self.count == self.gdetector.window_size:
                        self.prediction = threading.Thread(target=self.gdetector.prediction, args=(self.buffer,))
                        self.prediction.start()


                        self.moving = False
                        self.count = 0
                        self.buffer =  []
            else:
                if self.moving:
                    self.buffer += (data['gyro'] + data['acc'])

                    for d in data['gyro']:
                        self.str_buffer += ","
                        self.str_buffer += str(d)

                    for d in data['acc']:
                        self.str_buffer += ","
                        self.str_buffer += str(d)
                    
                    
                    self.count += 1
                   

                    if self.count == self.gdetector.window_size:
                        self.str_buffer = self.str_buffer[1:]
                        with open(f'/home/pi/research_project/docker/backend/app/data3/{self.gdetector.data_filename}.csv', 'a', encoding='UTF8') as f:
                            f.write(self.str_buffer)
                            f.write('\n')

                        self.str_buffer =  ""
                        self.collect_counter += 1
                        self.moving = False
                        self.count = 0
                        self.buffer =  []

                        print(f"Movment {self.gdetector.data_filename} nr: {self.collect_counter}")

                        # end = time.time() - self.start
                        # print(f"Execution Time = {end}")
                    


    def send_rotation(self, arr):
        self.socketio.emit('B2F_rotation', {'data': arr})
    
    def send_gyro(self, arr):
        self.socketio.emit('B2F_gyro', {'data': arr})

