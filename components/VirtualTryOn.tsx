import React, { useState, useRef } from 'react';
import { useApp } from '../state';
import { X, Sparkles, Upload, Download, RefreshCw, Layers, CheckCircle2, ShoppingBag, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface VirtualTryOnProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct: Product;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Convert an image URL (possibly from external CDN) to base64 via canvas
async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      // Try without crossOrigin if CORS fails
      const img2 = new Image();
      img2.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img2.naturalWidth;
        canvas.height = img2.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img2, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const base64 = dataUrl.split(',')[1];
          resolve({ base64, mimeType: 'image/jpeg' });
        } catch {
          reject(new Error('CORS blocked: cannot convert image to base64'));
        }
      };
      img2.onerror = () => reject(new Error('Image load failed'));
      img2.src = url;
    };
    img.src = url;
  });
}

// Call Gemini 2.0 Flash Image Generation API to perform Virtual Try-On
async function geminiVirtualTryOn(
  personBase64: string,
  personMime: string,
  garmentBase64: string,
  garmentMime: string,
  garmentName: string,
  language: string
): Promise<string> {
  const prompt = language === 'ar'
    ? `أنت نظام تجربة ملابس افتراضية متخصص. لديك صورتان:
الصورة الأولى: صورة الشخص (الشخص يرتدي ملابسه الحالية).
الصورة الثانية: صورة قطعة الملابس المنتج "${garmentName}".

المطلوب: قم بتوليد صورة واقعية وطبيعية لنفس الشخص وهو يرتدي قطعة الملابس "${garmentName}" بدلاً من ملابسه الحالية. 
- حافظ على نفس الشخص ونفس وضعيته ونفس الخلفية تماماً.
- الملابس الجديدة يجب أن تبدو طبيعية ومناسبة لشكل جسده تماماً مع الثنيات والظلال الواقعية.
- أزل الملابس العلوية القديمة وضع "${garmentName}" مكانها بشكل واقعي ومقنع.`
    : `You are a specialized virtual try-on AI system. You have two images:
Image 1: A photo of a person wearing their current clothes.
Image 2: A product garment image of "${garmentName}".

Task: Generate a photorealistic image of the SAME person wearing the garment "${garmentName}" instead of their current top clothing.
- Preserve the exact same person, pose, and background.
- The new garment must look natural, properly fitted to their body with realistic folds, wrinkles and lighting.
- Remove the old top garment and replace it with "${garmentName}" in a convincing, photorealistic way.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: personMime,
              data: personBase64,
            },
          },
          {
            inline_data: {
              mime_type: garmentMime,
              data: garmentBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 1,
      topP: 0.95,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API Error ${res.status}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inline_data?.data) {
      return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
    }
  }
  throw new Error('No image returned from Gemini API');
}

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ isOpen, onClose, currentProduct }) => {
  const { language, products } = useApp();

  type Step = 'upload' | 'processing' | 'result' | 'error';
  const [step, setStep] = useState<Step>('upload');
  const [bodyImageFile, setBodyImageFile] = useState<File | null>(null);
  const [bodyImagePreview, setBodyImagePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingStage, setProcessingStage] = useState('');

  // Mix & Match
  const isBottom = currentProduct.category === 'بنطلونات' || currentProduct.category?.toLowerCase().includes('pant');
  const [selectedProduct, setSelectedProduct] = useState<Product>(currentProduct);

  const bodyInputRef = useRef<HTMLInputElement>(null);

  const storeTops = products.filter(p => p.category !== 'بنطلونات' && !p.category?.toLowerCase().includes('pant'));
  const storeBottoms = products.filter(p => p.category === 'بنطلونات' || p.category?.toLowerCase().includes('pant'));
  const allProducts = [...storeTops, ...storeBottoms];

  const handleBodyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBodyImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setBodyImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTryOn = async () => {
    if (!bodyImagePreview) return;
    setStep('processing');
    setErrorMessage('');

    try {
      // Stage 1: Prepare person image
      setProcessingStage(language === 'ar' ? '🔍 جاري تحليل صورتك الشخصية...' : '🔍 Analyzing your photo...');
      const personB64 = bodyImagePreview.split(',')[1];
      const personMime = bodyImagePreview.split(';')[0].split(':')[1];

      // Stage 2: Convert garment image to base64
      setProcessingStage(language === 'ar' ? '👕 جاري تحميل قطعة الملابس...' : '👕 Loading garment image...');
      const { base64: garmentB64, mimeType: garmentMime } = await urlToBase64(selectedProduct.image);

      // Stage 3: Call Gemini AI
      setProcessingStage(language === 'ar' ? '✨ الذكاء الاصطناعي يلبسك الملابس الآن... (قد يستغرق 20-40 ثانية)' : '✨ AI is dressing you now... (may take 20-40 seconds)');
      const result = await geminiVirtualTryOn(personB64, personMime, garmentB64, garmentMime, selectedProduct.name, language);

      setResultImage(result);
      setStep('result');
    } catch (err: any) {
      console.error('Gemini VTryOn error:', err);
      setErrorMessage(err?.message || 'Unknown error');
      setStep('error');
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `tryon-${selectedProduct.name}-${Date.now()}.jpg`;
    link.click();
  };

  const reset = () => {
    setStep('upload');
    setBodyImageFile(null);
    setBodyImagePreview(null);
    setResultImage(null);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />

      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-white"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 animate-pulse">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-amber-50">
                {language === 'ar' ? 'غرفة القياس بالذكاء الاصطناعي (Gemini AI) ✦' : 'AI Virtual Try-On powered by Gemini ✦'}
              </h2>
              <p className="text-[10px] text-neutral-500">
                {language === 'ar' ? 'تلبيس واقعي حقيقي بالذكاء الاصطناعي من Google' : 'Real photorealistic dressing powered by Google Gemini'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 rounded-full transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">

          {/* LEFT: Preview / Result */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-l border-neutral-900 min-h-[360px]">

            {/* UPLOAD STEP */}
            {step === 'upload' && (
              <div className="w-full max-w-sm space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-amber-100">
                    {language === 'ar' ? 'ارفع صورتك كاملة الجسم' : 'Upload a full-body photo of yourself'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {language === 'ar' ? 'صورة أمامية واضحة للحصول على أفضل نتيجة' : 'Clear front-facing photo for best results'}
                  </p>
                </div>

                <div
                  onClick={() => bodyInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-amber-500/40 rounded-3xl p-8 text-center transition-all cursor-pointer group"
                >
                  <input ref={bodyInputRef} type="file" accept="image/*" onChange={handleBodyUpload} className="hidden" />
                  {bodyImagePreview ? (
                    <div className="space-y-3">
                      <img src={bodyImagePreview} className="h-52 w-auto mx-auto object-contain rounded-2xl border border-neutral-800 shadow-xl" alt="Preview" />
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">
                        <CheckCircle2 size={11} />
                        {language === 'ar' ? 'تم تحميل الصورة بنجاح ✓' : 'Photo uploaded successfully ✓'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-8">
                      <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-500 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
                        <Upload size={22} />
                      </div>
                      <p className="text-xs font-semibold text-neutral-400">
                        {language === 'ar' ? 'اضغط لرفع صورتك' : 'Click to upload your photo'}
                      </p>
                      <p className="text-[10px] text-neutral-600">JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>

                <button
                  disabled={!bodyImagePreview}
                  onClick={handleTryOn}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg"
                >
                  <Sparkles size={16} />
                  {language === 'ar' ? 'لبّسني بالذكاء الاصطناعي ✦' : 'Dress Me with AI ✦'}
                </button>
              </div>
            )}

            {/* PROCESSING STEP */}
            {step === 'processing' && (
              <div className="flex flex-col items-center gap-8 py-8">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <div className="absolute inset-3 rounded-full border-4 border-amber-400/10 border-b-amber-400 animate-spin animate-reverse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={28} className="text-amber-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3 max-w-xs">
                  <h3 className="text-base font-bold text-amber-100">
                    {language === 'ar' ? 'Gemini AI يعمل الآن...' : 'Gemini AI is working...'}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed animate-pulse">{processingStage}</p>
                  <p className="text-[10px] text-neutral-600">
                    {language === 'ar' ? 'يرجى الانتظار، قد يستغرق الأمر 20-40 ثانية' : 'Please wait, this may take 20-40 seconds'}
                  </p>
                </div>
              </div>
            )}

            {/* RESULT STEP */}
            {step === 'result' && resultImage && (
              <div className="flex flex-col items-center gap-5">
                <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl shadow-amber-500/5">
                  <img src={resultImage} className="max-h-[400px] max-w-[340px] object-contain" alt="AI Try-On Result" />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-400">
                      {language === 'ar' ? 'مُولَّد بـ Gemini AI' : 'Generated by Gemini AI'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="px-5 py-3 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 active:scale-95"
                  >
                    <RefreshCw size={12} />
                    {language === 'ar' ? 'جرب مرة ثانية' : 'Try Again'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-lg active:scale-95"
                  >
                    <Download size={12} />
                    {language === 'ar' ? 'تحميل الصورة' : 'Download'}
                  </button>
                </div>
              </div>
            )}

            {/* ERROR STEP */}
            {step === 'error' && (
              <div className="flex flex-col items-center gap-5 max-w-sm text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-red-300">
                    {language === 'ar' ? 'حدث خطأ!' : 'Something went wrong!'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800">{errorMessage}</p>
                </div>
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-xl font-bold text-xs transition flex items-center gap-2 active:scale-95"
                >
                  <RefreshCw size={12} />
                  {language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
                </button>
              </div>
            )}

          </div>

          {/* RIGHT: Product Selector + Mix & Match */}
          <div className="w-full md:w-80 bg-neutral-950 p-5 flex flex-col gap-5 overflow-y-auto">

            {/* Currently selected garment */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                {language === 'ar' ? 'القطعة المختارة للتجربة' : 'Selected Garment'}
              </span>
              <div className="bg-neutral-900 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-3">
                <img src={selectedProduct.image} className="w-12 h-12 object-cover rounded-xl border border-neutral-800" alt={selectedProduct.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-100 truncate">{selectedProduct.name}</p>
                  <p className="text-[10px] text-amber-500 font-bold mt-0.5">{selectedProduct.price} {language === 'ar' ? 'ج.م' : 'EGP'}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              </div>
            </div>

            {/* Mix & Match Picker */}
            <div className="space-y-3 border-t border-neutral-900 pt-4">
              <div className="flex items-center gap-2">
                <Layers size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {language === 'ar' ? 'جرب قطع أخرى' : 'Try Other Pieces'}
                </span>
              </div>

              {/* Tops */}
              {storeTops.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-600 font-bold">{language === 'ar' ? 'قطع علوية' : 'Tops'}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {storeTops.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); reset(); }}
                        className={`flex-shrink-0 w-[72px] rounded-xl border p-1.5 transition text-center ${selectedProduct.id === p.id ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}`}
                      >
                        <img src={p.image} className="w-full aspect-square object-cover rounded-lg" alt={p.name} />
                        <p className="text-[8px] font-bold text-neutral-400 truncate mt-1">{p.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottoms */}
              {storeBottoms.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-600 font-bold">{language === 'ar' ? 'قطع سفلية' : 'Bottoms'}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {storeBottoms.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); reset(); }}
                        className={`flex-shrink-0 w-[72px] rounded-xl border p-1.5 transition text-center ${selectedProduct.id === p.id ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}`}
                      >
                        <img src={p.image} className="w-full aspect-square object-cover rounded-lg" alt={p.name} />
                        <p className="text-[8px] font-bold text-neutral-400 truncate mt-1">{p.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="border-t border-neutral-900 pt-4 space-y-2">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {language === 'ar' ? 'نصائح للحصول على أفضل نتيجة' : 'Tips for best results'}
              </p>
              <ul className="space-y-1.5 text-[10px] text-neutral-600">
                <li className="flex items-start gap-1.5"><span className="text-amber-500 flex-shrink-0">✓</span>{language === 'ar' ? 'صورة أمامية كاملة الجسم' : 'Full-body front-facing photo'}</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-500 flex-shrink-0">✓</span>{language === 'ar' ? 'إضاءة جيدة وخلفية بسيطة' : 'Good lighting, simple background'}</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-500 flex-shrink-0">✓</span>{language === 'ar' ? 'ملابسك الحالية واضحة وبسيطة' : 'Wear plain, simple clothes'}</li>
              </ul>
            </div>

            {/* Buy CTA */}
            <button
              onClick={() => { alert(language === 'ar' ? 'تم إضافة القطعة إلى سلة التسوق!' : 'Item added to cart!'); onClose(); }}
              className="w-full py-3 bg-white hover:bg-amber-50 text-neutral-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition mt-auto"
            >
              <ShoppingBag size={12} />
              {language === 'ar' ? 'شراء هذه القطعة' : 'Buy This Item'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};
