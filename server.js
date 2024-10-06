const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/status", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const printQueue = {};

app.post("/api/request-print", (req, res) => {
  const { imageData, kioskId } = req.body;
  console.log(`Received print request for kiosk: ${kioskId}`);
  console.log(
    `Image data length: ${imageData ? imageData.length : "undefined"}`
  );

  if (!imageData || !kioskId) {
    console.error("Invalid request: missing imageData or kioskId");
    return res
      .status(400)
      .json({ success: false, message: "잘못된 요청입니다." });
  }

  try {
    if (!printQueue[kioskId]) {
      printQueue[kioskId] = [];
    }
    printQueue[kioskId].push(imageData);
    console.log(`Print job added for kiosk: ${kioskId}`);
    res.json({ success: true, message: "인쇄 요청이 큐에 추가되었습니다." });
  } catch (error) {
    console.error("Error processing print request:", error);
    res
      .status(500)
      .json({ success: false, message: "서버 내부 오류가 발생했습니다." });
  }
});

app.get("/api/get-print-job/:kioskId", (req, res) => {
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

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
