export function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 1024;
      canvas.height = 1024;

      // Calculate the scaling required to cover 1024x1024
      const scale = Math.max(
        canvas.width / img.width,
        canvas.height / img.height
      );

      // Calculate the size of the image after scaling
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Calculate the position to start drawing the image so that it's centered
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      ctx?.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject("Failed to create blob from image.");
        }
      }, "image/png");
    };
    img.onerror = () => {
      reject("Failed to load image.");
    };
  });
}
