
import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Facebook, Instagram, MessageCircle, Save, CheckCircle2, Music2 } from 'lucide-react';

const Social: React.FC = () => {
  const { branding, setBranding } = useApp();
  const [showToast, setShowToast] = useState(false);

  // تحديث محلي قبل الحفظ النهائي
  const [localLinks, setLocalLinks] = useState(branding.socialLinks);

  const handleChange = (platform: keyof typeof branding.socialLinks, value: string) => {
    setLocalLinks({
      ...localLinks,
      [platform]: value
    });
  };

  const handleSave = () => {
    setBranding({
      ...branding,
      socialLinks: localLinks
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const platforms = [
    { key: 'facebook', label: 'فيسبوك', icon: <Facebook className="text-blue-600" />, placeholder: 'رابط الصفحة أو اسم المستخدم...' },
    { key: 'instagram', label: 'إنستجرام', icon: <Instagram className="text-pink-600" />, placeholder: 'اسم المستخدم (بدون @)...' },
    { key: 'whatsapp', label: 'واتساب', icon: <MessageCircle className="text-green-600" />, placeholder: 'رقم الهاتف (01xxxxxxxxx)...' },
    { key: 'tiktok', label: 'تيك توك', icon: <Music2 className="text-black" />, placeholder: 'اسم المستخدم...' },
  ] as const;

  return (
    <AdminLayout title="روابط التواصل الاجتماعي">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold">
            <CheckCircle2 size={18} />
            تم حفظ جميع الروابط وتفعيلها بنجاح!
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-3xl" dir="rtl">
        <p className="text-gray-500 mb-8 font-medium">أضف روابط حسابات البراند لتظهر للعملاء في الفوتر. يمكنك وضع الاسم فقط أو الرابط كاملاً.</p>
        
        <div className="space-y-8">
          {platforms.map(p => (
            <div key={p.key} className="flex flex-col md:flex-row md:items-center gap-4 group">
              <div className="flex items-center gap-4 md:w-40">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                  {p.icon}
                </div>
                <span className="font-bold text-gray-700">{p.label}</span>
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={localLinks[p.key] || ''}
                  onChange={(e) => handleChange(p.key, e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-6 outline-none focus:border-amber-600 focus:bg-white transition text-right"
                  placeholder={p.placeholder}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t">
          <button 
            onClick={handleSave}
            className="bg-slate-900 text-white px-12 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-700 transition shadow-lg"
          >
            <Save size={20} />
            حفظ الروابط وتفعيلها
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Social;
