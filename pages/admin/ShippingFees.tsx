import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Truck, MapPin, Check } from 'lucide-react';
import { egyptLocations } from '../../egyptLocations';

const ShippingFees: React.FC = () => {
  const { branding, setBranding } = useApp();
  const [shippingFees, setShippingFees] = useState<Record<string, any>>(branding.shippingFees || {});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setShippingFees(branding.shippingFees || {});
  }, [branding.shippingFees]);

  const handleSave = () => {
    setBranding({ ...branding, shippingFees });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminLayout title="مصاريف الشحن">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">إدارة مصاريف الشحن</h3>
              <p className="text-sm text-gray-400">حدد سعر التوصيل لكل محافظة بشكل يدوي</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg"
          >
            حفظ أسعار الشحن
          </button>
        </div>

        {saved && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check size={18} />
            تم حفظ أسعار الشحن بنجاح!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
          {egyptLocations.map(loc => {
            const value = shippingFees[loc.governorate];
            const fee = typeof value === 'object' ? value?.fee ?? 0 : (value ?? 0);
            const days = typeof value === 'object' ? value?.days ?? '' : '';

            return (
              <div key={loc.governorate} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3 group hover:border-amber-200 transition">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                  <MapPin size={12} className="text-gray-300" />
                  {loc.governorate}
                </label>

                <div className="relative">
                  <input
                    type="number"
                    placeholder="سعر التوصيل (ج.م)"
                    value={fee || ''}
                    onChange={(e) => setShippingFees({
                      ...shippingFees,
                      [loc.governorate]: {
                        ...(typeof shippingFees[loc.governorate] === 'object' ? shippingFees[loc.governorate] : { fee: 0, days: '' }),
                        fee: Number(e.target.value) || 0,
                        days,
                      }
                    })}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4 pr-12 outline-none focus:border-amber-600 font-black text-slate-900 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">السعر</span>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">ج.م</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: من 1 إلى 3"
                    value={days}
                    onChange={(e) => setShippingFees({
                      ...shippingFees,
                      [loc.governorate]: {
                        ...(typeof shippingFees[loc.governorate] === 'object' ? shippingFees[loc.governorate] : { fee: 0, days: '' }),
                        fee,
                        days: e.target.value,
                      }
                    })}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4 pr-12 outline-none focus:border-amber-600 font-bold text-slate-700 text-xs"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">المدة</span>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">أيام</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShippingFees;
