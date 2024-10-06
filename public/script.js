document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const kioskIdInput = document.getElementById("kioskIdInput");
  const photoInput = document.getElementById("photoInput");
  const imagePreview = document.getElementById("imagePreview");
  const saveButton = document.getElementById("saveButton");
  const printButton = document.getElementById("printButton");
  const resultDiv = document.getElementById("result");

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  saveButton.addEventListener("click", () => {
    resultDiv.textContent = "이미지가 저장되었습니다.";
  });

  printButton.addEventListener("click", async () => {
    const kioskId = kioskIdInput.value;
    if (!kioskId) {
      resultDiv.textContent = "키오스크 ID를 입력해주세요.";
      return;
    }

    try {
      const response = await fetch("/api/request-print", {
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
        const data = await response.json();
        resultDiv.textContent = data.message;
      } else {
        throw new Error("인쇄 요청 실패");
      }
    } catch (error) {
      console.error("Error:", error);
      resultDiv.textContent = "인쇄 요청 중 오류가 발생했습니다.";
    }
  });
});
