const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static("public"));

// 파일 업로드를 위한 Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// 파일 업로드 및 프린트 라우트
app.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = req.file.path;

  // 프린터로 인쇄 명령 (Windows 환경 기준)
  exec(
    `print /d:"%printer%Default Printer" "${filePath}"`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).send("Printing failed.");
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return res.status(500).send("Printing failed.");
      }
      res
        .status(200)
        .json({ message: "File uploaded and sent to printer successfully." });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
