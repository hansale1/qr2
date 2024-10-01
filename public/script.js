document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
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

  let isDragging = false;
  let startX, startY;

  cropBox.addEventListener("mousedown", startDragging);
  cropBox.addEventListener("touchstart", startDragging);

  document.addEventListener("mousemove", drag);
  document.addEventListener("touchmove", drag);

  document.addEventListener("mouseup", stopDragging);
  document.addEventListener("touchend", stopDragging);

  function startDragging(e) {
    isDragging = true;
    startX = (e.clientX || e.touches[0].clientX) - cropBoxRect.x;
    startY = (e.clientY || e.touches[0].clientY) - cropBoxRect.y;
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;
    const x = (e.clientX || e.touches[0].clientX) - startX;
    const y = (e.clientY || e.touches[0].clientY) - startY;
    cropBoxRect.x = Math.max(
      0,
      Math.min(x, imagePreview.width - cropBoxRect.width)
    );
    cropBoxRect.y = Math.max(
      0,
      Math.min(y, imagePreview.height - cropBoxRect.height)
    );
    updateCropBox();
  }

  function stopDragging() {
    isDragging = false;
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

  printButton.addEventListener("click", () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write("<html><head><title>Print</title></head><body>");
    printWindow.document.write(
      '<img src="' + imagePreview.src + '" style="max-width:100%;">'
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  });
});
