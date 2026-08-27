import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Plus, Trash2, Check, MessageCircle, Phone, User } from 'lucide-react';

const WhatsappNumbers: React.FC = () => {
  const { branding, setBranding, staff } = useApp();
  const [newPhone, setNewPhone] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [saved, setSaved] = useState(false);

  const adminPhones = branding.adminWhatsappNumbers || (branding.adminWhatsappNumber ? [branding.adminWhatsappNumber] : []);
  const staffPhoneMap = branding.whatsappNumbersWithStaff || {};

  const handleAddPhone = () => {
    const cleanPhone = newPhone.trim();
    if (!cleanPhone) {
      alert('من فضلك أدخل رقم هاتف');
      return;
    }
    if (adminPhones.includes(cleanPhone)) {
      alert('هذا الرقم مضاف بالفعل!');
      return;
    }
    
    // التحقق من صيغة الرقم (رقم مصري)
    if (!/^(20)?1[0-9]{9}$|^01[0-9]{9}$/.test(cleanPhone.replace(/[^\d]/g, ''))) {
      alert('من فضلك أدخل رقم هاتف صحيح (مثال: 201012345678 أو 01012345678)');
      return;
    }

    const updated = [...adminPhones, cleanPhone];
    
    // حفظ الموظف المرتبط بالرقم (باستخدام staffId كمفتاح)
    const newMap = { ...staffPhoneMap };
    if (selectedStaffId) {
      const selectedStaff = staff.find(s => s.id === selectedStaffId);
      if (selectedStaff) {
        newMap[selectedStaffId] = cleanPhone;
      }
    }

    // حفظ التحديثات في الحالة
    setBranding({
      ...branding,
      adminWhatsappNumbers: updated,
      adminWhatsappNumber: updated[0] || '',
      whatsappNumbersWithStaff: newMap,
    });
    setNewPhone('');
    setSelectedStaffId('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRemovePhone = (phoneToRemove: string) => {
    const updated = adminPhones.filter(p => p !== phoneToRemove);
    // إزالة أي مرتبط لموظف كان مرتبطاً بهذا الرقم
    const newMap = { ...staffPhoneMap };
    Object.keys(newMap).forEach(staffId => {
      if (newMap[staffId] === phoneToRemove) {
        delete newMap[staffId];
      }
    });
    
    setBranding({
      ...branding,
      adminWhatsappNumbers: updated,
      adminWhatsappNumber: updated[0] || '',
      whatsappNumbersWithStaff: newMap
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPhone();
    }
  };

  return (
    <AdminLayout title="إدارة أرقام الواتساب">
      <div className="max-w-4xl mx-auto" dir="rtl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MessageCircle size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black">إدارة أرقام الواتساب</h1>
                <p className="text-green-100 text-sm mt-2">أضف وأدر أرقام الواتساب التي ستتلقى رسائل الطلبات والإشعارات التلقائية</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Phone Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">رقم الواتساب</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="مثال: 201012345678 أو 01012345678"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-green-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">الموظف المسؤول (اختياري)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-green-600 transition appearance-none"
                  >
                    <option value="">-- اختر موظف (اختياري) --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.username} ({s.phone || 'بدون رقم'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleAddPhone}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2"
              >
                <Plus size={20} />
                إضافة الرقم
              </button>
              <p className="text-xs text-gray-500 flex items-center">
                يمكنك إدخال الرقم بصيغة (20XXXXXXXXXX) أو (0XXXXXXXXXX)
              </p>
            </div>

            {saved && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Check size={18} />
                تم التحديث بنجاح!
              </div>
            )}
          </div>
        </div>

        {/* Phone Numbers List */}
        <div className="space-y-4">
          {adminPhones.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد أرقام مضافة</h3>
              <p className="text-gray-500 text-sm">أضف أول رقم واتساب لتلقي الإشعارات التلقائية</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {adminPhones.length}
                </span>
                الأرقام المضافة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminPhones.map((phone, idx) => {
                  // البحث عن الموظف المرتبط بهذا الرقم
                  const linkedStaffId = Object.keys(staffPhoneMap).find(sId => staffPhoneMap[sId] === phone);
                  const linkedStaff = linkedStaffId ? staff.find(s => s.id === linkedStaffId) : null;

                  return (
                  <div 
                    key={idx}
                    className="bg-white border-2 border-green-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="text-green-600" size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-bold">رقم الواتساب</p>
                            <p className="text-lg font-black text-gray-900">{phone}</p>
                          </div>
                        </div>
                        
                        {linkedStaff && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-500 font-bold">مرتبط بـ:</p>
                            <p className="text-sm font-bold text-blue-600">👤 {linkedStaff.username}</p>
                            {linkedStaff.phone && (
                              <p className="text-xs text-gray-600">📞 {linkedStaff.phone}</p>
                            )}
                          </div>
                        )}

                        {idx === 0 && (
                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                            ⭐ الرقم الأساسي
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm(`هل تريد حذف الرقم ${phone}؟`)) {
                            handleRemovePhone(phone);
                          }
                        }}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition opacity-0 group-hover:opacity-100"
                        title="حذف الرقم"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              ℹ
            </div>
            <div className="text-sm text-blue-900 space-y-2">
              <p className="font-bold">معلومات مهمة:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs">
                <li>الرقم الأول المضاف سيكون هو الرقم الأساسي لاستقبال الرسائل</li>
                <li>جميع الأرقام ستستقبل الإشعارات التلقائية للطلبات والتحديثات</li>
                <li>تأكد من أن أرقام الواتساب مفعلة وجاهزة لاستقبال الرسائل</li>
                <li>يمكنك إضافة أكثر من رقم لتلقي الرسائل على عدة حسابات</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default WhatsappNumbers;
