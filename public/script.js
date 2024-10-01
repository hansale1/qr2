document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const photoInput = document.getElementById('photoInput');
    const imagePreview = document.getElementById('imagePreview');
    const editControls = document.getElementById('editControls');
    const zoomInButton = document.getElementById('zoomIn');
    const zoomOutButton = document.getElementById('zoomOut');
    const saveEditButton = document.getElementById('saveEdit');
    const uploadButton = document.getElementById('uploadButton');
    const resultDiv = document.getElementById('result');

    let canvas;
    let image;

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = '<canvas id="canvas"></canvas>';
                canvas = new fabric.Canvas('canvas', {
                    width: 300,
                    height: 300
                });
                fabric.Image.fromURL(e.target.result, (img) => {
                    image = img;
                    canvas.setDimensions({
                        width: img.width,
                        height: img.height
                    });
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
                });
                editControls.style.display = 'block';
                uploadButton.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    zoomInButton.addEventListener('click', () => {
        image.scale(image.scaleX * 1.1);
        canvas.renderAll();
    });

    zoomOutButton.addEventListener('click', () => {
        image.scale(image.scaleX * 0.9);
        canvas.renderAll();
    });

    saveEditButton.addEventListener('click', () => {
        // 편집 저장 로직 (필요한 경우 추가)
        alert('편집이 저장되었습니다.');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const blob = await (await fetch(imageDataUrl)).blob();
        const formData = new FormData();
        formData.append('photo', blob, 'edited_photo.jpg');

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('업로드 실패');
            }

            const data = await response.json();
            resultDiv.textContent = '사진이 성공적으로 업로드되었고 인쇄가 시작되었습니다.';
        } catch (error) {
            console.error('Error:', error);
            resultDiv.textContent = '업로드 중 오류가 발생했습니다.';
        }
    });
});