const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const printQueue = {};

app.post("/request-print", (req, res) => {
  const { imageData, kioskId } = req.body;
  if (!printQueue[kioskId]) {
    printQueue[kioskId] = [];
  }
  printQueue[kioskId].push(imageData);
  console.log(`Print job added for kiosk: ${kioskId}`);
  res.json({ success: true, message: "인쇄 요청이 큐에 추가되었습니다." });
});

app.get("/get-print-job/:kioskId", (req, res) => {
  const { kioskId } = req.params;
  if (printQueue[kioskId] && printQueue[kioskId].length > 0) {
    const job = printQueue[kioskId].shift();
    console.log(`Print job sent to kiosk: ${kioskId}`);
    res.json({ job });
  } else {
    res.status(204).send();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
