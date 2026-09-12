#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://192.168.1.100:8000/api/telemetry"; // Adjust server IP

const char* nodes[] = {"TX-01", "TX-02", "BRK-01"};
int num_nodes = 3;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
}

float randomFloat(float min, float max) {
  return min + random(1000) * (max - min) / 1000.0;
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    for (int i = 0; i < num_nodes; i++) {
      StaticJsonDocument<200> doc;
      doc["node_id"] = nodes[i];
      
      JsonObject data = doc.createNestedObject("data");
      data["voltage"] = randomFloat(218.0, 222.0);
      data["current"] = randomFloat(495.0, 505.0);
      data["frequency"] = randomFloat(49.95, 50.05);
      data["temperature"] = randomFloat(40.0, 50.0);
      
      String payload;
      serializeJson(doc, payload);
      
      int httpResponseCode = http.POST(payload);
      if (httpResponseCode > 0) {
        Serial.printf("Node %s Sent: %s\n", nodes[i], payload.c_str());
      } else {
        Serial.printf("Node %s Error: %d\n", nodes[i], httpResponseCode);
      }
      
      delay(100);
    }
    
    http.end();
  }
  
  delay(1000); // Send data every 1 second
}
