document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const photoInput = document.getElementById("photoInput");
  const imagePreview = document.getElementById("imagePreview");
  const cropBox = document.getElementById("cropBox");
  const saveButton = document.getElementById("saveButton");
  const printButton = document.getElementById("printButton");
  const resultDiv = document.getElementById("result");
  const kioskIdInput = document.getElementById("kioskIdInput");

  let originalImage;
  let cropBoxRect = { x: 0, y: 0, width: 0, height: 0 };

  // QR 코드 스캐너 초기화
  const html5QrCode = new Html5Qrcode("reader");
  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    kioskIdInput.value = decodedText;
    html5QrCode.stop();
  };
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  // QR 코드 스캔 버튼 이벤트
  document
    .querySelector('label[for="kioskIdInput"]')
    .addEventListener("click", () => {
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback
      );
    });

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.onload = () => {
          originalImage = new Image();
          originalImage.src = e.target.result;
          originalImage.onload = () => {
            initCropBox();
          };
        };
      };
      reader.readAsDataURL(file);
    }
  });

  function initCropBox() {
    const containerRect = imagePreview.getBoundingClientRect();
    cropBoxRect = {
      x: 0,
      y: 0,
      width: containerRect.width,
      height: containerRect.height,
    };
    updateCropBox();
    cropBox.style.display = "block";
  }

  function updateCropBox() {
    cropBox.style.left = `${cropBoxRect.x}px`;
    cropBox.style.top = `${cropBoxRect.y}px`;
    cropBox.style.width = `${cropBoxRect.width}px`;
    cropBox.style.height = `${cropBoxRect.height}px`;
  }

  let isDragging = false;
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  let currentHandle;

  cropBox.addEventListener("mousedown", startDragging);
  cropBox.addEventListener("touchstart", startDragging);

  document.addEventListener("mousemove", dragOrResize);
  document.addEventListener("touchmove", dragOrResize);

  document.addEventListener("mouseup", stopDragging);
  document.addEventListener("touchend", stopDragging);

  function startDragging(e) {
    if (e.target.classList.contains("resize-handle")) {
      isResizing = true;
      currentHandle = e.target.classList[1];
    } else {
      isDragging = true;
    }
    startX = (e.clientX || e.touches[0].clientX) - cropBoxRect.x;
    startY = (e.clientY || e.touches[0].clientY) - cropBoxRect.y;
    startWidth = cropBoxRect.width;
    startHeight = cropBoxRect.height;
    e.preventDefault();
  }

  function dragOrResize(e) {
    if (!isDragging && !isResizing) return;
    const x = (e.clientX || e.touches[0].clientX) - startX;
    const y = (e.clientY || e.touches[0].clientY) - startY;

    if (isDragging) {
      cropBoxRect.x = Math.max(
        0,
        Math.min(x, imagePreview.width - cropBoxRect.width)
      );
      cropBoxRect.y = Math.max(
        0,
        Math.min(y, imagePreview.height - cropBoxRect.height)
      );
    } else if (isResizing) {
      const containerRect = imagePreview.getBoundingClientRect();
      const maxWidth = containerRect.width;
      const maxHeight = containerRect.height;

      switch (currentHandle) {
        case "top-left":
          cropBoxRect.width = Math.max(10, startWidth - (x - cropBoxRect.x));
          cropBoxRect.height = Math.max(10, startHeight - (y - cropBoxRect.y));
          cropBoxRect.x = Math.min(startX + startWidth - 10, x);
          cropBoxRect.y = Math.min(startY + startHeight - 10, y);
          break;
        case "top-right":
          cropBoxRect.width = Math.max(
            10,
            Math.min(
              maxWidth - cropBoxRect.x,
              startWidth + (x - (startX + startWidth))
            )
          );
          cropBoxRect.height = Math.max(10, startHeight - (y - cropBoxRect.y));
          cropBoxRect.y = Math.min(startY + startHeight - 10, y);
          break;
        case "bottom-left":
          cropBoxRect.width = Math.max(10, startWidth - (x - cropBoxRect.x));
          cropBoxRect.height = Math.max(
            10,
            Math.min(
              maxHeight - cropBoxRect.y,
              startHeight + (y - (startY + startHeight))
            )
          );
          cropBoxRect.x = Math.min(startX + startWidth - 10, x);
          break;
        case "bottom-right":
          cropBoxRect.width = Math.max(
            10,
            Math.min(
              maxWidth - cropBoxRect.x,
              startWidth + (x - (startX + startWidth))
            )
          );
          cropBoxRect.height = Math.max(
            10,
            Math.min(
              maxHeight - cropBoxRect.y,
              startHeight + (y - (startY + startHeight))
            )
          );
          break;
      }
    }
    updateCropBox();
  }

  function stopDragging() {
    isDragging = false;
    isResizing = false;
  }

  saveButton.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scaleX = originalImage.width / imagePreview.width;
    const scaleY = originalImage.height / imagePreview.height;

    canvas.width = cropBoxRect.width * scaleX;
    canvas.height = cropBoxRect.height * scaleY;

    ctx.drawImage(
      originalImage,
      cropBoxRect.x * scaleX,
      cropBoxRect.y * scaleY,
      cropBoxRect.width * scaleX,
      cropBoxRect.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedImageDataUrl = canvas.toDataURL("image/jpeg");
    imagePreview.src = croppedImageDataUrl;
    cropBox.style.display = "none";
    resultDiv.textContent = "이미지가 저장되었습니다.";
  });

  printButton.addEventListener("click", async () => {
    const kioskId = kioskIdInput.value;
    if (!kioskId) {
      resultDiv.textContent = "키오스크 QR 코드를 먼저 스캔해주세요.";
      return;
    }

    try {
      const response = await fetch("/request-print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imagePreview.src,
          kioskId: kioskId,
        }),
      });

      if (response.ok) {
        resultDiv.textContent = "인쇄 요청이 성공적으로 전송되었습니다.";
      } else {
        throw new Error("인쇄 요청 실패");
      }
    } catch (error) {
      console.error("Error:", error);
      resultDiv.textContent = "인쇄 요청 중 오류가 발생했습니다.";
    }
  });
});
