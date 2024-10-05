const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan"); // morgan 추가
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(morgan("combined")); // 모든 요청 로그

const printQueue = {};

// **API 라우트를 먼저 정의**
app.get("/api/status", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post("/api/request-print", (req, res) => {
  const { imageData, kioskId } = req.body;
  if (!imageData || !kioskId) {
    return res
      .status(400)
      .json({ success: false, message: "imageData와 kioskId가 필요합니다." });
  }
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

// **그 후 정적 파일 서비스**
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// 모든 다른 GET 요청에 대해 index.html 반환
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// 404 처리 (API 라우트 외의 모든 요청)
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
