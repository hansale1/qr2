const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const API_KEY = process.env.API_KEY || "your-secret-api-key";
const printQueue = {};

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.get("X-API-Key");
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("HANA STUDIO print server is running");
});

app.get("/status", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post("/request-print", checkApiKey, (req, res) => {
  const { imageData, kioskId } = req.body;
  if (!imageData || !kioskId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!printQueue[kioskId]) {
    printQueue[kioskId] = [];
  }
  printQueue[kioskId].push(imageData);
  console.log(`Print job added for kiosk: ${kioskId}`);
  res.json({ success: true, message: "인쇄 요청이 큐에 추가되었습니다." });
});

app.get("/get-print-job/:kioskId", checkApiKey, (req, res) => {
  const { kioskId } = req.params;
  console.log(`Received print job request for kiosk: ${kioskId}`);
  if (printQueue[kioskId] && printQueue[kioskId].length > 0) {
    const job = printQueue[kioskId].shift();
    console.log(`Print job sent to kiosk: ${kioskId}`);
    res.json({ job });
  } else {
    console.log(`No print job available for kiosk: ${kioskId}`);
    res.status(204).send();
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
