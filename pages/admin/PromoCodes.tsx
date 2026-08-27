
import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Plus, Trash2, Edit2, Check, X, Calendar, Ticket } from 'lucide-react';
import { PromoCode } from '../../types';

const PromoCodes: React.FC = () => {
  const { promoCodes, setPromoCodes } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromoCode>>({
    code: '',
    discountType: 'percentage',
    discount: 0,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });

  const handleSave = () => {
    if (!formData.code || formData.discount === undefined) return;

    if (editingId) {
      setPromoCodes(prev => (prev || []).map(p => p.id === editingId ? { ...p, ...formData } as PromoCode : p));
      setEditingId(null);
    } else {
      const newPromo: PromoCode = {
        id: Math.random().toString(36).substr(2, 9),
        code: formData.code!,
        discountType: formData.discountType as 'percentage' | 'fixed',
        discount: Number(formData.discount),
        expiryDate: formData.expiryDate!,
        isActive: true
      };
      setPromoCodes(prev => [...(prev || []), newPromo]);
      setIsAdding(false);
    }
    setFormData({
      code: '',
      discountType: 'percentage',
      discount: 0,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    });
  };

  const handleDelete = (id: string) => {
    setPromoToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (promoToDelete) {
      setPromoCodes(prev => (prev || []).filter(p => p.id !== promoToDelete));
      setShowDeleteConfirm(false);
      setPromoToDelete(null);
    }
  };

  const toggleStatus = (id: string) => {
    setPromoCodes(prev => (prev || []).map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  return (
    <AdminLayout title="إدارة أكواد الخصم">
      <div className="mb-8 flex justify-between items-center">
        <p className="text-gray-500 font-medium">قم بإنشاء وإدارة أكواد الخصم لعملائك</p>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg"
        >
          <Plus size={20} />
          <span>إضافة كود جديد</span>
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Ticket className="text-amber-600" />
            {editingId ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">كود الخصم</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-black transition"
                placeholder="PROMO2024"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">نوع الخصم</label>
              <select 
                value={formData.discountType} 
                onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-black transition"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ج.م)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">قيمة الخصم</label>
              <input 
                type="text" 
                value={formData.discount === 0 ? '' : formData.discount} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setFormData({...formData, discount: val === '' ? 0 : Number(val)});
                  }
                }}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-black transition"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">تاريخ الانتهاء</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="date" 
                  value={formData.expiryDate} 
                  onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-black transition"
                />
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button 
              onClick={handleSave}
              className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition shadow-md"
            >
              حفظ الكود
            </button>
            <button 
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="bg-gray-100 text-gray-500 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]" dir="rtl">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">الكود</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">الخصم</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">تاريخ الانتهاء</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">الحالة</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(promoCodes || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">لا يوجد أكواد خصم حالياً</td>
                </tr>
              ) : (
                (promoCodes || []).map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-8 py-6">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold text-sm">{promo.code}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-slate-800">
                        {promo.discountType === 'percentage' ? `${promo.discount}%` : `${promo.discount} ج.م`}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                        <Calendar size={14} />
                        {new Date(promo.expiryDate).toLocaleDateString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => toggleStatus(promo.id)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition ${
                          promo.isActive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {promo.isActive ? 'نشط' : 'متوقف'}
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingId(promo.id); setFormData(promo); }}
                          className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(promo.id)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-red-600 p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">تأكيد الحذف</h3>
                <p className="text-red-100 text-xs text-right">لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-600 text-sm font-bold text-right">هل أنت متأكد من حذف كود الخصم هذا نهائياً؟</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPromoToDelete(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PromoCodes;
