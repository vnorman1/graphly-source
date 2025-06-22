import React, { useRef, useEffect } from 'react';
import { MiniPreviewCanvasProps } from '../types';

const MiniPreviewCanvas: React.FC<MiniPreviewCanvasProps> = ({ imageUrl, aspectRatio, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set a placeholder background color if no image
    if (!imageUrl) {
        ctx.fillStyle = '#E5E7EB'; // Tailwind gray-200
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Optional: Draw placeholder text
        ctx.fillStyle = '#9CA3AF'; // Tailwind gray-400
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Előnézet', canvas.width / 2, canvas.height / 2);
        return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      let drawWidth = canvasWidth;
      let drawHeight = canvasWidth / aspectRatio;

      if (drawHeight > canvasHeight) {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * aspectRatio;
      }

      const x = (canvasWidth - drawWidth) / 2;
      const y = (canvasHeight - drawHeight) / 2;
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear again before drawing image
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    };
    img.onerror = () => {
        // Handle image loading error if necessary, e.g., draw placeholder
        ctx.fillStyle = '#FEE2E2'; // Tailwind red-100 (error indication)
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#EF4444'; // Tailwind red-500
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Hiba', canvas.width / 2, canvas.height / 2);
    }
    img.src = imageUrl;

  }, [imageUrl, aspectRatio]);

  return (
    <canvas
      ref={canvasRef}
      // The parent div will control the width, and aspect ratio will control height
      // Set initial canvas drawing size, CSS will scale it.
      // Using a fixed moderate size for the drawing buffer.
      width={300} 
      height={300 / aspectRatio}
      className={`w-full h-auto bg-gray-200 rounded-md border border-gray-300 shadow-sm ${className || ''}`}
      style={{aspectRatio: `${aspectRatio}`}}
      aria-label="Mini előnézeti vászon"
    />
  );
};

export default MiniPreviewCanvas;