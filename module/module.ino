#include <Wire.h>
#include <string>
#include <Adafruit_Sensor.h>
#include <Adafruit_BNO055.h>
#include <utility/imumaths.h>

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define BNO055_SAMPLERATE_DELAY_MS (20)

// -- set ble service uuids
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E" // UART service UUID
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// -- create bno055 object
Adafruit_BNO055 bno = Adafruit_BNO055(55, 0x28);

// -- ble stuff
BLEServer *pServer = NULL;
BLECharacteristic * pTxCharacteristic;

uint16_t mtu = 128;

bool deviceConnected = false;
bool oldDeviceConnected = false;
uint8_t txValue = 0;
int trigger_pin = 23;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();

      if (rxValue.length() > 0) {
        Serial.println("*********");
        Serial.print("Received Value: ");
        for (int i = 0; i < rxValue.length(); i++)
          Serial.print(rxValue[i]);

        Serial.println();
        Serial.println("*********");
      }
    }
};

// Setup of ble stuff
void setup_ble() {
  // Create the BLE Device
  BLEDevice::init("UART Service");
  BLEDevice::setMTU(mtu);

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );

  pTxCharacteristic->addDescriptor(new BLE2902());

  BLECharacteristic * pRxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID_RX,
      BLECharacteristic::PROPERTY_WRITE
                                          );

  pRxCharacteristic->setCallbacks(new MyCallbacks());

  // Start the service
  pService->start();
  pServer->getAdvertising()->start();
  Serial.println("Waiting a client connection to notify...");
}

void setup() {
  Serial.begin(115200);
  Serial.println("WebSerial 3D Firmware"); Serial.println("");

  setup_ble();
  pinMode(trigger_pin, INPUT_PULLUP);

  if (!bno.begin())
  {
    /* There was a problem detecting the BNO055 ... check your connections */
    Serial.print("Ooops, no BNO055 detected ... Check your wiring or I2C ADDR!");
    while (1);
  }

  delay(1000);

  /* Use external crystal for better accuracy */
  bno.setExtCrystalUse(true);
}

void loop() {
  std::string tx_data = "";
  String tx_data_test = "";
  Serial.println(digitalRead(trigger_pin));

  // for testing
  if (!digitalRead(trigger_pin)) {
    tx_data = "gyro,0.00,0.00,0.00|acc,0.00,0.00,0.00|orr,360.00,0.00,0.00|quat,0.00,0.00,0.00,0.00|call,0,0,0,0";
    tx_data_test = "gyro,0.00,0.00,0.00|acc,0.00,0.00,0.00|orr,360.00,0.00,0.00|quat,0.00,0.00,0.00,0.00|call,0,0,0,0";
  } else {
    // Read sensor data
    tx_data = readSensorData().c_str();
    tx_data_test = readSensorData();
  }

  Serial.println(tx_data_test);

  // send sensor data to ble service
  if (deviceConnected) {
    pTxCharacteristic->setValue(tx_data);
    pTxCharacteristic->notify();
    delay(BNO055_SAMPLERATE_DELAY_MS);
    //delay(10); // bluetooth stack will go into congestion, if too many packets are sent
  }

  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("start advertising");
    oldDeviceConnected = deviceConnected;
  }
  // connecting
  if (deviceConnected && !oldDeviceConnected) {
    // do stuff here on connecting
    oldDeviceConnected = deviceConnected;
  }

}

// read every event and send back
String readSensorData() {
  sensors_event_t event;

  String sensor_data = "";

  // --- Gyroscope
  bno.getEvent(&event, Adafruit_BNO055::VECTOR_GYROSCOPE);
  sensor_data.concat("gyro,");
  sensor_data.concat(String(event.gyro.x));
  sensor_data.concat(",");
  sensor_data.concat(String(event.gyro.y));
  sensor_data.concat(",");
  sensor_data.concat(String(event.gyro.z));
  sensor_data.concat("|");

  // --- Acceleration
  bno.getEvent(&event, Adafruit_BNO055::VECTOR_ACCELEROMETER);
  sensor_data.concat("acc,");
  sensor_data.concat(event.acceleration.x);
  sensor_data.concat(",");
  sensor_data.concat(event.acceleration.y);
  sensor_data.concat(",");
  sensor_data.concat(event.acceleration.z);
  sensor_data.concat("|");

  // --- Orientation
  bno.getEvent(&event, Adafruit_BNO055::VECTOR_EULER);
  sensor_data.concat("orr,");
  sensor_data.concat(String(360 - (float)event.orientation.x));
  sensor_data.concat(",");
  sensor_data.concat(String((float)event.orientation.y));
  sensor_data.concat(",");
  sensor_data.concat(String((float)event.orientation.z));
  sensor_data.concat("|");

  // --- Quaternion
  imu::Quaternion quat = bno.getQuat();
  sensor_data.concat(F("quat,"));
  sensor_data.concat(String((float)quat.w()));
  sensor_data.concat(",");
  sensor_data.concat(String((float)quat.x()));
  sensor_data.concat(",");
  sensor_data.concat(String((float)quat.y()));
  sensor_data.concat(",");
  sensor_data.concat(String((float)quat.z()));
  sensor_data.concat(F("|"));


  // --- Calibration
  uint8_t sys, gyro, accel, mag = 0;
  bno.getCalibration(&sys, &gyro, &accel, &mag);
  sensor_data.concat("call,");
  sensor_data.concat(String(sys));
  sensor_data.concat(",");
  sensor_data.concat(String(gyro));
  sensor_data.concat(",");
  sensor_data.concat(String(accel));
  sensor_data.concat(",");
  sensor_data.concat(String(mag));
  return sensor_data;
}
