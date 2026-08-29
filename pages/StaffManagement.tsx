import React, { useState, useEffect } from 'react';
import { useApp } from '../state';
import AdminLayout from '../components/AdminLayout';
import { UserPlus, Trash2, Shield, Circle, User, Key, Mail, Phone, Save, X, AlarmClock } from 'lucide-react';
import { StaffMember, Permission } from '../types';

const StaffManagement: React.FC = () => {
  const { addStaff, updateStaff, deleteStaff, staff } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  // Timeout settings modal
  const [timeoutModalStaff, setTimeoutModalStaff] = useState<StaffMember | null>(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(5);

  // Attendance full log modal
  const [attendanceModalStaff, setAttendanceModalStaff] = useState<StaffMember | null>(null);

  // Real-time ticker to update stopwatch counters on the screen every second
  const [timeTicker, setTimeTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    permissions: [] as Permission[],
    shiftHours: 8,
    shiftStart: '09:00',
    shiftEnd: '17:00'
  });

  const [employeeData, setEmployeeData] = useState({
    name: '',
    phone: ''
  });

  const availablePermissions: { id: Permission; name: string }[] = [
    { id: 'dashboard', name: 'الإحصائيات' },
    { id: 'customer-stats', name: 'إحصائيات العملاء' },
    { id: 'orders', name: 'إدارة الطلبات' },
    { id: 'invoices', name: 'الفواتير' },
    { id: 'products', name: 'إدارة المنتجات' },
    { id: 'promo-codes', name: 'أكواد الخصم' },
    { id: 'appearance', name: 'تخصيص الواجهة' },
    { id: 'shipping-fees', name: 'مصاريف الشحن' },
    { id: 'manufacturing', name: 'إدارة التصنيع' },
    { id: 'manufacturing-reception', name: 'تلقى التصنيع' },
    { id: 'salaries', name: 'رواتب العاملين' },
    { id: 'settings', name: 'الإعدادات' },
    { id: 'team', name: 'إدارة الفريق' },
  ];

  const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const convertTo24h = (hour12: number, minute: number, period: 'ص' | 'م'): string => {
    let h = hour12;
    if (period === 'م' && h < 12) h += 12;
    if (period === 'ص' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const convertFrom24h = (time24?: string): { hour12: number; minute: number; period: 'ص' | 'م' } => {
    if (!time24) return { hour12: 9, minute: 0, period: 'ص' };
    const [hStr, mStr] = time24.split(':');
    let h = Number(hStr);
    const m = Number(mStr);
    const period = h >= 12 ? 'م' : 'ص';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour12, minute: m, period };
  };

  const calculateShiftHours = (start24: string, end24: string): number => {
    const [startH, startM] = start24.split(':').map(Number);
    const [endH, endM] = end24.split(':').map(Number);
    
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes <= 0) {
      // Crosses midnight
      diffMinutes += 24 * 60;
    }
    return Number((diffMinutes / 60).toFixed(2));
  };

  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return '';
    const { hour12, minute, period } = convertFrom24h(timeStr);
    return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: StaffMember = {
      id: Date.now().toString(),
      username: formData.username,
      password: formData.password,
      email: formData.email,
      phone: formData.phone,
      permissions: formData.permissions,
      shiftHours: formData.shiftHours,
      shiftStart: formData.shiftStart,
      shiftEnd: formData.shiftEnd,
      isOnline: false
    };
    addStaff(newMember);
    resetForm();
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    const updatedMember: StaffMember = { ...editingStaff, ...formData };
    updateStaff(updatedMember);
    resetForm();
  };

  const handleDeleteStaff = (id: string) => {
    setStaffToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteStaff(staffToDelete);
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      phone: '',
      permissions: [],
      shiftHours: 8,
      shiftStart: '09:00',
      shiftEnd: '17:00'
    });
    setIsAdding(false);
    setEditingStaff(null);
  };

  const togglePermission = (perm: Permission) => {
    setFormData(prev => {
      const currentPermissions = Array.isArray(prev.permissions) ? prev.permissions : [];
      return {
        ...prev,
        permissions: currentPermissions.includes(perm)
          ? currentPermissions.filter(p => p !== perm)
          : [...currentPermissions, perm]
      };
    });
  };

  const isMemberOnline = (member: StaffMember): boolean => {
    if (!member.isOnline || !member.lastActive) return false;
    const lastActiveMs = new Date(member.lastActive).getTime();
    return (Date.now() - lastActiveMs) < 2000; // اللحظي - بدون تأخير
  };

  const startDetails = convertFrom24h(formData.shiftStart);
  const endDetails = convertFrom24h(formData.shiftEnd);

  const handleAddEmployee = () => {
    if (!employeeData.name || !employeeData.phone) {
      alert('Please fill in both name and phone number.');
      return;
    }
    addStaff({ ...employeeData });
    setEmployeeData({ name: '', phone: '' });
  };

  return (
    <AdminLayout title=" إدارة الفريق">
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">أعضاء الفريق</h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-black transition"
          >
            <UserPlus size={20} />
            <span>إضافة موظف جديد</span>
          </button>
        </div>

        {/* Add/Edit Modal */}
        {(isAdding || editingStaff) && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white w-[92vw] max-w-xl max-h-[88vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col">
              <div className="bg-slate-900 px-4 py-3 sm:px-5 sm:py-4 text-white flex justify-between items-center shrink-0">
                <h3 className="text-lg sm:text-xl font-bold">
                  {isAdding ? 'إضافة موظف جديد' : 'تعديل بيانات الموظف'}
                </h3>
                <button onClick={resetForm} className="p-2 rounded-full hover:bg-white/10 hover:text-amber-400 transition flex items-center justify-center" aria-label="إغلاق">
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <form onSubmit={isAdding ? handleAddStaff : handleUpdateStaff} className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">اسم المستخدم</label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 outline-none focus:border-slate-900 transition"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">كلمة المرور</label>
                    <div className="relative">
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="text"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 outline-none focus:border-slate-900 transition"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 outline-none focus:border-slate-900 transition"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">رقم الهاتف</label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 outline-none focus:border-slate-900 transition"
                      />
                    </div>
                  </div>

                  {/* وقت بدء ونهاية الشيفت */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    {/* وقت بدء الشيفت */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <AlarmClock size={16} className="text-slate-500" />
                        <span>بداية الشيفت</span>
                      </label>
                      <div className="flex gap-2">
                        {/* الساعة */}
                        <div className="flex-1">
                          <select
                            value={startDetails.hour12}
                            onChange={e => {
                              const new24 = convertTo24h(Number(e.target.value), startDetails.minute, startDetails.period);
                              setFormData(prev => ({
                                ...prev,
                                shiftStart: new24,
                                shiftHours: calculateShiftHours(new24, prev.shiftEnd)
                              }));
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-slate-900 transition text-sm font-bold cursor-pointer"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-gray-400 font-bold block text-center mt-1">ساعة</span>
                        </div>
                        {/* الدقيقة */}
                        <div className="flex-1">
                          <select
                            value={startDetails.minute}
                            onChange={e => {
                              const new24 = convertTo24h(startDetails.hour12, Number(e.target.value), startDetails.period);
                              setFormData(prev => ({
                                ...prev,
                                shiftStart: new24,
                                shiftHours: calculateShiftHours(new24, prev.shiftEnd)
                              }));
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-slate-900 transition text-sm font-bold cursor-pointer"
                          >
                            {Array.from({ length: 60 }, (_, i) => i).map(m => (
                              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-gray-400 font-bold block text-center mt-1">دقيقة</span>
                        </div>
                        {/* الفترة ص/م */}
                        <div className="w-24">
                          <select
                            value={startDetails.period}
                            onChange={e => {
                              const new24 = convertTo24h(startDetails.hour12, startDetails.minute, e.target.value as 'ص' | 'م');
                              setFormData(prev => ({
                                ...prev,
                                shiftStart: new24,
                                shiftHours: calculateShiftHours(new24, prev.shiftEnd)
                              }));
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-slate-900 transition text-sm font-bold cursor-pointer"
                          >
                            <option value="ص">ص (AM)</option>
                            <option value="م">م (PM)</option>
                          </select>
                          <span className="text-[10px] text-gray-400 font-bold block text-center mt-1">الفترة</span>
                        </div>
                      </div>
                    </div>

                    {/* وقت نهاية الشيفت */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <AlarmClock size={16} className="text-slate-500" />
                        <span>نهاية الشيفت</span>
                      </label>
                      <div className="flex gap-2">
                        {/* الساعة */}
                        <div className="flex-1">
                          <select
                            value={endDetails.hour12}
                            onChange={e => {
                              const new24 = convertTo24h(Number(e.target.value), endDetails.minute, endDetails.period);
                              setFormData(prev => ({
                                ...prev,
                                shiftEnd: new24,
                                shiftHours: calculateShiftHours(prev.shiftStart, new24)
                              }));
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-slate-900 transition text-sm font-bold cursor-pointer"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-gray-400 font-bold block text-center mt-1">ساعة</span>
                        </div>
                        {/* الدقيقة */}
                        <div className="flex-1">
                          <select
                            value={endDetails.minute}
                            onChange={e => {
                              const new24 = convertTo24h(endDetails.hour12, Number(e.target.value), endDetails.period);
                              setFormData(prev => ({
                                ...prev,
                                shiftEnd: new24,
                                shiftHours: calculateShiftHours(prev.shiftStart, new24)
                              }));
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-slate-900 transition text-sm font-bold cursor-pointer"
                          >
                            {Array.from({ length: 60 }, (_, i) => i).map(m => (
                              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-gray-400 font-bold block text-center mt-1">دقيقة</span>
                        </div>
                        {/* الفترة ص/م */}
                        <div className="w-24">
                          <select
                            value={endDetails.period}
                            onChange={e => {
                              const new24 = convertTo24h(endDetails.hour12, endDetails.minute, e.target.value as 'ص' | 'م');
                              setFormData(prev => ({
                                ...prev,
                                shiftEnd: new24,
                                shiftHours: calculateShiftHours(prev.shiftStart, new24)
                              }));
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-slate-900 transition text-sm font-bold cursor-pointer"
                          >
                            <option value="ص">ص (AM)</option>
                            <option value="م">م (PM)</option>
                          </select>
                          <span className="text-[10px] text-gray-400 font-bold block text-center mt-1">الفترة</span>
                        </div>
                      </div>
                    </div>

                    {/* عرض مدة الشيفت تلقائياً لتأكيد الفهم للمستخدم */}
                    <div className="col-span-1 md:col-span-2 text-center border-t border-slate-100 pt-3">
                      <span className="text-xs font-bold text-slate-500">
                        المدة الإجمالية المحسوبة تلقائياً للشيفت:{" "}
                        <span className="text-slate-950 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {formData.shiftHours} ساعة
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 block">الصلاحيات</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availablePermissions.map(perm => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                          formData.permissions.includes(perm.id)
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-slate-900'
                        }`}
                      >
                        {perm.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-black transition flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    <span>حفظ البيانات</span>
                  </button>
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Staff List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map(member => {
            // Combined check: Firestore flag AND lastActive freshness (timeTicker triggers every 1s)
            // If lastActive > 2s ago → offline instantly, no Firestore wait needed - اللحظي
            const isOnline = isMemberOnline(member);
            return (
              <div key={member.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group flex flex-col justify-between">
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{member.username}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Circle size={8} className={`fill-current ${isOnline ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className={`text-[10px] font-bold uppercase ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                            {isOnline ? 'متصل الآن' : 'غير متصل'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setTimeoutModalStaff(member);
                          setTimeoutMinutes(member.offlineTimeoutMinutes || 5);
                        }}
                        className="p-2 text-slate-400 hover:text-amber-500 transition"
                        title="ضبط مدة السماح للدقائق قبل الإنذار"
                      >
                        <AlarmClock size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingStaff(member);
                          setFormData({
                            username: member.username,
                            password: member.password,
                            email: member.email || '',
                            phone: member.phone || '',
                            permissions: member.permissions,
                            shiftHours: member.shiftHours || 8,
                            shiftStart: member.shiftStart || '09:00',
                            shiftEnd: member.shiftEnd || '17:00'
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 transition"
                      >
                        <Shield size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                      {/* WhatsApp button */}
                      <button 
                        onClick={() => {
                          const phone = member.phone?.replace(/[^0-9]/g, "") || '01284821014';
                          const message = encodeURIComponent(`رقم حساب الموظف هو: ${member.id}`);
                          const url = `https://wa.me/${phone}?text=${message}`;
                          window.open(url, '_blank');
                        }}
                        className="p-2 text-slate-400 hover:text-green-500 transition"
                        title="إرسال رسالة واتس آب للعميل برقم حساب الموظف"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 9h12m-6 4h6m-3 8a9 9 0 100-18 9 9 0 000 18z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {member.permissions.map(permId => {
                        const perm = availablePermissions.find(p => p.id === permId);
                        return (
                          <span key={permId} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-bold border border-slate-100">
                            {perm?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Shift / Attendance Tracking Visuals */}
                  <div className="pt-4 border-t border-gray-50 space-y-3">
                    {(() => {
                      const todayKey = getTodayKey();
                      const todayAttendance = member.attendance?.[todayKey];

                      if (todayAttendance) {
                        let totalActive = todayAttendance.totalActiveSeconds || 0;
                        let totalAway = todayAttendance.totalAwaySeconds || 0;

                        const lastActiveMs = member.lastActive ? new Date(member.lastActive).getTime() : 0;
                        const lastPingMs = new Date(todayAttendance.lastPing).getTime();
                        const startTimeMs = new Date(todayAttendance.startTime).getTime();
                        const shiftHours = todayAttendance.shiftHours || member.shiftHours || 8;
                        const shiftEndMs = startTimeMs + (shiftHours * 60 * 60 * 1000);
                        const now = Date.now();

                        // Real-time ticking: compute elapsed since last Firestore update
                        const offsetBase = Math.max(lastPingMs, lastActiveMs);
                        if (offsetBase < shiftEndMs) {
                          const elapsed = Math.round((Math.min(now, shiftEndMs) - offsetBase) / 1000);
                          if (elapsed > 0) {
                            if (!isOnline) {
                              // Offline: tick away counter
                              totalAway += elapsed;
                            } else {
                              // Online: tick active counter
                              totalActive += elapsed;
                            }
                          }
                        }

                        const shiftDurationSeconds = shiftHours * 3600;
                        const activePercent = Math.min(100, (totalActive / shiftDurationSeconds) * 100);
                        const awayPercent = Math.min(100, (totalAway / shiftDurationSeconds) * 100);
                        const remainingPercent = Math.max(0, 100 - activePercent - awayPercent);

                        const formatTime = (isoString: string) => {
                          return new Date(isoString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                        };

                        const formatDuration = (totalSeconds: number) => {
                          const hours = Math.floor(totalSeconds / 3600);
                          const minutes = Math.floor((totalSeconds % 3600) / 60);
                          const seconds = totalSeconds % 60;
                          let parts = [];
                          if (hours > 0) parts.push(`${hours} س`);
                          if (minutes > 0) parts.push(`${minutes} د`);
                          parts.push(`${seconds} ث`);
                          return parts.join(' و ');
                        };

                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                              <span className="text-slate-500">نشاط اليوم:</span>
                              <span className="text-green-600 font-mono">{formatDuration(totalActive)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold">
                              <span className="text-slate-500">غياب اليوم:</span>
                              <span className="text-amber-600 font-mono">{formatDuration(totalAway)}</span>
                            </div>

                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                              <div style={{ width: `${activePercent}%` }} className="bg-green-500 h-full transition-all duration-500" title="وقت النشاط" />
                              <div style={{ width: `${awayPercent}%` }} className="bg-amber-500 h-full transition-all duration-500" title="وقت الغياب" />
                              <div style={{ width: `${remainingPercent}%` }} className="bg-slate-200 h-full transition-all duration-500" title="المتبقي من الشيفت" />
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                              <span>البدء: {formatTime(todayAttendance.startTime)}</span>
                              <span>الشيفت: {member.shiftStart ? `${formatTime12h(member.shiftStart)} - ${formatTime12h(member.shiftEnd)}` : `${shiftHours} س`}</span>
                              <span>النهاية المتوقعة: {formatTime(new Date(shiftEndMs).toISOString())}</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center">
                            <p className="text-[11px] font-bold text-slate-400">لم يبدأ شيفت اليوم بعد</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              الشيفت المقرّر: {member.shiftStart ? `${formatTime12h(member.shiftStart)} - ${formatTime12h(member.shiftEnd)} (${member.shiftHours} س)` : `${member.shiftHours || 8} ساعات`}
                            </p>
                          </div>
                        );
                      }
                    })()}

                    <button
                      onClick={() => setAttendanceModalStaff(member)}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded-xl text-[10px] font-bold text-slate-600 transition flex items-center justify-center gap-1.5"
                    >
                      <AlarmClock size={14} />
                      <span>عرض سجل الحضور الكامل</span>
                    </button>
                  </div>

                  {member.lastActive && (
                    <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase">
                      <span>آخر نشاط:</span>
                      <span>{new Date(member.lastActive).toLocaleString('ar-EG')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {staff.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">لا يوجد موظفين حالياً</h3>
            <p className="text-gray-400 mt-2">ابدأ بإضافة أول موظف لفريقك</p>
            {/* Fallback WhatsApp button */}
            <button
              onClick={() => {
                const defaultPhone = '01284821014';
                const message = encodeURIComponent('هذا هو رقم حساب الموظف الافتراضي: 01284821014');
                const url = `https://wa.me/${defaultPhone}?text=${message}`;
                window.open(url, '_blank');
              }}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              إرسال رسالة واتس آب بالرقم الافتراضي
            </button>
          </div>
        )}

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
                <p className="text-gray-600 text-sm font-bold text-right">هل أنت متأكد من حذف هذا الموظف نهائياً؟</p>
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
                      setStaffToDelete(null);
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

        {/* Timeout Modal */}
        {timeoutModalStaff && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
              <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <AlarmClock size={24} />
                  </div>
                  <h3 className="font-bold">فترة السماح التلقائية</h3>
                </div>
                <button onClick={() => setTimeoutModalStaff(null)} className="hover:text-amber-100 transition"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-sm font-bold text-gray-600 text-center mb-6 leading-relaxed">
                  متى تود أن ينطلق جرس الإنذار عند خروج الموظف <span className="text-amber-600">({timeoutModalStaff.username})</span>؟
                </p>
                <input 
                  type="number" 
                  min="1" 
                  max="120"
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                  className="w-full text-center text-4xl font-bold text-slate-800 border-b-4 border-amber-500 pb-2 outline-none mx-auto block bg-transparent transition focus:border-slate-900"
                />
                <span className="text-sm font-bold text-gray-400 block text-center mt-2">دقائق من الغياب</span>
                
                <button 
                  onClick={() => {
                    updateStaff({ ...timeoutModalStaff, offlineTimeoutMinutes: timeoutMinutes });
                    setTimeoutModalStaff(null);
                  }}
                  className="w-full mt-8 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-xl"
                >
                  حفظ والإغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historical Attendance Logs Modal */}
        {attendanceModalStaff && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-right" dir="rtl">
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <AlarmClock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">سجل الحضور والغياب</h3>
                    <p className="text-slate-300 text-xs mt-0.5">للموظف: {attendanceModalStaff.username}</p>
                  </div>
                </div>
                <button onClick={() => setAttendanceModalStaff(null)} className="hover:text-amber-500 transition"><X size={24}/></button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-4">
                {attendanceModalStaff.attendance && Object.keys(attendanceModalStaff.attendance).length > 0 ? (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
                          <th className="p-4">اليوم</th>
                          <th className="p-4">بداية الشيفت</th>
                          <th className="p-4">الشيفت المقرّر</th>
                          <th className="p-4">الوقت الفعلي</th>
                          <th className="p-4">وقت الغياب</th>
                          <th className="p-4">حالة الشيفت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                        {Object.entries(attendanceModalStaff.attendance)
                          .sort((a, b) => b[0].localeCompare(a[0])) // Show newest first
                          .map(([dateKey, record]) => {
                            const isToday = dateKey === getTodayKey();
                            const isOnline = isMemberOnline(attendanceModalStaff);
                            
                            let totalActive = record.totalActiveSeconds || 0;
                            let totalAway = record.totalAwaySeconds || 0;

                            const lastPingMs = new Date(record.lastPing).getTime();
                            const startTimeMs = new Date(record.startTime).getTime();
                            const shiftEndMs = startTimeMs + (record.shiftHours * 60 * 60 * 1000);

                            if (isToday) {
                              if (!isOnline && lastPingMs < shiftEndMs) {
                                const elapsedInShiftMs = Math.min(Date.now(), shiftEndMs) - lastPingMs;
                                if (elapsedInShiftMs > 0) {
                                  totalAway += Math.round(elapsedInShiftMs / 1000);
                                }
                              } else if (isOnline && lastPingMs < shiftEndMs) {
                                const elapsedInShiftMs = Math.min(Date.now(), shiftEndMs) - lastPingMs;
                                if (elapsedInShiftMs > 0 && (Date.now() - lastPingMs < 10000)) {
                                  totalActive += Math.round(elapsedInShiftMs / 1000);
                                }
                              }
                            }

                            const isFinished = Date.now() >= shiftEndMs;

                            const formatTime = (isoString: string) => {
                              return new Date(isoString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                            };

                            const formatDuration = (totalSeconds: number) => {
                              const hours = Math.floor(totalSeconds / 3600);
                              const minutes = Math.floor((totalSeconds % 3600) / 60);
                              const seconds = totalSeconds % 60;
                              let parts = [];
                              if (hours > 0) parts.push(`${hours} س`);
                              if (minutes > 0) parts.push(`${minutes} د`);
                              parts.push(`${seconds} ث`);
                              return parts.join(' و ');
                            };

                            return (
                              <tr key={dateKey} className="hover:bg-gray-50/50 transition">
                                <td className="p-4 font-bold text-slate-800">{dateKey}</td>
                                <td className="p-4">{formatTime(record.startTime)}</td>
                                <td className="p-4">{record.shiftHours} ساعات</td>
                                <td className="p-4 text-green-600 font-bold">{formatDuration(totalActive)}</td>
                                <td className="p-4 text-amber-600 font-bold">{formatDuration(totalAway)}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isFinished ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700 animate-pulse'
                                  }`}>
                                    {isFinished ? 'مكتمل' : 'قيد العمل'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <AlarmClock size={48} className="mx-auto mb-3 text-gray-300 animate-bounce" />
                    <p className="font-bold">لا يوجد سجلات حضور مسجلة لهذا الموظف</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StaffManagement;
