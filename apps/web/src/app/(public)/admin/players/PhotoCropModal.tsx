"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { cropAndResizeToWebP, blobToFile } from "@/lib/image-processing";
import styles from "./PhotoCropModal.module.css";

interface PhotoCropModalProps {
  imageDataUrl: string;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
}

export function PhotoCropModal({
  imageDataUrl,
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: unknown, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      // Crop and resize to 600x600 WebP
      const webpBlob = await cropAndResizeToWebP(
        imageDataUrl,
        croppedAreaPixels,
        600
      );

      // Convert to File
      const file = blobToFile(
        webpBlob,
        `player-photo-${Date.now()}.webp`
      );

      // Call the confirmation handler
      await onConfirm(file);

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Failed to process image:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Crop Your Photo</h2>
          <button
            onClick={onClose}
            disabled={isProcessing || isLoading}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Removing background...</p>
            </div>
          )}

          {!isLoading && (
            <>
              <div className={styles.cropContainer}>
                <Cropper
                  image={imageDataUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1 / 1} // Square aspect ratio
                  cropShape="round"
                  showGrid={true}
                  restrictPosition={true}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  {...({
                    classes: {
                      containerClassName: styles.cropper,
                      mediaClassName: styles.cropperMedia,
                      cropAreaClassName: styles.cropArea,
                    },
                  } as any)}
                />
              </div>

              <div className={styles.controls}>
                <div className={styles.zoomControl}>
                  <label htmlFor="zoom-slider" className={styles.label}>
                    Zoom
                  </label>
                  <input
                    id="zoom-slider"
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className={styles.slider}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button
            onClick={onClose}
            disabled={isProcessing || isLoading}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || isLoading || !croppedAreaPixels}
            className={styles.confirmButton}
          >
            {isProcessing ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
