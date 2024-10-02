const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const printQueue = {};

app.get("/", (req, res) => {
  res.send("HANA STUDIO print server is running");
});

app.get("/status", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 나머지 라우트 및 로직...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
