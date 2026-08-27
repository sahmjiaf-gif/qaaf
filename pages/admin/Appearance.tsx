
import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Save, Plus, Trash2, Upload, Droplet, ImageIcon, Type, Languages, Palette, Search, FileText, Download, CheckCircle2, MessageSquare, Crop, Scissors } from 'lucide-react';
import { ARABIC_FONTS, ENGLISH_FONTS } from '../../fontList';
import { translations as defaultTranslations } from '../../translations';
import Invoice from '../../components/Invoice';
import { Order, BrandingConfig, SliderItem } from '../../types';
import Cropper from 'react-easy-crop';

const getCroppedImg = async (imageSrc: string, pixelCrop: any, isTransparent: boolean = false, bgTolerance: number = 0): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = error => reject(error);
  });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  if (bgTolerance > 0) {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Auto-detect background color from corners
    const corners = [
      0, // top-left
      (width - 1) * 4, // top-right
      (height - 1) * width * 4, // bottom-left
      ((height - 1) * width + width - 1) * 4 // bottom-right
    ];
    let bgR = 0, bgG = 0, bgB = 0;
    for (const p of corners) {
      bgR += data[p]; bgG += data[p+1]; bgB += data[p+2];
    }
    bgR = Math.round(bgR / 4);
    bgG = Math.round(bgG / 4);
    bgB = Math.round(bgB / 4);
    
    // Fallback if corners are transparent
    if (data[3] === 0) { bgR = 255; bgG = 255; bgB = 255; }

    // Distance threshold: tolerance 1-100 maps to 0-300 distance
    const threshold = bgTolerance * 3;
    
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height * 4);
    let head = 0;
    let tail = 0;
    
    const push = (idx: number) => {
      if (!visited[idx]) {
        visited[idx] = 1;
        queue[tail++] = idx;
      }
    };
    
    for (let x = 0; x < width; x++) { push(x); push((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { push(y * width); push(y * width + width - 1); }
    
    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = Math.floor(idx / width);
      const p = idx * 4;
      
      const r = data[p], g = data[p+1], b = data[p+2], a = data[p+3];
      if (a === 0) continue;
      
      // Color distance from auto-detected background
      const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      
      if (dist <= threshold) {
        data[p+3] = 0; // Make it fully transparent
        
        if (x > 0) push(idx - 1);
        if (x < width - 1) push(idx + 1);
        if (y > 0) push(idx - width);
        if (y < height - 1) push(idx + width);
      }
    }
    
    // Pass 2: Edge smoothing (Anti-aliasing recovery)
    for (let idx = 0; idx < width * height; idx++) {
      const p = idx * 4;
      if (data[p+3] === 0) continue; // Skip already transparent pixels
      
      const x = idx % width;
      const y = Math.floor(idx / width);
      
      let isEdge = false;
      if (x > 0 && data[(idx - 1) * 4 + 3] === 0) isEdge = true;
      else if (x < width - 1 && data[(idx + 1) * 4 + 3] === 0) isEdge = true;
      else if (y > 0 && data[(idx - width) * 4 + 3] === 0) isEdge = true;
      else if (y < height - 1 && data[(idx + width) * 4 + 3] === 0) isEdge = true;
      
      if (isEdge) {
        const r = data[p], g = data[p+1], b = data[p+2];
        const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        if (dist <= threshold + 80) {
           const alphaFactor = (dist - threshold) / 80; 
           data[p+3] = Math.max(0, Math.min(255, Math.floor(alphaFactor * 255)));
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  // Use PNG for transparency, otherwise compress as JPEG to save space
  const mimeType = isTransparent || bgTolerance > 0 ? 'image/png' : 'image/jpeg';
  const quality = mimeType === 'image/png' ? undefined : 0.92;
  return canvas.toDataURL(mimeType, quality);
};

// Force Vite HMR reload
const Appearance: React.FC = () => {
  const { branding: globalBranding, setBranding, language, t } = useApp();
  
  // Local state for editing to avoid hitting Supabase on every keystroke
  const [localBranding, setLocalBranding] = React.useState<BrandingConfig>(globalBranding);
  const [activeTab, setActiveTab] = React.useState<'design' | 'fonts' | 'texts' | 'invoice' | 'studio'>('design');
  const [saving, setSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [textSearch, setTextSearch] = React.useState('');
  const [activeTextCategory, setActiveTextCategory] = React.useState<string>('all');
  
  // Studio State
  const [studioImage, setStudioImage] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null);
  const [exportTarget, setExportTarget] = React.useState<string>('');
  const [customAspect, setCustomAspect] = React.useState<number | undefined>(3/1);
  const [isTransparent, setIsTransparent] = React.useState<boolean>(true);
  const [bgTolerance, setBgTolerance] = React.useState<number>(0);

  // Sync local state when global branding is loaded or changed externally
  React.useEffect(() => {
    setLocalBranding(globalBranding);
  }, [globalBranding]);

  const TEXT_CATEGORIES = [
    { id: 'general', title: 'عناوين وأزرار عامة', icon: <Languages size={18} />, keys: ['home', 'shop', 'myOrders', 'myConsultations', 'about', 'adminPanel', 'shopNow', 'seeAll', 'backToHome'] },
    { id: 'cart', title: 'سلة التسوق والدفع', icon: <Languages size={18} />, keys: ['cart', 'emptyCart', 'total', 'subtotal', 'discount', 'confirmOrder', 'cancel', 'sendOrder', 'checkoutTitle', 'successOrder', 'addToCart', 'addedToCart', 'addedQuantityToCart', 'egp'] },
    { id: 'product', title: 'تفاصيل المنتج', icon: <Languages size={18} />, keys: ['latestProducts', 'newCollection', 'outOfStock', 'outOfStockToast', 'aboutProduct', 'shareProduct', 'natural100', 'clinicallyTested', 'madeWithLove'] },
    { id: 'brand', title: 'العلامة التجارية', icon: <Languages size={18} />, keys: ['philosophy', 'naturalIngredients', 'ecoFriendly', 'footerDesc', 'allRightsReserved', 'evidenceBased'] },
    { id: 'checkout', title: 'بيانات العميل', icon: <Languages size={18} />, keys: ['fullName', 'phone', 'address', 'landmark'] },
    { id: 'orders', title: 'الطلبات والخصومات', icon: <Languages size={18} />, keys: ['cancelOrder', 'noOrders', 'orderDate', 'orderNumber', 'promoCode', 'apply', 'invalidPromo', 'discountApplied'] },
    { id: 'consultation', title: 'الاستشارات', icon: <Languages size={18} />, keys: ['searchConsultation', 'searchPlaceholder', 'searchBtn', 'yourQuestion', 'expertReply', 'medicallyApproved', 'replySoon', 'reviewingConsultation', 'noConsultations', 'requestFreeConsultation'] },
    { id: 'status', title: 'حالات الطلب', icon: <Languages size={18} />, keys: ['orderStatus'] },
    { id: 'invoice', title: 'الفاتورة والطباعة', icon: <Languages size={18} />, keys: ['invoice'] },
  ];

  const handleUpdate = (key: string, value: any) => {
    if (!localBranding) return;
    setLocalBranding(prev => ({ ...prev, [key]: value }));
  };

  if (!globalBranding || !localBranding) {
    return (
      <AdminLayout title={t?.adminAppearance || 'Interface Customization'}>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="font-bold">Loading Appearance Settings...</p>
        </div>
      </AdminLayout>
    );
  }

  const handleTranslationUpdate = (lang: 'ar' | 'en', key: string, value: string, nestedKey?: string) => {
    const currentCustom = localBranding.customTranslations || { ar: {}, en: {} };
    const newLang = { ...currentCustom[lang] };
    
    if (nestedKey) {
      newLang[key] = { ...(newLang[key] || {}), [nestedKey]: value };
    } else {
      newLang[key] = value;
    }

    handleUpdate('customTranslations', { ...currentCustom, [lang]: newLang });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onerror = () => {
          // If browser can't decode (like HEIC), just pass the raw base64 and hope for the best, or alert.
          if ((file.name || '').toLowerCase().endsWith('.heic')) {
             alert('صيغة HEIC غير مدعومة مباشرة. يرجى تحويل الصورة إلى JPG أو PNG.');
          }
          callback(reader.result as string);
        };
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            const MAX_WIDTH = 1920; // Reverted to 1920 to prevent Firebase 1MB crash
            const MAX_HEIGHT = 1920;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
            }

            // Convert to WebP for maximum quality with minimal file size (prevents 1MB Firebase crash)
            const compressedBase64 = canvas.toDataURL('image/webp', 0.95);
            callback(compressedBase64);
          } catch (err) {
            callback(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSliderItem = (id: string, field: keyof SliderItem, value: any) => {
    const newSlider = (localBranding.slider || []).map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    handleUpdate('slider', newSlider);
  };

  const addSliderItem = () => {
    const newItem: SliderItem = { 
      id: Date.now().toString(), 
      title: 'عنوان جديد', 
      subtitle: '', 
      image: '', 
      vPos: 'bottom', 
      hPos: 'center',
      buttonVPos: 'bottom',
      buttonHPos: 'center',
      fontSize: 56
    };
    handleUpdate('slider', [...(localBranding.slider || []), newItem]);
  };

  const removeSliderItem = (id: string) => {
    handleUpdate('slider', (localBranding.slider || []).filter(i => i.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setBranding(localBranding);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Save Error:", err);
      alert("فشل الحفظ: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout 
      title="تخصيص الواجهة"
      actions={
        <div className="flex items-center gap-3">
          {showSuccess && (
            <span className="text-green-600 font-bold text-[10px] flex items-center gap-1 animate-in fade-in slide-in-from-left">
              <CheckCircle2 size={14} />
              تم الحفظ
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50 text-xs"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            حفظ التعديلات
          </button>
        </div>
      }
    >
      <div className="space-y-8" dir="rtl">
        {/* Navigation Tabs */}
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('studio')}
            className={`px-6 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'studio' ? 'bg-[#c5a059] text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Scissors size={18} />
            استوديو الصور
          </button>
          <button 
            onClick={() => setActiveTab('design')}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'design' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Palette size={18} />
            التصميم والصور
          </button>
          <button 
            onClick={() => setActiveTab('fonts')}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'fonts' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Type size={18} />
            الخطوط
          </button>
          <button 
            onClick={() => setActiveTab('texts')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'texts' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Languages size={18} />
            إدارة النصوص
          </button>
          <button 
            onClick={() => setActiveTab('invoice')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'invoice' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <FileText size={18} />
            الفواتير
          </button>
        </div>

        {activeTab === 'studio' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Scissors className="text-amber-500" size={24} />
                  استوديو تعديل وقص الصور (احترافي)
                </h3>
              </div>

              {!studioImage ? (
                <div className="w-full aspect-video md:aspect-[21/9] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                   <Upload className="text-[#c5a059] mb-4" size={48} />
                   <p className="text-gray-600 font-bold">اضغط هنا أو اسحب صورة للبدء في تعديلها وقصها</p>
                   <p className="text-xs text-gray-400 mt-2">ستتمكن من تصدير الصورة بعد قصها إلى السلايدر أو اللوجو</p>
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onloadend = () => setStudioImage(reader.result as string);
                       reader.readAsDataURL(file);
                     }
                   }} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative w-full h-[60svh] bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-inner">
                    <Cropper
                      image={studioImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={exportTarget.includes('hero') || exportTarget.includes('desktop') || exportTarget.includes('image') && !exportTarget.includes('mobile') ? 16/9 : exportTarget.includes('mobile') ? 9/16 : exportTarget === 'logoImage' ? customAspect : undefined}
                      onCropChange={setCrop}
                      onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                      onZoomChange={setZoom}
                      showGrid={true}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-6 rounded-2xl border border-gray-100">
                     <div className="flex-1 space-y-2 w-full">
                       <label className="text-sm font-bold text-gray-700">تكبير / تصغير</label>
                       <input 
                         type="range" 
                         value={zoom} 
                         min={1} 
                         max={3} 
                         step={0.1} 
                         onChange={(e) => setZoom(Number(e.target.value))}
                         className="w-full accent-amber-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                       />
                     </div>
                     <div className="flex-1 space-y-2 w-full">
                       <label className="text-sm font-bold text-gray-700">تصدير الصورة إلى:</label>
                       <select 
                         value={exportTarget}
                         onChange={(e) => setExportTarget(e.target.value)}
                         className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#c5a059] focus:border-[#c5a059] block p-3"
                       >
                         <option value="">-- اختر المكان المراد تصدير الصورة إليه --</option>
                         <option value="heroImage">صورة الهيرو البديلة (Hero Image)</option>
                         <option value="logoImage">اللوجو (Logo)</option>
                         <option value="favicon">أيقونة الموقع (Favicon)</option>
                         <option value="about_image">صورة قسم "من نحن"</option>
                         <option value="consultation_image">صورة قسم الاستشارات</option>
                         {localBranding.slider?.map((s, i) => (
                           <optgroup key={s.id} label={`شريحة السلايدر: ${s.title || `شريحة ${i + 1}`}`}>
                             <option value={`slider_${s.id}_image`}>صورة الكمبيوتر (لهذه الشريحة)</option>
                             <option value={`slider_${s.id}_mobileImage`}>صورة الموبايل (لهذه الشريحة)</option>
                           </optgroup>
                         ))}
                       </select>
                       
                       {(exportTarget === 'logoImage' || exportTarget === 'favicon') && (
                         <div className="flex flex-col gap-3 mt-4 bg-white p-3 rounded-xl border border-gray-200">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                               <input type="checkbox" checked={isTransparent} onChange={e => setIsTransparent(e.target.checked)} className="rounded text-[#c5a059] focus:ring-[#c5a059]" />
                               حفظ كصورة شفافة (PNG)
                            </label>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-gray-700">أبعاد اللوجو</label>
                               <div className="flex gap-2">
                                 <button onClick={() => setCustomAspect(undefined)} className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${customAspect === undefined ? 'bg-[#c5a059] text-white border-[#c5a059]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>حر</button>
                                 <button onClick={() => setCustomAspect(1)} className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${customAspect === 1 ? 'bg-[#c5a059] text-white border-[#c5a059]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>مربع (1:1)</button>
                                 <button onClick={() => setCustomAspect(3/1)} className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${customAspect === 3/1 ? 'bg-[#c5a059] text-white border-[#c5a059]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>عريض (3:1)</button>
                               </div>
                            </div>
                            <div className="space-y-2 mt-1 pt-3 border-t border-gray-100">
                               <label className="text-xs font-bold text-gray-700">تفريغ الخلفية البيضاء (يدوي - يحافظ على جودة اللوجو)</label>
                               <input type="range" value={bgTolerance} min={0} max={100} onChange={e => { setBgTolerance(Number(e.target.value)); if (e.target.value !== '0') setIsTransparent(true); }} className="w-full accent-[#c5a059]" />
                               <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                 <span>بدون تفريغ (0%)</span>
                                 <span>{bgTolerance}%</span>
                                 <span>تفريغ قوي (100%)</span>
                               </div>
                               <p className="text-[9px] text-gray-500 font-bold mt-1">حرك المؤشر تدريجياً لليمين حتى تختفي الخلفية البيضاء مع الحفاظ على ظل اللوجو.</p>
                            </div>
                         </div>
                       )}
                     </div>
                     <button
                       onClick={async () => {
                         if (!exportTarget || !croppedAreaPixels || !studioImage) return alert("الرجاء اختيار مكان التصدير أولاً");
                         try {
                           let croppedBase64 = await getCroppedImg(
                             studioImage, 
                             croppedAreaPixels, 
                             isTransparent && (exportTarget === 'logoImage' || exportTarget === 'favicon'),
                             bgTolerance
                           );
                           
                           if (exportTarget.startsWith('slider_')) {
                             const [, id, field] = exportTarget.split('_');
                             updateSliderItem(id, field as keyof SliderItem, croppedBase64);
                           } else if (exportTarget.startsWith('about_')) {
                             handleUpdate('about', { ...(localBranding.about || {}), image: croppedBase64 });
                           } else if (exportTarget.startsWith('consultation_')) {
                             handleUpdate('consultation', { ...(localBranding.consultation || {}), image: croppedBase64 });
                           } else {
                             handleUpdate(exportTarget as keyof BrandingConfig, croppedBase64);
                           }
                           alert("تم التصدير بنجاح! لا تنس الضغط على زر 'حفظ التعديلات' بالأعلى لحفظ التغييرات في الموقع.");
                           setStudioImage(null); // Reset
                           setBgTolerance(0);
                         } catch (e) {
                           console.error(e);
                           alert("حدث خطأ أثناء القص والتصدير.");
                         }
                       }}
                       disabled={!exportTarget}
                       className="bg-[#c5a059] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-amber-600 transition disabled:opacity-50 h-[46px] whitespace-nowrap flex items-center gap-2 justify-center"
                     >
                       قص وتصدير للقسم
                     </button>
                     <button
                       onClick={() => setStudioImage(null)}
                       className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition h-[46px]"
                     >
                       إلغاء
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="w-full max-w-full mx-auto space-y-8 px-1 md:px-2">
            {/* 1. SLIDER CONFIG */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-end">
                    <ImageIcon className="text-gray-400" size={20} />
                    1. إعدادات الصور المتحركة (SLIDER)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">الأبعاد المناسبة: 1080x1920 (للهاتف)</p>
                </div>
                <button onClick={addSliderItem} className="bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-amber-700 transition shadow-lg shadow-amber-600/20">
                  <Plus size={18} /> إضافة شريحة جديدة
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {(localBranding.slider || []).map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center gap-8 relative group w-full">
                    <div className="flex flex-col md:flex-row gap-6 w-full lg:w-[58%]">
                      {/* Desktop Image */}
                      <div className="flex-1 space-y-2 text-center">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">صورة الكمبيوتر</label>
                        <span className="text-[9px] text-amber-600 font-bold block mb-2">الأبعاد: 1920x1080 (أفقي 16:9)</span>
                        <div className="aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center relative group/img min-w-[200px]">
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-200" size={32} />
                          )}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center cursor-pointer">
                            <Upload className="text-white" size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => updateSliderItem(item.id, 'image', b64))} />
                          </label>
                        </div>
                      </div>

                      {/* Mobile Image */}
                      <div className="flex-1 space-y-2 text-center">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">صورة الموبايل</label>
                        <span className="text-[9px] text-amber-600 font-bold block mb-2">الأبعاد: 1080x1920 (رأسي 9:16)</span>
                        <div className="aspect-[9/16] h-48 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center relative group/img mx-auto">
                          {item.mobileImage ? (
                            <img src={item.mobileImage} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-200" size={32} />
                          )}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center cursor-pointer">
                            <Upload className="text-white" size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => updateSliderItem(item.id, 'mobileImage', b64))} />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full space-y-4 text-right">
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">نص الشريحة</label>
                        <input 
                          value={item.title} 
                          onChange={(e) => updateSliderItem(item.id, 'title', e.target.value)} 
                          className="text-lg font-bold bg-gray-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-black/5 outline-none w-full text-right"
                          placeholder="العنوان الرئيسي..."
                        />
                        <input 
                          value={item.subtitle || ''} 
                          onChange={(e) => updateSliderItem(item.id, 'subtitle', e.target.value)} 
                          className="text-sm bg-gray-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-black/5 outline-none w-full text-right"
                          placeholder="العنوان الفرعي..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">موقع النص</label>
                          <div className="flex gap-2">
                            <select 
                              value={item.vPos || 'center'} 
                              onChange={(e) => updateSliderItem(item.id, 'vPos', e.target.value)}
                              className="w-full text-xs bg-gray-50 border-none rounded-lg px-2 py-2 outline-none font-bold"
                            >
                              <option value="top">أعلى</option>
                              <option value="center">وسط</option>
                              <option value="bottom">أسفل</option>
                            </select>
                            <select 
                              value={item.hPos || 'center'} 
                              onChange={(e) => updateSliderItem(item.id, 'hPos', e.target.value)}
                              className="w-full text-xs bg-gray-50 border-none rounded-lg px-2 py-2 outline-none font-bold"
                            >
                              <option value="right">يمين</option>
                              <option value="center">وسط</option>
                              <option value="left">يسار</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">حجم الخط ({item.fontSize || 48}px)</label>
                          <input 
                            type="range" min="20" max="120"
                            value={item.fontSize || 48}
                            onChange={(e) => updateSliderItem(item.id, 'fontSize', parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
                          />
                        </div>
                      </div>
                    </div>

                    <button onClick={() => removeSliderItem(item.id)} className="text-red-400 hover:text-red-600 transition p-2 self-start">
                       <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                </div>
              </div>

            {/* 2. BRANDING IDENTITY */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-end">
                <Palette className="text-gray-400" size={20} />
                2. الهوية البصرية والعلامة التجارية
              </h3>
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
                
                {/* Logo & Favicon Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 text-right space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400">الأبعاد: 500x200 بكسل</span>
                        <label className="text-xs font-black text-gray-800 uppercase tracking-widest">شعار المتجر (Logo)</label>
                     </div>
                     <div className="h-40 bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-6 shadow-inner relative group">
                        {localBranding.logoImage ? <img src={localBranding.logoImage} className="max-w-full max-h-full object-contain" /> : <Droplet className="text-gray-200" size={48} />}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer rounded-2xl">
                           <Upload className="text-white" size={24} />
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => handleUpdate('logoImage', b64))} />
                        </label>
                     </div>
                     <p className="text-[10px] text-gray-400 leading-relaxed">الشعار الأساسي الذي يظهر في أعلى الموقع. يفضل أن يكون بخلفية شفافة (PNG).</p>
                     
                     <div className="pt-4 border-t border-gray-100/50">
                       <label className="text-xs font-bold text-gray-800 uppercase flex justify-between mb-2">
                         <span>حجم اللوجو بالموقع والفواتير</span>
                         <span className="text-amber-600">{localBranding.logoSize || 100}%</span>
                       </label>
                       <input 
                         type="range" 
                         min="50" 
                         max="300" 
                         value={localBranding.logoSize || 100} 
                         onChange={(e) => handleUpdate('logoSize', parseInt(e.target.value))} 
                         className="w-full accent-[#c5a059]" 
                       />
                     </div>
                  </div>

                  <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 text-right space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400">الأبعاد: 32x32 بكسل</span>
                        <label className="text-xs font-black text-gray-800 uppercase tracking-widest">أيقونة المتصفح (Favicon)</label>
                     </div>
                     <div className="h-40 bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-6 shadow-inner relative group">
                        {localBranding.favicon ? <img src={localBranding.favicon} className="w-12 h-12 object-contain" /> : <ImageIcon className="text-gray-200" size={48} />}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer rounded-2xl">
                           <Upload className="text-white" size={24} />
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => handleUpdate('favicon', b64))} />
                        </label>
                     </div>
                     <p className="text-[10px] text-gray-400 leading-relaxed">الأيقونة الصغيرة التي تظهر في تبيوب المتصفح بجانب اسم الموقع.</p>
                  </div>
                </div>

                {/* Brand Messaging */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2 text-right">
                      <label className="text-[10px] font-bold text-gray-800 uppercase block">وصف العلامة التجارية (Tagline)</label>
                      <input 
                        type="text"
                        value={localBranding.logoTitle || ''}
                        onChange={(e) => handleUpdate('logoTitle', e.target.value)}
                        placeholder="مثال: عناية بالبشرة مبنية على الأدلة"
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                      />
                   </div>
                   <div className="space-y-2 text-right">
                      <label className="text-[10px] font-bold text-gray-800 uppercase block">نص الحقوق في الأسفل</label>
                      <input 
                        type="text"
                        value={localBranding.copyright || ''}
                        onChange={(e) => handleUpdate('copyright', e.target.value)}
                        placeholder="© 2024 QAAF WORLDWIDE"
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                      />
                   </div>
                </div>

                {/* 3. ANNOUNCEMENT BAR & SEO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                   <div className="space-y-6 text-right">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 justify-end">
                         <Search size={16} className="text-amber-600" />
                         إعدادات محركات البحث (SEO)
                      </h4>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 block">عنوان الموقع المتصدر</label>
                            <input 
                              type="text"
                              value={localBranding.siteTitle || ''}
                              onChange={(e) => handleUpdate('siteTitle', e.target.value)}
                              placeholder="QAAF | Evidence-Based Skincare"
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 block">وصف الموقع (Meta Description)</label>
                            <textarea 
                              value={localBranding.siteDescription || ''}
                              onChange={(e) => handleUpdate('siteDescription', e.target.value)}
                              placeholder="اكتب وصفاً مختصراً للموقع يظهر في نتائج بحث جوجل..."
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none h-20 resize-none"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6 text-right">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full">
                            <input 
                              type="checkbox" 
                              checked={localBranding.showAnnouncement || false}
                              onChange={(e) => handleUpdate('showAnnouncement', e.target.checked)}
                              className="w-3 h-3 accent-amber-600"
                            />
                            <span className="text-[10px] font-bold text-amber-900 uppercase">تفعيل البار العلوي</span>
                         </div>
                         <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 justify-end">
                            <Palette size={16} className="text-amber-600" />
                            شريط الإعلانات (Announcement Bar)
                         </h4>
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 block">نص الإعلان</label>
                            <input 
                              type="text"
                              value={localBranding.announcementText || ''}
                              onChange={(e) => handleUpdate('announcementText', e.target.value)}
                              placeholder="شحن مجاني للطلبات أكثر من 1000 جنيه"
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 block">لون البار</label>
                            <input 
                              type="color"
                              value={localBranding.announcementBg || '#000000'}
                              onChange={(e) => handleUpdate('announcementBg', e.target.value)}
                              className="w-full h-8 rounded-lg cursor-pointer border-none bg-transparent"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                   <div className="space-y-6 text-right">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 justify-end">
                         <FileText size={16} className="text-amber-600" />
                         محتوى قسم (عن قاف)
                      </h4>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 block">عنوان القسم</label>
                            <input 
                              type="text"
                              value={localBranding.aboutTitle || ''}
                              onChange={(e) => handleUpdate('aboutTitle', e.target.value)}
                              placeholder="عن قاف"
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 block">وصف القسم</label>
                            <textarea 
                              value={localBranding.aboutDescription || ''}
                              onChange={(e) => handleUpdate('aboutDescription', e.target.value)}
                              placeholder="اكتب قصة العلامة التجارية هنا..."
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none h-44 resize-none"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="text-right space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-gray-800 uppercase block">صورة القسم</label>
                      <span className="text-[9px] text-gray-400">1080x1350 بكسل</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 group relative aspect-[4/5] w-full max-w-[300px] mx-auto overflow-hidden">
                      {localBranding.aboutImage ? (
                        <img src={localBranding.aboutImage} className="w-full h-full object-cover shadow-lg" />
                      ) : <div className="text-xs text-gray-400">لا توجد صورة حالياً</div>}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                        <Upload className="text-white" size={24} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => handleUpdate('aboutImage', b64))} />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">هذه الصورة ستظهر بجانب قصة العلامة التجارية.</p>
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-50">
                  <div className="space-y-3 text-right">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">اللون الأساسي (أزرار)</label>
                    <div className="flex gap-3 justify-end items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <input 
                        type="color" 
                        value={localBranding.primaryColor} 
                        onChange={(e) => handleUpdate('primaryColor', e.target.value)} 
                        className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold">{localBranding.primaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">اللون الثانوي (خلفيات)</label>
                    <div className="flex gap-3 justify-end items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <input 
                        type="color" 
                        value={localBranding.secondaryColor || '#ffffff'} 
                        onChange={(e) => handleUpdate('secondaryColor', e.target.value)} 
                        className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold">{localBranding.secondaryColor || '#ffffff'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">اللون التمييزي (نجوم وعروض)</label>
                    <div className="flex gap-3 justify-end items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <input 
                        type="color" 
                        value={localBranding.accentColor || '#D97706'} 
                        onChange={(e) => handleUpdate('accentColor', e.target.value)} 
                        className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold">{localBranding.accentColor || '#D97706'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-gray-50 text-right">
                  <div className="flex items-center justify-between bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50">
                    <div className="flex items-center gap-3">
                       <input 
                         type="checkbox" 
                         checked={localBranding.showTexture || false}
                         onChange={(e) => handleUpdate('showTexture', e.target.checked)}
                         className="w-5 h-5 accent-amber-600 cursor-pointer"
                       />
                       <div className="text-right">
                          <label className="text-sm font-black text-gray-900 block">تفعيل ملمس الخلفية (Premium Texture)</label>
                          <p className="text-[10px] text-gray-500">يضيف طبقة رقيقة من "الـ Noise" الفاخر لخلفية الموقع ليعطيه طابع الكتالوجات الورقية الراقية.</p>
                       </div>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                       <Droplet size={20} />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="text-[10px] font-bold text-gray-800 uppercase block">شكل الحواف</label>
                    <select 
                      value={localBranding.borderRadius || 'lg'} 
                      onChange={(e) => handleUpdate('borderRadius', e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="none">حادة (None)</option>
                      <option value="md">متوسطة (Medium)</option>
                      <option value="lg">كبيرة (Large)</option>
                      <option value="full">دائرية بالكامل (Full)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fonts' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Dynamic Font Loader */}
            <React.Fragment>
              {(() => {
                const allFontNames = [
                  ...ARABIC_FONTS.map(f => f.name.replace(/\s+/g, '+')),
                  ...ENGLISH_FONTS.map(f => f.name.replace(/\s+/g, '+'))
                ];
                const chunks = [];
                for (let i = 0; i < allFontNames.length; i += 15) {
                  chunks.push(allFontNames.slice(i, i + 15));
                }
                return chunks.map((chunk, idx) => (
                  <link 
                    key={idx}
                    rel="stylesheet" 
                    href={`https://fonts.googleapis.com/css2?${chunk.map(name => `family=${name}`).join('&')}&display=swap`} 
                  />
                ));
              })()}
            </React.Fragment>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">Arabic Typography</span>
                  <h3 className="text-gray-900 font-bold text-lg text-right">الخط العربي الرئيسي</h3>
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {ARABIC_FONTS.map(font => (
                    <button 
                      key={font.name}
                      onClick={() => handleUpdate('arabicFont', font.name)}
                      className={`p-6 rounded-2xl border-2 transition-all text-right group relative overflow-hidden ${localBranding.arabicFont === font.name ? 'border-black bg-black text-white shadow-2xl scale-[1.02]' : 'border-gray-50 bg-gray-50/50 text-gray-600 hover:border-gray-200 hover:bg-white'}`}
                    >
                      <span className="block text-3xl mb-3 leading-relaxed" style={{ fontFamily: font.family }}>قاف للجمال والفخامة</span>
                      <div className="flex items-center justify-between border-t border-current/10 pt-3">
                         <span className="text-[9px] font-black tracking-widest uppercase opacity-40">{font.name}</span>
                         {localBranding.arabicFont === font.name && <CheckCircle2 size={14} className="text-amber-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">English Typography</span>
                  <h3 className="text-gray-900 font-bold text-lg text-right">الخط الإنجليزي الرئيسي</h3>
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {ENGLISH_FONTS.map(font => (
                    <button 
                      key={font.name}
                      onClick={() => handleUpdate('englishFont', font.name)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left group relative overflow-hidden ${localBranding.englishFont === font.name ? 'border-black bg-black text-white shadow-2xl scale-[1.02]' : 'border-gray-50 bg-gray-50/50 text-gray-600 hover:border-gray-200 hover:bg-white'}`}
                    >
                      <span className="block text-3xl mb-3 leading-tight" style={{ fontFamily: font.family }}>Luxury & Elegance</span>
                      <div className="flex items-center justify-between border-t border-current/10 pt-3">
                         <span className="text-[9px] font-black tracking-widest uppercase opacity-40">{font.name}</span>
                         {localBranding.englishFont === font.name && <CheckCircle2 size={14} className="text-amber-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'texts' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">إدارة نصوص الموقع</h3>
                <p className="text-sm text-gray-500">قم بتغيير أي نص يظهر للعملاء في الواجهة الأمامية باللغتين</p>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث عن نص (مثال: سلة التسوق)..." 
                  value={textSearch}
                  onChange={(e) => setTextSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl py-3 pr-12 pl-4 outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setActiveTextCategory('all')}
                className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTextCategory === 'all' ? 'bg-black text-white' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'}`}
              >
                الكل
              </button>
              {TEXT_CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveTextCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTextCategory === cat.id ? 'bg-black text-white' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
              {TEXT_CATEGORIES.filter(cat => activeTextCategory === 'all' || activeTextCategory === cat.id).map(category => {
                const categoryKeys = category.keys.filter(key => {
                  const val = (defaultTranslations.ar as any)[key];
                  if (!val) return false;
                  if (!textSearch) return true;
                  
                  if (typeof val === 'object') {
                    return Object.values(val).some(v => String(v).toLowerCase().includes(textSearch.toLowerCase())) || key.toLowerCase().includes(textSearch.toLowerCase());
                  }
                  return val.toString().toLowerCase().includes(textSearch.toLowerCase()) || key.toLowerCase().includes(textSearch.toLowerCase());
                });

                if (categoryKeys.length === 0) return null;

                return (
                  <div key={category.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                        {category.icon}
                      </div>
                      <h4 className="font-bold text-gray-900">{category.title}</h4>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {categoryKeys.map(key => {
                        const val = (defaultTranslations.ar as any)[key];
                        const currentAr = localBranding.customTranslations?.ar?.[key] || val;
                        const currentEn = localBranding.customTranslations?.en?.[key] || (defaultTranslations.en as any)[key];

                        if (typeof val === 'object' && val !== null) {
                          return Object.keys(val).map(subKey => (
                            <div key={`${key}-${subKey}`} className="p-6 hover:bg-orange-50/30 transition flex flex-col md:flex-row gap-6 items-center">
                              <div className="md:w-1/4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1 font-mono">{key}.{subKey}</span>
                                <span className="text-sm font-bold text-gray-800">{val[subKey]}</span>
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center z-10 text-gray-300 pointer-events-none hidden md:flex shadow-sm">
                                  <Languages size={14} />
                                </div>
                                <input 
                                  type="text" 
                                  value={localBranding.customTranslations?.ar?.[key]?.[subKey] || val[subKey]}
                                  onChange={(e) => handleTranslationUpdate('ar', key, e.target.value, subKey)}
                                  placeholder="النص بالعربية"
                                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-right transition"
                                />
                                <input 
                                  type="text" 
                                  value={localBranding.customTranslations?.en?.[key]?.[subKey] || (defaultTranslations.en as any)[key][subKey]}
                                  onChange={(e) => handleTranslationUpdate('en', key, e.target.value, subKey)}
                                  placeholder="English Text"
                                  className="w-full bg-slate-50 border border-gray-200 rounded-2xl p-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold transition"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          ));
                        }

                        return (
                          <div key={key} className="p-6 hover:bg-orange-50/30 transition flex flex-col md:flex-row gap-6 items-center">
                            <div className="md:w-1/4">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1 font-mono">{key}</span>
                              <span className="text-sm font-bold text-gray-800 line-clamp-2" title={val}>{val}</span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full relative">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center z-10 text-gray-300 pointer-events-none hidden md:flex shadow-sm">
                                <Languages size={14} />
                              </div>
                              <textarea 
                                value={currentAr}
                                onChange={(e) => handleTranslationUpdate('ar', key, e.target.value)}
                                placeholder="النص بالعربية"
                                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none resize-none font-bold min-h-[60px] text-right transition"
                              />
                              <textarea 
                                value={currentEn}
                                onChange={(e) => handleTranslationUpdate('en', key, e.target.value)}
                                placeholder="English Text"
                                className="w-full bg-slate-50 border border-gray-200 rounded-2xl p-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none font-bold min-h-[60px] transition"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left panel: settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Style picker */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h4 className="font-bold text-gray-900 text-right">شكل الفاتورة</h4>
                <div className="grid grid-cols-1 gap-3">
                  {([
                    { value: 'classic', label: 'كلاسيكي', desc: 'التصميم الرسمي المعتاد' },
                    { value: 'modern', label: 'عصري ومظلل', desc: 'خلفيات غامقة وتدرجات' },
                    { value: 'minimal', label: 'بسيط وأنيق', desc: 'ممتاز للطباعة' },
                  ] as { value: string; label: string; desc: string }[]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleUpdate('invoiceStyle', opt.value)}
                      className={`p-4 rounded-2xl border-2 text-right transition-all ${(localBranding.invoiceStyle || 'classic') === opt.value ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
                    >
                      <span className="font-bold block">{opt.label}</span>
                      <span className={`text-xs ${(localBranding.invoiceStyle || 'classic') === opt.value ? 'text-white/70' : 'text-gray-400'}`}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text fields */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h4 className="font-bold text-gray-900 text-right">تعديل نصوص الفاتورة</h4>
                <p className="text-xs text-gray-400 text-right leading-relaxed">اكتب التعديل ← يظهر مباشرة في المعاينة ← ثم اضغط حفظ</p>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pl-1 pr-0.5">
                  {([
                    { subKey: 'title',        labelAr: 'عنوان الفاتورة',            defAr: 'فاتورة',                       defEn: 'INVOICE' },
                    { subKey: 'customerInfo', labelAr: 'قسم بيانات العميل',         defAr: 'بيانات العميل',                defEn: 'Customer' },
                    { subKey: 'details',      labelAr: 'قسم التفاصيل',             defAr: 'التفاصيل',                     defEn: 'Details' },
                    { subKey: 'date',         labelAr: 'كلمة التاريخ',             defAr: 'التاريخ',                      defEn: 'Date' },
                    { subKey: 'status',       labelAr: 'كلمة الحالة',              defAr: 'الحالة',                       defEn: 'Status' },
                    { subKey: 'productName',  labelAr: 'عمود المنتج',              defAr: 'المنتج',                       defEn: 'Product' },
                    { subKey: 'qty',          labelAr: 'عمود الكمية',              defAr: 'الكمية',                       defEn: 'Qty' },
                    { subKey: 'price',        labelAr: 'عمود السعر',               defAr: 'السعر',                        defEn: 'Price' },
                    { subKey: 'thankYou',     labelAr: 'جملة الشكر',               defAr: 'شكراً لثقتك في قاف',          defEn: 'Thank you for choosing QAAF' },
                    { subKey: 'print',        labelAr: 'زر الطباعة',               defAr: 'طباعة',                        defEn: 'Print' },
                    { subKey: 'downloadPdf',  labelAr: 'زر التحميل PDF',           defAr: 'تحميل PDF',                    defEn: 'Download PDF' },
                    { subKey: 'close',        labelAr: 'زر الإغلاق',              defAr: 'إغلاق',                        defEn: 'Close' },
                    { subKey: 'closeInvoice', labelAr: 'إغلاق الفاتورة',          defAr: 'إغلاق الفاتورة',               defEn: 'Close Invoice' },
                    { subKey: 'noProducts',   labelAr: 'رسالة: لا توجد منتجات',   defAr: 'بيانات المنتجات غير متوفرة',   defEn: 'Product details not available' },
                  ] as { subKey: string; labelAr: string; defAr: string; defEn: string }[]).map(({ subKey, labelAr, defAr, defEn }) => {
                    const customAr = (localBranding.customTranslations?.ar as any)?.invoice?.[subKey];
                    const customEn = (localBranding.customTranslations?.en as any)?.invoice?.[subKey];
                    const curAr = (customAr != null) ? customAr : defAr;
                    const curEn = (customEn != null) ? customEn : defEn;
                    return (
                      <div key={subKey} className="bg-gray-50 rounded-2xl p-3 space-y-2 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-right">{labelAr}</span>
                        <input
                          type="text"
                          value={curAr}
                          onChange={(e) => handleTranslationUpdate('ar', 'invoice', e.target.value, subKey)}
                          dir="rtl"
                          className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-sm font-bold text-right focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition"
                        />
                        <input
                          type="text"
                          value={curEn}
                          onChange={(e) => handleTranslationUpdate('en', 'invoice', e.target.value, subKey)}
                          dir="ltr"
                          className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right panel: live preview */}
            <div className="lg:col-span-2 bg-gray-100 rounded-3xl p-4 md:p-8 flex flex-col gap-4 shadow-inner min-h-[700px]">
              <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">معاينة مباشرة — Live Preview</p>
              <div className="flex justify-center overflow-x-auto">
                <div className="scale-[0.68] md:scale-[0.82] origin-top transition-all w-[520px] shrink-0">
                  <Invoice
                    order={{
                      id: 'DEMO-84920',
                      customerName: 'فاطمة أحمد',
                      phoneNumber: '01012345678',
                      governorate: 'القاهرة',
                      city: 'مدينة نصر',
                      address: 'شارع مكرم عبيد، عمارة 15',
                      landmark: 'بجوار السراج مول',
                      products: [
                        { product: { id: 'p1', name: 'سيروم فيتامين سي', category: 'عناية بالبشرة', price: 450, inStock: true, image: '' }, quantity: 1 },
                        { product: { id: 'p2', name: 'غسول للبشرة الدهنية', category: 'عناية بالبشرة', price: 250, inStock: true, image: '' }, quantity: 2 }
                      ],
                      status: 'processing',
                      date: new Date().toISOString(),
                      finalTotal: 950,
                      discountAmount: 0,
                      staffAssigned: false
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Appearance;
