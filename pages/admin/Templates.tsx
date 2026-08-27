import React, { useState } from 'react';
import { useApp } from '../../state';
import AdminLayout from '../../components/AdminLayout';
import { THEMES } from '../../themes';
import { Check, Layout, Info, CheckCircle2, X } from 'lucide-react';

const Templates: React.FC = () => {
  const { branding, setBranding } = useApp();
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  const handleSelectTemplate = (templateId: string) => {
    const selectedTheme = THEMES.find(t => t.id === templateId);
    if (!selectedTheme) return;

    // Direct update to avoid window.confirm issues in iframe
    setBranding({
      ...branding,
      templateId: templateId,
      primaryColor: selectedTheme.primaryColor,
      secondaryColor: selectedTheme.secondaryColor,
      fontFamily: selectedTheme.fontFamily,
      borderRadius: selectedTheme.borderRadius,
      headerStyle: selectedTheme.headerStyle,
      cardStyle: selectedTheme.cardStyle,
      heroLayout: selectedTheme.heroLayout,
      productGridLayout: selectedTheme.productGridLayout,
      aboutLayout: selectedTheme.aboutLayout,
      productDetailLayout: selectedTheme.productDetailLayout,
      // Update content if provided by theme
      heroTitle: selectedTheme.heroTitle || branding.heroTitle,
      heroSubtitle: selectedTheme.heroSubtitle || branding.heroSubtitle,
      aboutTitle: selectedTheme.aboutTitle || branding.aboutTitle,
      aboutDescription: selectedTheme.aboutDescription || branding.aboutDescription
    });

    setToast({ show: true, message: `تم تفعيل قالب "${selectedTheme.name}" بنجاح!` });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  return (
    <AdminLayout title="قوالب المتجر">
      {toast.show && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-white shadow-2xl border border-green-100 rounded-2xl p-4 flex items-center gap-4 min-w-[280px]">
            <div className="bg-green-500 p-2 rounded-full text-white">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false, message: '' })} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <div className="space-y-8" dir="rtl">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4">
          <Info className="text-amber-600 shrink-0 mt-1" size={24} />
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900">نصيحة للمالك</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              اختيار القالب المناسب يغير من تجربة العميل تماماً. كل قالب مصمم ليعكس شخصية معينة لبراندك. يمكنك تجربة القوالب والعودة للقالب الأصلي في أي وقت.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {THEMES.map((theme) => (
            <div 
              key={theme.id}
              className={`group relative bg-white rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 cursor-pointer hover:shadow-2xl ${
                branding.templateId === theme.id 
                  ? 'border-slate-900 ring-4 ring-slate-900/5' 
                  : 'border-gray-100 hover:border-slate-300'
              }`}
              onClick={() => handleSelectTemplate(theme.id)}
            >
              {/* Preview Header */}
              <div className="h-48 relative overflow-hidden bg-gray-50">
                {/* Mock UI Preview */}
                <div className="absolute inset-0 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-3 rounded-full" style={{ backgroundColor: theme.primaryColor }}></div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                  <div className={`h-20 rounded-2xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${
                    theme.heroLayout === 'magazine' ? 'bg-white border-2 border-gray-100' : ''
                  }`} style={{ 
                    backgroundColor: theme.heroLayout === 'magazine' ? 'white' : theme.primaryColor, 
                    color: theme.heroLayout === 'magazine' ? 'black' : theme.secondaryColor 
                  }}>
                    {theme.heroLayout === 'magazine' ? (
                      <div className="flex w-full h-full">
                        <div className="w-1/2 bg-gray-100 h-full"></div>
                        <div className="w-1/2 flex items-center justify-center">HERO</div>
                      </div>
                    ) : theme.heroLayout === 'split' ? (
                      <div className="flex w-full h-full">
                        <div className="w-1/2 flex items-center justify-center">HERO</div>
                        <div className="w-1/2 bg-gray-100 h-full"></div>
                      </div>
                    ) : 'HERO SECTION'}
                  </div>
                  <div className={`grid gap-2 ${
                    theme.productGridLayout === 'compact' ? 'grid-cols-4' : 'grid-cols-3'
                  }`}>
                    <div className="h-10 rounded-xl bg-gray-100"></div>
                    <div className="h-10 rounded-xl bg-gray-100"></div>
                    <div className="h-10 rounded-xl bg-gray-100"></div>
                    {theme.productGridLayout === 'compact' && <div className="h-10 rounded-xl bg-gray-100"></div>}
                  </div>
                </div>
                
                {/* Overlay */}
                <div className={`absolute inset-0 bg-slate-900/40 flex items-center justify-center transition-opacity duration-300 ${branding.templateId === theme.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {branding.templateId === theme.id ? (
                    <div className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-xl">
                      <Check size={18} />
                      <span>القالب الحالي</span>
                    </div>
                  ) : (
                    <div className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      تفعيل القالب
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Info */}
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg text-slate-800">{theme.name}</h4>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full border border-gray-100" style={{ backgroundColor: theme.primaryColor }}></div>
                    <div className="w-4 h-4 rounded-full border border-gray-100" style={{ backgroundColor: theme.secondaryColor }}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{theme.description}</p>
                
                <div className="pt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 uppercase">
                    {theme.fontFamily}
                  </span>
                  <span className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 uppercase">
                    {theme.borderRadius} corners
                  </span>
                  <span className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 uppercase">
                    {theme.cardStyle} cards
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Templates;
