document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const kioskIdInput = document.getElementById("kioskIdInput");
  const photoInput = document.getElementById("photoInput");
  const imageCanvas = document.getElementById("imageCanvas");
  const cropButton = document.getElementById("cropButton");
  const printButton = document.getElementById("printButton");
  const resultDiv = document.getElementById("result");

  const ctx = imageCanvas.getContext("2d");
  let image = new Image();
  let cropRegion = { x: 0, y: 0, width: 0, height: 0 };
  let isDragging = false;
  let startX, startY;

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        image.onload = () => {
          imageCanvas.width = image.width;
          imageCanvas.height = image.height;
          ctx.drawImage(image, 0, 0, image.width, image.height);
          cropRegion = { x: 0, y: 0, width: image.width, height: image.height };
          drawCropRegion();
        };
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  imageCanvas.addEventListener("mousedown", startDrag);
  imageCanvas.addEventListener("mousemove", drag);
  imageCanvas.addEventListener("mouseup", endDrag);
  imageCanvas.addEventListener("mouseleave", endDrag);

  function startDrag(e) {
    const rect = imageCanvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = true;
  }

  function drag(e) {
    if (!isDragging) return;
    const rect = imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - startX;
    const dy = y - startY;

    cropRegion.x += dx;
    cropRegion.y += dy;
    cropRegion.x = Math.max(
      0,
      Math.min(cropRegion.x, imageCanvas.width - cropRegion.width)
    );
    cropRegion.y = Math.max(
      0,
      Math.min(cropRegion.y, imageCanvas.height - cropRegion.height)
    );

    startX = x;
    startY = y;
    drawImage();
  }

  function endDrag() {
    isDragging = false;
  }

  function drawImage() {
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(image, 0, 0, image.width, image.height);
    drawCropRegion();
  }

  function drawCropRegion() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      cropRegion.x,
      cropRegion.y,
      cropRegion.width,
      cropRegion.height
    );

    // Draw resize handles
    const handleSize = 10;
    ctx.fillStyle = "white";
    ctx.fillRect(
      cropRegion.x - handleSize / 2,
      cropRegion.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fillRect(
      cropRegion.x + cropRegion.width - handleSize / 2,
      cropRegion.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fillRect(
      cropRegion.x - handleSize / 2,
      cropRegion.y + cropRegion.height - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fillRect(
      cropRegion.x + cropRegion.width - handleSize / 2,
      cropRegion.y + cropRegion.height - handleSize / 2,
      handleSize,
      handleSize
    );
  }

  cropButton.addEventListener("click", () => {
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropRegion.width;
    croppedCanvas.height = cropRegion.height;
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(
      imageCanvas,
      cropRegion.x,
      cropRegion.y,
      cropRegion.width,
      cropRegion.height,
      0,
      0,
      cropRegion.width,
      cropRegion.height
    );
    imageCanvas.width = cropRegion.width;
    imageCanvas.height = cropRegion.height;
    ctx.drawImage(croppedCanvas, 0, 0);
    resultDiv.textContent = "이미지가 크기 조정되어 저장되었습니다.";
  });

  printButton.addEventListener("click", async () => {
    const kioskId = kioskIdInput.value;
    if (!kioskId) {
      resultDiv.textContent = "키오스크 ID를 입력해주세요.";
      return;
    }

    resultDiv.textContent = "인쇄 요청 중...";

    try {
      const response = await fetch("/api/request-print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imageCanvas.toDataURL("image/jpeg"),
          kioskId: kioskId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resultDiv.textContent = data.message;
      } else {
        throw new Error(data.message || "인쇄 요청 실패");
      }
    } catch (error) {
      console.error("Error:", error);
      resultDiv.textContent = `인쇄 요청 중 오류가 발생했습니다: ${error.message}`;
    }
  });
});
