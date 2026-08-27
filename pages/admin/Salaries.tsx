
import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  Plus, 
  Search, 
  Banknote, 
  Wallet, 
  Clock, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  User,
  ArrowUpRight,
  ArrowDownRight,
  X,
  RotateCcw,
  ShieldAlert,
  Lock,
  AlertCircle
} from 'lucide-react';
import { SalaryRecord } from '../../types';

const Salaries: React.FC = () => {
  const { salaryRecords, setSalaryRecords, adminAuth } = useApp();
  const [activeTab, setActiveTab] = useState<'salaries' | 'loans' | 'trash'>('salaries');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showSoftDeleteConfirm, setShowSoftDeleteConfirm] = useState(false);
  const [showClearTrashConfirm, setShowClearTrashConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [recordToSoftDelete, setRecordToSoftDelete] = useState<string | null>(null);
  const [verifyUsername, setVerifyUsername] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('تمت إضافة السجل بنجاح!');

  // Auto-cleanup expired trash (older than 3 days)
  React.useEffect(() => {
    const now = new Date();
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const expiredIds = salaryRecords
      .filter(r => r.deletedAt && (now.getTime() - new Date(r.deletedAt).getTime() > threeDaysInMs))
      .map(r => r.id);
    
    if (expiredIds.length > 0) {
      setSalaryRecords(prev => prev.filter(r => !expiredIds.includes(r.id)));
    }
  }, [salaryRecords, setSalaryRecords]);

  // Form State
  const [employeeName, setEmployeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(new Date().getDate().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const currentHour = new Date().getHours();
  const [hour, setHour] = useState((currentHour % 12 || 12).toString());
  const [ampm, setAmpm] = useState(currentHour >= 12 ? 'PM' : 'AM');
  const [minute, setMinute] = useState(new Date().getMinutes().toString());
  const [second, setSecond] = useState(new Date().getSeconds().toString());

  const filteredRecords = salaryRecords.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'trash') {
      return r.deletedAt && matchesSearch;
    }
    return !r.deletedAt && r.type === (activeTab === 'salaries' ? 'salary' : 'loan') && matchesSearch;
  });

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeName || !amount) return;

    // Construct date from fields
    let finalHour = parseInt(hour);
    if (ampm === 'PM' && finalHour < 12) finalHour += 12;
    if (ampm === 'AM' && finalHour === 12) finalHour = 0;

    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      finalHour,
      parseInt(minute),
      parseInt(second)
    ).toISOString();

    const newRecord: SalaryRecord = {
      id: Date.now().toString(),
      employeeName,
      amount: parseFloat(amount),
      date,
      type: activeTab === 'salaries' ? 'salary' : 'loan',
      createdAt: new Date().toISOString()
    };

    setSalaryRecords([newRecord, ...salaryRecords]);
    
    // Reset
    setEmployeeName('');
    setAmount('');
    setShowAddModal(false);
    setToastMessage('تمت إضافة السجل بنجاح!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const deleteRecord = (id: string) => {
    const record = salaryRecords.find(r => r.id === id);
    if (!record) return;

    if (!record.deletedAt) {
      setRecordToSoftDelete(id);
      setShowSoftDeleteConfirm(true);
    } else {
      setRecordToDelete(id);
      setShowVerifyModal(true);
      setVerifyError('');
    }
  };

  const handleSoftDelete = () => {
    if (!recordToSoftDelete) return;
    setSalaryRecords(salaryRecords.map(r => 
      r.id === recordToSoftDelete ? { ...r, deletedAt: new Date().toISOString() } : r
    ));
    setToastMessage('تم نقل السجل إلى سلة المحذوفات');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setShowSoftDeleteConfirm(false);
    setRecordToSoftDelete(null);
  };

  const handlePermanentDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyUsername === adminAuth.username && verifyPassword === adminAuth.password) {
      setSalaryRecords(salaryRecords.filter(r => r.id !== recordToDelete));
      setShowVerifyModal(false);
      setRecordToDelete(null);
      setVerifyUsername('');
      setVerifyPassword('');
      setToastMessage('تم حذف السجل نهائياً');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setVerifyError('بيانات الدخول غير صحيحة');
    }
  };

  const restoreRecord = (id: string) => {
    setSalaryRecords(salaryRecords.map(r => 
      r.id === id ? { ...r, deletedAt: undefined } : r
    ));
    setToastMessage('تم استعادة السجل بنجاح');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getRemainingDays = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deleteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 3 - diffDays);
  };

  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  return (
    <AdminLayout title="إدارة رواتب العاملين">
      {showToast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-white shadow-2xl border border-green-100 rounded-2xl p-4 flex items-center gap-4 min-w-[280px]">
            <div className="bg-green-500 p-2 rounded-full text-white">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8" dir="rtl">
        {/* Stats & Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
              <button
                onClick={() => setActiveTab('salaries')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'salaries' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <Banknote size={18} />
                قسم الرواتب
              </button>
              <button
                onClick={() => setActiveTab('loans')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'loans' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <Wallet size={18} />
                قسم الاستلاف
              </button>
              <button
                onClick={() => setActiveTab('trash')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'trash' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <Trash2 size={18} />
                سلة المحذوفات
              </button>
            </div>

            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="ابحث عن موظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-white border border-gray-100 rounded-2xl pr-12 pl-4 text-sm outline-none focus:border-slate-900 transition shadow-sm"
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي {activeTab === 'salaries' ? 'الرواتب' : 'الاستلافات'}</p>
              <p className="text-2xl font-bold">{totalAmount.toLocaleString()} ج.م</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl">
              {activeTab === 'salaries' ? <ArrowUpRight className="text-green-400" /> : <ArrowDownRight className="text-amber-400" />}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {activeTab === 'salaries' ? 'سجل الرواتب المدفوعة' : 
             activeTab === 'loans' ? 'سجل طلبات الاستلاف' : 'سلة المحذوفات (تحذف نهائياً بعد 3 أيام)'}
          </h3>
          <div className="flex gap-3">
            {activeTab === 'trash' && filteredRecords.length > 0 && (
              <button
                onClick={() => setShowClearTrashConfirm(true)}
                className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-600 hover:text-white transition shadow-sm"
              >
                <Trash2 size={20} />
                إفراغ السلة
              </button>
            )}
            {activeTab !== 'trash' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-700 transition shadow-lg"
              >
                <Plus size={20} />
                إضافة {activeTab === 'salaries' ? 'راتب' : 'استلاف'}
              </button>
            )}
          </div>
        </div>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center space-y-4">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Banknote size={40} />
            </div>
            <p className="text-gray-400 font-bold">لا توجد سجلات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecords.map(record => (
              <div key={record.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6 group relative">
                <div className="absolute top-4 left-4 flex gap-2 transition-opacity duration-200">
                  {record.deletedAt ? (
                    <button 
                      onClick={() => restoreRecord(record.id)}
                      className="bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-sm text-green-600 hover:bg-green-500 hover:text-white transition-all border border-green-100"
                      title="استعادة"
                    >
                      <RotateCcw size={16} />
                    </button>
                  ) : null}
                  <button 
                    onClick={() => deleteRecord(record.id)}
                    className={`bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-sm transition-all border ${
                      record.deletedAt 
                        ? 'text-red-600 border-red-100 hover:bg-red-600 hover:text-white' 
                        : 'text-gray-400 border-gray-100 hover:text-red-500 hover:border-red-100 hover:bg-red-50'
                    }`}
                    title={record.deletedAt ? "حذف نهائي" : "حذف"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 border border-gray-100">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{record.employeeName}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                      <Calendar size={12} />
                      <span>{new Date(record.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">المبلغ</p>
                    <p className="text-xl font-bold text-slate-900">{record.amount.toLocaleString()} ج.م</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">التوقيت</p>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                      <Clock size={12} />
                      <span>{new Date(record.date).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full w-fit ${
                      record.type === 'salary' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {record.type === 'salary' ? 'راتب ميلادي' : 'استلاف ميلادي'}
                    </span>
                    {record.deletedAt && (
                      <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <Clock size={10} />
                        متبقي {getRemainingDays(record.deletedAt)} أيام للحذف التلقائي
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">ID: {record.id.slice(-6)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">إضافة {activeTab === 'salaries' ? 'راتب جديد' : 'استلاف جديد'}</h3>
                <p className="text-slate-400 text-sm">أدخل تفاصيل الموظف والمبلغ والتوقيت بدقة.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">اسم الموظف</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pr-12 pl-4 text-sm outline-none focus:border-slate-900 transition"
                      placeholder="اسم الموظف بالكامل..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">المبلغ</label>
                  <div className="relative">
                    <Banknote className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pr-12 pl-4 text-sm outline-none focus:border-slate-900 transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">التوقيت (التاريخ الميلادي)</label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-center font-bold text-gray-400">اليوم</p>
                    <input type="number" value={day} onChange={(e) => setDay(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-center text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-center font-bold text-gray-400">الشهر</p>
                    <input type="number" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-center text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-center font-bold text-gray-400">السنة</p>
                    <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-center text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-center font-bold text-gray-400">ساعة</p>
                    <input type="number" min="1" max="12" value={hour} onChange={(e) => setHour(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-center text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-center font-bold text-gray-400">AM/PM</p>
                    <select value={ampm} onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-center text-[10px] font-bold h-[38px] appearance-none cursor-pointer">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-center font-bold text-gray-400">دقيقة</p>
                    <input type="number" value={minute} onChange={(e) => setMinute(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-center text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-center font-bold text-gray-400">ثانية</p>
                    <input type="number" value={second} onChange={(e) => setSecond(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-center text-sm font-bold" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-amber-700 transition"
                >
                  حفظ السجل
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Soft Delete Confirmation Modal */}
      {showSoftDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-amber-500 p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">تأكيد الحذف المؤقت</h3>
                <p className="text-amber-100 text-xs">سيتم نقل السجل إلى سلة المحذوفات لمدة 3 أيام.</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-600 text-sm font-bold">هل أنت متأكد من نقل هذا السجل إلى سلة المحذوفات؟ يمكنك استعادته لاحقاً من هناك.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleSoftDelete}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600 transition"
                >
                  نعم، انقل للسلة
                </button>
                <button
                  onClick={() => {
                    setShowSoftDeleteConfirm(false);
                    setRecordToSoftDelete(null);
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

      {/* Clear Trash Confirmation Modal */}
      {showClearTrashConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-red-600 p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">تأكيد إفراغ السلة</h3>
                <p className="text-red-100 text-xs">سيتم حذف جميع السجلات في السلة نهائياً.</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-600 text-sm font-bold">هل أنت متأكد من حذف جميع السجلات في سلة المحذوفات نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSalaryRecords(salaryRecords.filter(r => !r.deletedAt));
                    setToastMessage('تم إفراغ سلة المحذوفات');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                    setShowClearTrashConfirm(false);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition"
                >
                  نعم، احذف الكل
                </button>
                <button
                  onClick={() => setShowClearTrashConfirm(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Delete Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-red-600 p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">تأكيد الحذف النهائي</h3>
                <p className="text-red-100 text-xs">يتطلب هذا الإجراء صلاحيات المدير العام.</p>
              </div>
            </div>

            <form onSubmit={handlePermanentDelete} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">اسم المستخدم (المدير)</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={verifyUsername}
                      onChange={(e) => setVerifyUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pr-12 pl-4 text-sm outline-none focus:border-red-600 transition"
                      placeholder="أدخل اسم المستخدم..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      required
                      value={verifyPassword}
                      onChange={(e) => setVerifyPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pr-12 pl-4 text-sm outline-none focus:border-red-600 transition"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {verifyError && (
                  <p className="text-xs font-bold text-red-500 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {verifyError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition"
                >
                  حذف نهائي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setRecordToDelete(null);
                    setVerifyUsername('');
                    setVerifyPassword('');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Salaries;
