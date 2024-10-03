const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// 기본 라우트
app.get("/", (req, res) => {
  res.send("HANA STUDIO print server is running");
});

// 상태 확인 라우트
app.get("/status", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const printQueue = {};

// 인쇄 요청 라우트
app.post("/request-print", (req, res) => {
  const { imageData, kioskId } = req.body;
  if (!printQueue[kioskId]) {
    printQueue[kioskId] = [];
  }
  printQueue[kioskId].push(imageData);
  console.log(`Print job added for kiosk: ${kioskId}`);
  res.json({ success: true, message: "인쇄 요청이 큐에 추가되었습니다." });
});

// 인쇄 작업 가져오기 라우트
app.get("/get-print-job/:kioskId", (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
