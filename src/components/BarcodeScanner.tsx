'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, Camera, Loader2, AlertCircle, Save } from 'lucide-react';

interface FoodProduct {
  name: string;
  brand?: string;
  calories?: number;
  carbs?: number;
  fat?: number;
  protein?: number;
  servingSize?: string;
  imageUrl?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: FoodProduct) => void;
  onSaveCustomFood?: (food: FoodProduct & { barcode: string }) => Promise<void>;
  userId?: string;
  gender?: 'male' | 'female';
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onProductFound,
  onSaveCustomFood,
  userId,
  gender = 'male',
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualServingSize, setManualServingSize] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    isInitializedRef.current = false;
  }, []);

  const lookupBarcode = useCallback(async (barcode: string) => {
    setIsLoading(true);
    setLookupStatus('Looking up product...');
    setScannedBarcode(barcode);

    try {
      const params = new URLSearchParams({ barcode });
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/food/barcode?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // Product not found - show manual entry option
          setError(null);
          setShowManualEntry(true);
        } else {
          setError(data.error || 'Failed to lookup product');
        }
        setIsLoading(false);
        setLookupStatus(null);
        return;
      }

      if (data.success && data.product) {
        onProductFound(data.product);
        onClose();
      } else {
        setError('Product data unavailable');
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
      setError('Failed to lookup product. Please try again.');
    } finally {
      setIsLoading(false);
      setLookupStatus(null);
    }
  }, [onProductFound, onClose, userId]);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || isInitializedRef.current) return;

    setError(null);
    isInitializedRef.current = true;

    try {
      const html5QrCode = new Html5Qrcode('barcode-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        async (decodedText) => {
          // Stop scanner immediately to prevent multiple scans
          await stopScanner();
          await lookupBarcode(decodedText);
        },
        () => {
          // Ignore scan failures (happens constantly while searching)
        }
      );
    } catch (err) {
      console.error('Scanner start error:', err);
      isInitializedRef.current = false;
      if (err instanceof Error) {
        if (err.message.includes('Permission')) {
          setError('Camera permission denied. Please allow camera access to scan barcodes.');
        } else if (err.message.includes('NotFoundError')) {
          setError('No camera found. Please ensure your device has a camera.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to start camera. Please try again.');
      }
    }
  }, [lookupBarcode, stopScanner]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
      setError(null);
      setScannedBarcode(null);
      setLookupStatus(null);
      setShowManualEntry(false);
      setManualName('');
      setManualBrand('');
      setManualCalories('');
      setManualCarbs('');
      setManualFat('');
      setManualProtein('');
      setManualServingSize('');
    }
  }, [isOpen, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setScannedBarcode(null);
    setShowManualEntry(false);
    isInitializedRef.current = false;
    startScanner();
  };

  const handleManualSaveAndUse = async () => {
    if (!manualName || !manualCalories || !scannedBarcode) return;

    const product: FoodProduct = {
      name: manualName.trim(),
      brand: manualBrand.trim() || undefined,
      calories: parseInt(manualCalories),
      carbs: manualCarbs ? parseInt(manualCarbs) : undefined,
      fat: manualFat ? parseInt(manualFat) : undefined,
      protein: manualProtein ? parseInt(manualProtein) : undefined,
      servingSize: manualServingSize.trim() || undefined,
    };

    // Save to custom foods if callback provided
    if (onSaveCustomFood) {
      setIsSaving(true);
      try {
        await onSaveCustomFood({ ...product, barcode: scannedBarcode });
      } catch (err) {
        console.error('Failed to save custom food:', err);
        // Continue anyway - at least use the data
      } finally {
        setIsSaving(false);
      }
    }

    // Use the product data
    onProductFound(product);
    onClose();
  };

  const handleUseWithoutSaving = () => {
    if (!manualName || !manualCalories) return;

    const product: FoodProduct = {
      name: manualName.trim(),
      brand: manualBrand.trim() || undefined,
      calories: parseInt(manualCalories),
      carbs: manualCarbs ? parseInt(manualCarbs) : undefined,
      fat: manualFat ? parseInt(manualFat) : undefined,
      protein: manualProtein ? parseInt(manualProtein) : undefined,
      servingSize: manualServingSize.trim() || undefined,
    };

    onProductFound(product);
    onClose();
  };

  if (!isOpen) return null;

  const accentColor = gender === 'female' ? 'pink' : 'teal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r ${
          gender === 'female' ? 'from-pink-500 to-purple-500' : 'from-teal-500 to-blue-500'
        }`}>
          <div className="flex items-center gap-2 text-white">
            <Camera className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Scan Barcode</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className={`h-12 w-12 animate-spin ${
                gender === 'female' ? 'text-pink-500' : 'text-teal-500'
              }`} />
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">{lookupStatus || 'Loading...'}</p>
              {scannedBarcode && (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                  Barcode: {scannedBarcode}
                </p>
              )}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-center text-zinc-700 dark:text-zinc-300 mb-4 px-4">{error}</p>
              <button
                onClick={handleRetry}
                className={`px-6 py-2 rounded-xl font-medium text-white transition-colors ${
                  gender === 'female'
                    ? 'bg-pink-500 hover:bg-pink-600'
                    : 'bg-teal-500 hover:bg-teal-600'
                }`}
              >
                Try Again
              </button>
            </div>
          ) : showManualEntry ? (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Product not found for barcode:
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                  {scannedBarcode}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  Enter the nutrition info to save this product for future scans.
                </p>
              </div>

              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Product name *"
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                  gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                }`}
              />

              <input
                type="text"
                value={manualBrand}
                onChange={(e) => setManualBrand(e.target.value)}
                placeholder="Brand (optional)"
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                  gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                }`}
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                  placeholder="Calories *"
                  className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                  }`}
                />
                <input
                  type="text"
                  value={manualServingSize}
                  onChange={(e) => setManualServingSize(e.target.value)}
                  placeholder="Serving size"
                  className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                    gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(e.target.value)}
                  placeholder="Carbs (g)"
                  className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                  }`}
                />
                <input
                  type="number"
                  value={manualFat}
                  onChange={(e) => setManualFat(e.target.value)}
                  placeholder="Fat (g)"
                  className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                  }`}
                />
                <input
                  type="number"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(e.target.value)}
                  placeholder="Protein (g)"
                  className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                {onSaveCustomFood && (
                  <button
                    onClick={handleManualSaveAndUse}
                    disabled={!manualName || !manualCalories || isSaving}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      gender === 'female'
                        ? 'bg-pink-500 hover:bg-pink-600'
                        : 'bg-teal-500 hover:bg-teal-600'
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save & Use
                  </button>
                )}
                <button
                  onClick={handleUseWithoutSaving}
                  disabled={!manualName || !manualCalories}
                  className="flex-1 py-2.5 rounded-xl font-medium border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Use Once
                </button>
              </div>

              <button
                onClick={handleRetry}
                className="w-full py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                ← Scan different barcode
              </button>
            </div>
          ) : (
            <>
              <div
                ref={containerRef}
                id="barcode-reader"
                className="w-full rounded-xl overflow-hidden bg-black"
                style={{ minHeight: '280px' }}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Point your camera at a food product barcode
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Supports UPC, EAN, and other common formats
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!showManualEntry && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
