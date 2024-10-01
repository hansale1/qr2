document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const kioskIdInput = document.getElementById("kioskIdInput");
  const photoInput = document.getElementById("photoInput");
  const imagePreview = document.getElementById("imagePreview");
  const cropBox = document.getElementById("cropBox");
  const saveButton = document.getElementById("saveButton");
  const printButton = document.getElementById("printButton");
  const resultDiv = document.getElementById("result");

  let originalImage;
  let cropBoxRect = { x: 0, y: 0, width: 200, height: 200 };

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        originalImage = new Image();
        originalImage.src = e.target.result;
        originalImage.onload = initCropBox;
      };
      reader.readAsDataURL(file);
    }
  });

  function initCropBox() {
    const containerRect = imagePreview.getBoundingClientRect();
    cropBoxRect = {
      x: containerRect.width / 4,
      y: containerRect.height / 4,
      width: containerRect.width / 2,
      height: containerRect.height / 2,
    };
    updateCropBox();
  }

  function updateCropBox() {
    cropBox.style.left = `${cropBoxRect.x}px`;
    cropBox.style.top = `${cropBoxRect.y}px`;
    cropBox.style.width = `${cropBoxRect.width}px`;
    cropBox.style.height = `${cropBoxRect.height}px`;
  }

  saveButton.addEventListener("click", () => {
    if (!originalImage) {
      resultDiv.textContent = "이미지를 먼저 선택해주세요.";
      return;
    }

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

    imagePreview.src = canvas.toDataURL("image/jpeg");
    resultDiv.textContent = "이미지가 저장되었습니다.";
  });

  printButton.addEventListener("click", async () => {
    const kioskId = kioskIdInput.value;
    if (!kioskId) {
      resultDiv.textContent = "키오스크 ID를 입력해주세요.";
      return;
    }
    if (!imagePreview.src) {
      resultDiv.textContent = "이미지를 먼저 선택하고 저장해주세요.";
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
