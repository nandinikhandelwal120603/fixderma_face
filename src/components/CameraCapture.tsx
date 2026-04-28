'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
      }
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitImage = () => {
    if (capturedImage) {
      const img = new window.Image();
      img.src = capturedImage;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.8 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = compressedBase64.split(',')[1];
        onCapture(base64Data);
      };
    }
  };

  if (capturedImage) {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-teal-100">
          <Image 
            src={capturedImage} 
            alt="Captured skin" 
            fill 
            className="object-cover"
          />
          <button 
            onClick={() => setCapturedImage(null)}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="w-full text-sm text-gray-500 text-center mb-2 px-4">
          Make sure your concern is clearly visible in the image.
        </div>

        <button 
          onClick={submitImage}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-lg transition shadow-md"
        >
          Analyze My Skin
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6">
      
      {isCameraActive ? (
        <div className="w-full space-y-4">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsCameraActive(false)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleCapture}
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Take Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <button 
            onClick={() => setIsCameraActive(true)}
            className="w-full aspect-video border-2 border-dashed border-teal-200 hover:border-teal-500 bg-teal-50 hover:bg-teal-100/50 rounded-2xl flex flex-col items-center justify-center text-teal-800 transition group"
          >
            <div className="p-4 bg-white rounded-full mb-3 shadow-sm group-hover:scale-110 transition">
              <Camera size={32} className="text-teal-600" />
            </div>
            <span className="font-semibold text-lg">Use Camera</span>
            <span className="text-sm text-teal-600/70 mt-1">Take a live photo</span>
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <label className="w-full cursor-pointer py-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-3 transition">
            <Upload size={20} className="text-gray-500" />
            <span className="font-medium text-gray-700">Upload from Gallery</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
          
          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2 items-start">
            <div className="mt-0.5">ℹ️</div>
            <p>Your privacy is strictly protected under the DPDP Act 2023. Images are processed instantly and never stored on our servers.</p>
          </div>
        </div>
      )}
    </div>
  );
}
