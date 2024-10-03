const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const app = express();

// 환경 변수 설정
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API 라우트 (정적 파일 서비스보다 먼저 정의)
app.get("/api/status", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const printQueue = {};

app.post("/api/request-print", (req, res) => {
  const { imageData, kioskId } = req.body;
  if (!printQueue[kioskId]) {
    printQueue[kioskId] = [];
  }
  printQueue[kioskId].push(imageData);
  console.log(`Print job added for kiosk: ${kioskId}`);
  res.json({ success: true, message: "인쇄 요청이 큐에 추가되었습니다." });
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

// 정적 파일 제공 (API 라우트 이후에 정의)
app.use(express.static(path.join(__dirname, "public")));

// 모든 다른 GET 요청에 대해 index.html 반환
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
