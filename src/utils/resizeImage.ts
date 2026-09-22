/** Resize an image file to a 1024×1024 cover crop without createObjectURL. */
export function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 1024;
        canvas.height = 1024;

        const scale = Math.max(
          canvas.width / img.width,
          canvas.height / img.height
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        ctx?.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from image."));
          }
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
