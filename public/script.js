document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const kioskIdInput = document.getElementById("kioskIdInput");
  const photoInput = document.getElementById("photoInput");
  const imageCanvas = document.getElementById("imageCanvas");
  const cropButton = document.getElementById("cropButton");
  const printButton = document.getElementById("printButton");
  const fullPrintButton = document.getElementById("fullPrintButton");
  const resultDiv = document.getElementById("result");

  const ctx = imageCanvas.getContext("2d");
  let image = new Image();
  let cropRegion = { x: 0, y: 0, width: 0, height: 0 };
  let isDragging = false;
  let isResizing = false;
  let startX, startY;
  let resizeHandle = "";

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

  imageCanvas.addEventListener("mousedown", startDragOrResize);
  imageCanvas.addEventListener("mousemove", dragOrResize);
  imageCanvas.addEventListener("mouseup", endDragOrResize);
  imageCanvas.addEventListener("mouseleave", endDragOrResize);

  imageCanvas.addEventListener("touchstart", handleTouch);
  imageCanvas.addEventListener("touchmove", handleTouch);
  imageCanvas.addEventListener("touchend", endDragOrResize);

  function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(
      e.type === "touchstart" ? "mousedown" : "mousemove",
      {
        clientX: touch.clientX,
        clientY: touch.clientY,
      }
    );
    imageCanvas.dispatchEvent(mouseEvent);
  }

  function startDragOrResize(e) {
    const rect = imageCanvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    resizeHandle = getResizeHandle(startX, startY);
    if (resizeHandle) {
      isResizing = true;
    } else if (isInsideCropRegion(startX, startY)) {
      isDragging = true;
    }
  }

  function dragOrResize(e) {
    const rect = imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const dx = x - startX;
      const dy = y - startY;
      cropRegion.x = Math.max(
        0,
        Math.min(cropRegion.x + dx, imageCanvas.width - cropRegion.width)
      );
      cropRegion.y = Math.max(
        0,
        Math.min(cropRegion.y + dy, imageCanvas.height - cropRegion.height)
      );
      startX = x;
      startY = y;
      drawImage();
    } else if (isResizing) {
      resizeCropRegion(x, y);
      drawImage();
    }
  }

  function endDragOrResize() {
    isDragging = false;
    isResizing = false;
  }

  function getResizeHandle(x, y) {
    const handleSize = 30; // Increased handle size
    const handles = [
      { name: "topLeft", x: cropRegion.x, y: cropRegion.y },
      { name: "topRight", x: cropRegion.x + cropRegion.width, y: cropRegion.y },
      {
        name: "bottomLeft",
        x: cropRegion.x,
        y: cropRegion.y + cropRegion.height,
      },
      {
        name: "bottomRight",
        x: cropRegion.x + cropRegion.width,
        y: cropRegion.y + cropRegion.height,
      },
    ];

    for (let handle of handles) {
      if (
        Math.abs(x - handle.x) < handleSize &&
        Math.abs(y - handle.y) < handleSize
      ) {
        return handle.name;
      }
    }
    return "";
  }

  function isInsideCropRegion(x, y) {
    return (
      x > cropRegion.x &&
      x < cropRegion.x + cropRegion.width &&
      y > cropRegion.y &&
      y < cropRegion.y + cropRegion.height
    );
  }

  function resizeCropRegion(x, y) {
    const minSize = 30;
    switch (resizeHandle) {
      case "topLeft":
        cropRegion.width = Math.max(
          minSize,
          cropRegion.width + cropRegion.x - x
        );
        cropRegion.height = Math.max(
          minSize,
          cropRegion.height + cropRegion.y - y
        );
        cropRegion.x = Math.min(x, cropRegion.x + cropRegion.width - minSize);
        cropRegion.y = Math.min(y, cropRegion.y + cropRegion.height - minSize);
        break;
      case "topRight":
        cropRegion.width = Math.max(minSize, x - cropRegion.x);
        cropRegion.height = Math.max(
          minSize,
          cropRegion.height + cropRegion.y - y
        );
        cropRegion.y = Math.min(y, cropRegion.y + cropRegion.height - minSize);
        break;
      case "bottomLeft":
        cropRegion.width = Math.max(
          minSize,
          cropRegion.width + cropRegion.x - x
        );
        cropRegion.height = Math.max(minSize, y - cropRegion.y);
        cropRegion.x = Math.min(x, cropRegion.x + cropRegion.width - minSize);
        break;
      case "bottomRight":
        cropRegion.width = Math.max(minSize, x - cropRegion.x);
        cropRegion.height = Math.max(minSize, y - cropRegion.y);
        break;
    }
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

    const handleSize = 20; // Increased handle size
    ctx.fillStyle = "white";
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    function drawHandle(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, handleSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    drawHandle(cropRegion.x, cropRegion.y);
    drawHandle(cropRegion.x + cropRegion.width, cropRegion.y);
    drawHandle(cropRegion.x, cropRegion.y + cropRegion.height);
    drawHandle(
      cropRegion.x + cropRegion.width,
      cropRegion.y + cropRegion.height
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
    image.src = croppedCanvas.toDataURL("image/jpeg");
    image.onload = () => {
      imageCanvas.width = cropRegion.width;
      imageCanvas.height = cropRegion.height;
      ctx.drawImage(image, 0, 0);
      cropRegion = {
        x: 0,
        y: 0,
        width: cropRegion.width,
        height: cropRegion.height,
      };
    };
    resultDiv.textContent = "이미지가 크기 조정되어 저장되었습니다.";
  });

  printButton.addEventListener("click", () => requestPrint(false));
  fullPrintButton.addEventListener("click", () => requestPrint(true));

  async function requestPrint(isFullPrint) {
    const kioskId = kioskIdInput.value;
    if (!kioskId) {
      resultDiv.textContent = "키오스크 번호를 입력해주세요.";
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
          isFullPrint: isFullPrint,
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
  }
});
