#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Servo.h>

// --- PIN DEFINITIONS ---
#define DHTPIN D2
#define DHTTYPE DHT11
#define PIR_PIN D5
#define TRIG_PIN D6
#define ECHO_PIN D7
#define RELAY_PIN D1
#define SERVO_PIN D4
#define MQ2_PIN A0

// --- CONFIGURATION ---
const char* ssid = "BEYONDER 5430";
const char* password = "tejas143";
const char* mqtt_server = "10.136.75.54"; // Fog Node IP

// --- DEVICE ID (CRITICAL!) ---
const char* DEVICE_ID = "arduino_factory_01";

// --- THRESHOLDS ---
const int GAS_THRESHOLD = 400;
const float TANK_OVERFLOW_CM = 5.0;

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
Servo ventServo;

bool autoMode = true;
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL = 2000; // 2 seconds

void setup_wifi() {
  delay(10);
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    ESP.restart();
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  String top = String(topic);

  Serial.println("📩 Message [" + top + "]: " + msg);

  if (top == "factory/actuator/fan") {
    if (msg == "ON") digitalWrite(RELAY_PIN, LOW);
    else digitalWrite(RELAY_PIN, HIGH);
  }

  if (top == "factory/actuator/vent") {
    if (msg == "OPEN") ventServo.write(90);
    else ventServo.write(0);
  }
}

void reconnect() {
  if (!client.connected()) {
    Serial.print("🔌 Attempting MQTT connection...");
    
    if (client.connect(DEVICE_ID)) {
      Serial.println("✅ Connected to FOGNET-X!");
      
      // Subscribe to actuator topics
      if (client.subscribe("factory/actuator/#")) {
        Serial.println("📡 Subscribed to actuator commands");
      }
      
      // Publish initial heartbeat
      client.publish("factory/status/heartbeat", "alive");
      Serial.println("💓 Initial heartbeat sent");
      
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5s...");
      delay(5000);
    }
  }
}

float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH);
  return dur * 0.034 / 2;
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 FOGNET-X Factory Node Starting...");
  
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Off by default

  ventServo.attach(SERVO_PIN);
  ventServo.write(0); // Closed initially

  dht.begin();
  setup_wifi();
  
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  Serial.println("✨ Setup complete. Starting main loop...");
}

void loop() {
  // Always maintain MQTT connection
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Check if it's time to publish
  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = currentTime;
    
    Serial.println("\n--- Reading Sensors ---");
    
    // 1. READ SENSORS
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    int gasValue = analogRead(MQ2_PIN);
    int motion = digitalRead(PIR_PIN);
    float tankDistance = readUltrasonic();

    // Validate readings
    if (isnan(t) || isnan(h)) {
      Serial.println("⚠️ DHT sensor reading failed!");
      t = 25.0; // Default value
      h = 50.0;
    }

    // 2. SAFETY LOGIC
    bool gasAlert = (gasValue > GAS_THRESHOLD);
    bool tankOverflow = (tankDistance < TANK_OVERFLOW_CM);
    
    if (gasAlert) {
      digitalWrite(RELAY_PIN, LOW); // Fan ON
      ventServo.write(90);          // Vent OPEN
      Serial.println("⚠️ GAS DETECTED! Fan ON & Vent OPEN");
    } else {
      digitalWrite(RELAY_PIN, HIGH); // Fan OFF
      ventServo.write(0);            // Vent CLOSED
    }

    // 3. SECURITY LOGIC
    String securityStatus = "SECURE";
    if (motion == HIGH) {
      if (gasAlert) {
        securityStatus = "CRITICAL: HUMAN IN DANGER";
        Serial.println("🚨 CRITICAL: Human in gas zone!");
      } else {
        securityStatus = "HUMAN DETECTED";
        Serial.println("👤 Motion detected");
      }
    }

    // 4. BUILD JSON PAYLOAD (WITH device_id!)
    String payload = "{";
    payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"temp\":" + String(t, 2) + ",";
    payload += "\"humidity\":" + String(h, 2) + ",";
    payload += "\"gas\":" + String(gasValue) + ",";
    payload += "\"gas_alert\":" + String(gasAlert ? 1 : 0) + ",";
    payload += "\"motion\":" + String(motion) + ",";
    payload += "\"tank_dist\":" + String(tankDistance, 2) + ",";
    payload += "\"tank_overflow\":" + String(tankOverflow ? 1 : 0) + ",";
    payload += "\"security\":\"" + securityStatus + "\"";
    payload += "}";

    // 5. PUBLISH TO MQTT
    Serial.print("📤 Publishing: ");
    Serial.println(payload);
    
    boolean published1 = client.publish("factory/sensor/data", payload.c_str());
    boolean published2 = client.publish("factory/status/heartbeat", "alive");
    
    if (published1 && published2) {
      Serial.println("✅ Data published successfully!");
    } else {
      Serial.println("❌ Publish failed!");
    }

    // 6. DEBUG OUTPUT
    Serial.print("🌡 Temp: "); Serial.print(t); Serial.print("°C");
    Serial.print(" | 💧 Humidity: "); Serial.print(h); Serial.print("%");
    Serial.print(" | 💨 Gas: "); Serial.print(gasValue);
    Serial.print(" | 📏 Tank: "); Serial.print(tankDistance); Serial.println(" cm");
    Serial.print(" 🔔 Motion: "); Serial.println(motion ? "YES" : "NO");
  }

  delay(100); // Small delay to prevent watchdog reset
}
