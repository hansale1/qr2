const express = require("express");
const cors = require("cors"); // CORS 미들웨어 추가
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(
  cors({
    origin: "*", // 모든 도메인 허용 (보안상 필요에 따라 제한 가능)
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// 인쇄 작업 저장소
let printJobs = {}; // 키오스크 ID별 인쇄 작업 저장

// 인쇄 작업 추가 엔드포인트
app.post("/api/print-job/:kioskId", (req, res) => {
  const kioskId = req.params.kioskId;
  const { file } = req.body;

  if (!file) {
    console.error(`No file provided for kiosk: ${kioskId}`);
    return res.status(400).send({ message: "No file provided" });
  }

  // 인쇄 작업 저장
  printJobs[kioskId] = { file, timestamp: new Date().toISOString() };
  console.log(`Print job added for kiosk: ${kioskId}`);
  res.status(200).send({ message: "Print job added successfully" });
});

// 인쇄 작업 가져오기 엔드포인트
app.get("/api/get-print-job/:kioskId", (req, res) => {
  const kioskId = req.params.kioskId;
  const job = printJobs[kioskId] || null;
  if (job) {
    // 인쇄 작업을 반환하고, 저장소에서 제거
    printJobs[kioskId] = null;
    res.status(200).send(job);
  } else {
    res.status(204).send();
  }
});

// 서버 상태 확인 엔드포인트
app.get("/api/status", (req, res) => {
  res.status(200).send({ status: "OK", timestamp: new Date().toISOString() });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
