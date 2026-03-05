import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "reader";

  useEffect(() => {
    const startScanner = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        const config = { 
          fps: 25, 
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Silently ignore scan errors (they happen every frame if no code is found)
          }
        );
        setIsInitializing(false);
      } catch (err: any) {
        console.error("Camera initialization failed:", err);
        setError(err.message || "Could not access camera. Please ensure permissions are granted.");
        setIsInitializing(false);
      }
    };

    const stopScanner = async () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (err) {
          console.error("Failed to stop scanner:", err);
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan]);

  return (
    <div className="relative w-full aspect-square bg-stone-900 flex flex-col items-center justify-center overflow-hidden">
      <div id={scannerId} className="w-full h-full"></div>
      
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900 z-20">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-stone-400 text-sm">Starting camera...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900 p-6 text-center z-30">
          <Camera className="w-12 h-12 text-stone-600 mb-4" />
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Viewfinder Overlay */}
      {!isInitializing && !error && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 border-[40px] border-black/40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-emerald-500 rounded-3xl">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
          </div>
        </div>
      )}
    </div>
  );
};
