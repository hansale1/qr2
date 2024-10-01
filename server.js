const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const printQueue = {};

app.get("/", (req, res) => {
  res.send("Hello from HANA STUDIO print server!");
});

app.use("/api", (req, res, next) => {
  console.log(`API 요청: ${req.method} ${req.url}`);
  next();
});

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

app.use((req, res, next) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
