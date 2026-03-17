/**
 * Client-side image processing utilities
 * Handles cropping, resizing, and WebP conversion using Canvas API
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crop and resize an image to 600x600px and convert to WebP format
 * @param imageSrc - Data URL or file path of the image
 * @param crop - Crop area coordinates and dimensions
 * @param targetSize - Target size in pixels (default: 600)
 * @returns Promise<Blob> - WebP image blob
 */
export async function cropAndResizeToWebP(
  imageSrc: string,
  crop: PixelCrop,
  targetSize: number = 600
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        // Create a square canvas at the target size
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Draw the cropped portion of the image onto the canvas
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          targetSize,
          targetSize
        );

        // Convert canvas to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              throw new Error("Failed to create blob from canvas");
            }
            resolve(blob);
          },
          "image/webp",
          0.85 // Quality: 85%
        );
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    image.src = imageSrc;
  });
}

/**
 * Create a data URL from a blob for preview purposes
 * @param blob - Image blob
 * @returns Data URL string
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert blob to File object
 * @param blob - Image blob
 * @param filename - Desired filename
 * @returns File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Convert a data URL into a File object.
 * @param dataUrl - Base64 or data URL image source
 * @param filename - Desired filename
 * @returns File object
 */
export async function dataUrlToFile(
  dataUrl: string,
  filename: string
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return blobToFile(blob, filename);
}
