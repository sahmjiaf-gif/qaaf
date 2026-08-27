import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { User, Lock, Mail, Phone, ShieldCheck, Check, Eye, EyeOff, Truck, MapPin, Zap, Plus, Trash2 } from 'lucide-react';
import { egyptLocations } from '../../egyptLocations';
import { FlashLimitOffer } from '../../types';

const Settings: React.FC = () => {
  const { adminAuth, setAdminAuth, branding, setBranding } = useApp();
  const [formData, setFormData] = useState(adminAuth);
  const [saved, setSaved] = useState(false);
  const [flashSaved, setFlashSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [checkingWa, setCheckingWa] = useState(false);
  const [waStatus, setWaStatus] = useState<{ type: 'success' | 'error' | 'warn'; msg: string } | null>(null);

  const [localWaStatus, setLocalWaStatus] = useState<string>('DISCONNECTED');
  const [localWaQr, setLocalWaQr] = useState<string>('');

  // ✅ Real-time listener from Firebase (works from any browser/hosting)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'whatsapp', 'status'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setLocalWaStatus(data.status || 'DISCONNECTED');
          setLocalWaQr(data.qr || '');
        }
      },
      (err) => console.error('Firebase WA status listener error:', err)
    );
    return () => unsubscribe();
  }, []);

  const handleLocalConnect = async () => {
    try {
      // Write command to Firebase - local server will pick it up
      await setDoc(doc(db, 'whatsapp', 'command'), { action: 'CONNECT', timestamp: Date.now() });
    } catch (err) {
      console.error('Failed to send connect command:', err);
    }
  };

  const handleLocalDisconnect = async () => {
    if (window.confirm('هل تريد مسح بيانات جلسة الواتساب الحالية؟')) {
      try {
        await setDoc(doc(db, 'whatsapp', 'command'), { action: 'DISCONNECT', timestamp: Date.now() });
      } catch (err) {
        console.error('Failed to send disconnect command:', err);
      }
    }
  };

  const handleTestWhatsApp = async () => {
    setCheckingWa(true);
    setWaStatus(null);
    const instanceId = branding.greenApiInstanceId || '7107624225';
    const apiToken = branding.greenApiToken || '15161302552e4373ad63cbeac1ec54d680c34b8d5bc644b1b1';
    
    try {
      const res = await fetch(`https://api.green-api.com/waInstance${instanceId}/getStateInstance/${apiToken}`);
      if (!res.ok) {
        throw new Error('فشل الاتصال');
      }
      const data = await res.json();
      if (data.stateInstance === 'authorized') {
        setWaStatus({
          type: 'success',
          msg: '🟢 متصل بنجاح! حساب الواتساب الخاص بك نشط وجاهز لإرسال الرسائل للعملاء.'
        });
      } else if (data.stateInstance === 'notAuthorized') {
        setWaStatus({
          type: 'warn',
          msg: '🟡 الحساب غير مفعل! يرجى الدخول للوحة تحكم Green API ومسح رمز الـ QR لتفعيل الواتساب الخاص بك.'
        });
      } else {
        setWaStatus({
          type: 'error',
          msg: `🔴 حالة الاتصال: ${data.stateInstance}. يرجى مراجعة لوحة تحكم Green API لمسح الـ QR أو التفعيل.`
        });
      }
    } catch (err: any) {
      setWaStatus({
        type: 'error',
        msg: '❌ فشل الاتصال! تأكد من صحة الـ Instance ID والـ API Token، وتأكد من اتصال جهازك بالإنترنت.'
      });
    } finally {
      setCheckingWa(false);
    }
  };
  const adminPhones = branding.adminWhatsappNumbers || (branding.adminWhatsappNumber ? [branding.adminWhatsappNumber] : []);

  const handleAddAdminPhone = () => {
    const cleanPhone = newAdminPhone.trim();
    if (!cleanPhone) return;
    if (adminPhones.includes(cleanPhone)) {
      alert('هذا الرقم مضاف بالفعل!');
      return;
    }
    const updated = [...adminPhones, cleanPhone];
    setBranding({
      ...branding,
      adminWhatsappNumbers: updated,
      adminWhatsappNumber: updated[0] || ''
    });
    setNewAdminPhone('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRemoveAdminPhone = (phoneToRemove: string) => {
    const updated = adminPhones.filter(p => p !== phoneToRemove);
    setBranding({
      ...branding,
      adminWhatsappNumbers: updated,
      adminWhatsappNumber: updated[0] || ''
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const defaultFlash: FlashLimitOffer = {
    isActive: false,
    type: 'free_shipping',
    value: 0,
    totalLimit: 5,
    currentCount: 0,
    messageAr: 'عرض خاص لأول 5 طلبات! شحن مجاني',
    messageEn: 'Special Offer for first 5 orders! Free Shipping'
  };
  const [flashOffer, setFlashOffer] = useState<FlashLimitOffer>(branding.flashLimitOffer || defaultFlash);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuth(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminLayout title="إعدادات الحساب والأمان">
      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-8 text-white text-center">
            <div className="w-20 h-20 bg-amber-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border-4 border-slate-800">
              {adminAuth.username[0].toUpperCase()}
            </div>
            <h3 className="text-xl font-bold">{adminAuth.username}</h3>
            <p className="text-slate-400 text-sm mt-1">المالك الأساسي للمتجر</p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
              <ShieldCheck size={18} />
              استرداد الحساب
            </h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              في حالة نسيان كلمة المرور، يمكنك استعادتها عن طريق البريد الإلكتروني أو رقم الهاتف المسجل أدناه. تأكد من صحة هذه البيانات دائماً.
            </p>
          </div>
        </div>

        {/* Right Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-amber-600 transition"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-12 outline-none focus:border-amber-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-gray-50">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">البريد الإلكتروني (للاسترداد)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-amber-600 transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">رقم الهاتف (للاسترداد)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-amber-600 transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex items-center justify-between">
            {saved && (
              <span className="text-green-600 text-sm font-bold flex items-center gap-2 animate-bounce">
                <Check size={18} />
                تم حفظ التغييرات بنجاح!
              </span>
            )}
            <button 
              type="submit"
              className="bg-amber-700 text-white px-10 py-4 rounded-xl font-bold hover:bg-amber-800 transition shadow-lg shadow-amber-100 mr-auto"
            >
              تحديث البيانات
            </button>
          </div>
        </form>

        {/* Policy Management Section */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">إدارة السياسات</h3>
                <p className="text-sm text-gray-400">اكتب سياسات المتجر لتظهر للعملاء في أسفل الموقع</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setBranding({ ...branding, shippingPolicy: formData.shippingPolicy, refundPolicy: formData.refundPolicy });
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
              }}
              className="bg-amber-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-800 transition shadow-lg"
            >
              حفظ السياسات
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" dir="rtl">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Truck size={18} className="text-amber-600" />
                سياسة الشحن والتوصيل
              </label>
              <textarea 
                value={formData.shippingPolicy || branding.shippingPolicy || ''}
                onChange={(e) => setFormData({...formData, shippingPolicy: e.target.value})}
                placeholder="اكتب تفاصيل الشحن، المدة المتوقعة، والأسعار..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 outline-none focus:border-amber-600 min-h-[200px] text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-600" />
                سياسة الاسترجاع والاستبدال
              </label>
              <textarea 
                value={formData.refundPolicy || branding.refundPolicy || ''}
                onChange={(e) => setFormData({...formData, refundPolicy: e.target.value})}
                placeholder="اكتب شروط الاسترجاع، المدة المسموحة، وحالة المنتج..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 outline-none focus:border-amber-600 min-h-[200px] text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Flash Limit Offer Section */}
        <div className="lg:col-span-3 bg-amber-50 rounded-2xl shadow-sm border border-amber-100 p-8 space-y-8" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-900">عروض العدد المحدود (Flash Offers)</h3>
                <p className="text-sm text-amber-700/80">تفعيل عرض حصري لأول X طلبات (تطبق تلقائياً في الفاتورة وتظهر رسالة للعملاء)</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const updated = { ...flashOffer, isActive: !flashOffer.isActive };
                  setFlashOffer(updated);
                  setBranding({ ...branding, flashLimitOffer: updated });
                  setFlashSaved(true);
                  setTimeout(() => setFlashSaved(false), 3000);
                }}
                className={`px-6 py-3 rounded-xl font-bold transition shadow-md ${flashOffer.isActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
              >
                {flashOffer.isActive ? 'إيقاف العرض' : 'تفعيل العرض'}
              </button>
              <button 
                onClick={() => {
                  setBranding({ ...branding, flashLimitOffer: flashOffer });
                  setFlashSaved(true);
                  setTimeout(() => setFlashSaved(false), 3000);
                }}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>

          {flashSaved && (
            <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
              <Check size={18} />
              تم حفظ العرض بنجاح!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-amber-800">رسالة العرض (تظهر في أعلى الموقع)</label>
              <input 
                type="text"
                value={flashOffer.messageAr}
                onChange={(e) => setFlashOffer({...flashOffer, messageAr: e.target.value})}
                placeholder="مثال: عرض خاص لأول 5 طلبات! شحن مجاني"
                className="w-full bg-white border border-amber-200 rounded-xl py-3 px-4 outline-none focus:border-amber-600 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-800">العدد المسموح (Limit)</label>
              <input 
                type="number"
                value={flashOffer.totalLimit}
                onChange={(e) => setFlashOffer({...flashOffer, totalLimit: parseInt(e.target.value) || 0})}
                className="w-full bg-white border border-amber-200 rounded-xl py-3 px-4 outline-none focus:border-amber-600 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-800">عدد الطلبات الحالية المستفيدة</label>
              <div className="flex gap-2">
                 <input 
                   type="number"
                   value={flashOffer.currentCount}
                   onChange={(e) => setFlashOffer({...flashOffer, currentCount: parseInt(e.target.value) || 0})}
                   className="w-full bg-gray-100 border border-amber-200 rounded-xl py-3 px-4 outline-none text-sm font-bold text-gray-500"
                 />
                 <button 
                   title="تصفير العداد"
                   onClick={() => setFlashOffer({...flashOffer, currentCount: 0})}
                   className="px-4 bg-amber-200 text-amber-800 rounded-xl font-bold hover:bg-amber-300"
                 >0</button>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-amber-800">نوع الخصم</label>
              <select 
                value={flashOffer.type}
                onChange={(e) => setFlashOffer({...flashOffer, type: e.target.value as any})}
                className="w-full bg-white border border-amber-200 rounded-xl py-3 px-4 outline-none focus:border-amber-600 text-sm"
              >
                <option value="free_shipping">شحن مجاني (تصفير مصاريف الشحن)</option>
                <option value="percentage">خصم نسبة مئوية (٪)</option>
                <option value="fixed">خصم مبلغ ثابت (ج.م)</option>
              </select>
            </div>
            {flashOffer.type !== 'free_shipping' && (
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-amber-800">قيمة الخصم</label>
                <input 
                  type="number"
                  value={flashOffer.value}
                  onChange={(e) => setFlashOffer({...flashOffer, value: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white border border-amber-200 rounded-xl py-3 px-4 outline-none focus:border-amber-600 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Site Statistics Toggle */}
        <div className="lg:col-span-3 bg-blue-50 rounded-2xl border border-blue-100 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" dir="rtl">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                 <Eye size={28} />
              </div>
              <div className="text-right">
                 <h3 className="text-lg font-black text-blue-900">إحصائيات المبيعات للزوار</h3>
                 <p className="text-xs text-blue-700/70">الرقم الحالي: ({branding.totalOrdersCount?.toLocaleString('en-US') || 0}). يمكنك تعديل الرقم يدوياً ليناسب عدد مبيعاتك الحقيقي، وسيزيد تلقائياً مع كل طلب يتم توصيله.</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-blue-800">قيمة العداد</label>
               <input 
                 type="number"
                 defaultValue={branding.totalOrdersCount || 0}
                 onBlur={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (val !== branding.totalOrdersCount) {
                      setBranding({ ...branding, totalOrdersCount: val });
                      setSaved(true);
                      setTimeout(() => setSaved(false), 3000);
                    }
                 }}
                 className="w-24 px-3 py-3 text-center font-black text-blue-900 border border-blue-200 rounded-xl outline-none focus:border-blue-500 shadow-sm"
               />
             </div>
             
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-transparent select-none">.</label>
               <button 
                 onClick={() => {
                   const newState = !branding.showTotalOrdersStat;
                   setBranding({ ...branding, showTotalOrdersStat: newState });
                   setSaved(true);
                   setTimeout(() => setSaved(false), 3000);
                 }}
                 className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg whitespace-nowrap ${branding.showTotalOrdersStat ? 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
               >
                  {branding.showTotalOrdersStat ? 'إخفاء العداد' : 'إظهار العداد'}
               </button>
             </div>
           </div>
        </div>

        {/* Maintenance Mode Section */}
        <div className="lg:col-span-3 bg-red-50 rounded-2xl border border-red-100 p-8 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                 <Lock size={28} />
              </div>
              <div className="text-right">
                 <h3 className="text-lg font-black text-red-900">وضع الصيانة (Maintenance Mode)</h3>
                 <p className="text-xs text-red-700/70">عند تفعيل هذا الوضع، سيتم إغلاق الموقع أمام الزوار وإظهار صفحة "انتظرونا قريباً".</p>
              </div>
           </div>
           <button 
             onClick={() => {
               const newState = !branding.maintenanceMode;
               setBranding({ ...branding, maintenanceMode: newState });
               setSaved(true);
               setTimeout(() => setSaved(false), 3000);
             }}
             className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${branding.maintenanceMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}
           >
              {branding.maintenanceMode ? 'إيقاف وضع الصيانة' : 'تفعيل وضع الصيانة'}
           </button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default Settings;
