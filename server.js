const express = require("express");
const cors = require("cors");
const path = require("path"); // 경로 모듈 추가
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(
  cors({
    origin: "*", // 필요 시 특정 도메인으로 변경
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname, "public")));

// 인쇄 작업 저장소
let printJobs = {};

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

  // 비동기로 인쇄 작업 처리
  setImmediate(() => {
    try {
      processPrintJob(kioskId, printJobs[kioskId]);
      console.log(`Print job processed for kiosk: ${kioskId}`);
    } catch (error) {
      console.error(`Error processing print job for kiosk: ${kioskId}`, error);
    }
  });
});

// 인쇄 작업 가져오기 엔드포인트
app.get("/api/get-print-job/:kioskId", (req, res) => {
  const kioskId = req.params.kioskId;
  const job = printJobs[kioskId] || null;
  if (job) {
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

// 루트 경로에 대한 라우트 추가
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 인쇄 작업 처리 함수 (예시)
const processPrintJob = (kioskId, job) => {
  console.log(`Processing print job for kiosk: ${kioskId}, file: ${job.file}`);
  // 실제 인쇄 작업 로직 구현
};

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
