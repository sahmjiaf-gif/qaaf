
import React, { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Clock, 
  Package, 
  CheckCircle, 
  DollarSign,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { orders = [], products = [], customers = [], consultations = [], theme } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const stats = useMemo(() => {
    try {
      // Filter orders by the selected day and month
      const filteredOrders = (orders || []).filter(o => {
        if (!o || !o.date) return false;
        const d = new Date(o.date);
        return d.getDate() === selectedDay && 
               d.getMonth() === currentMonth.getMonth() && 
               d.getFullYear() === currentMonth.getFullYear() &&
               o.status !== 'cancelled';
      });

      const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.finalTotal || 0), 0);
      const uniqueCustomersToday = new Set(filteredOrders.map(o => o.customerName)).size;
      
      return {
        totalRevenue,
        totalOrders: filteredOrders.length,
        totalProducts: products?.length || 0,
        totalCustomers: uniqueCustomersToday,
        pendingOrders: (orders || []).filter(o => o && o.status === 'pending').length,
        pendingConsultations: (consultations || []).filter(c => c && c.status === 'pending').length
      };
    } catch (e) {
      console.error("Stats calc error:", e);
      return { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, pendingOrders: 0, pendingConsultations: 0 };
    }
  }, [orders, products, customers, consultations, selectedDay, currentMonth]);

  const lowStockProducts = useMemo(() => {
    try {
       return (products || []).filter(p => p && (p.stock || 0) <= (p.minStock || 5));
    } catch { return []; }
  }, [products]);

  const revenueData = useMemo(() => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      return last7Days.map(date => {
        const dayOrders = (orders || []).filter(o => o && o.status !== 'cancelled' && o.date && o.date.startsWith(date));
        return {
          name: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }),
          revenue: dayOrders.reduce((acc, o) => acc + (o.finalTotal || 0), 0)
        };
      });
    } catch { return []; }
  }, [orders]);

  // Calendar Logic for "Days Table"
  const daysInMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  }, [currentMonth]);
  
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  }, [currentMonth]);

  const manufacturingStats = useMemo(() => {
    try {
      const stats: Record<number, number> = {};
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      (orders || []).forEach(order => {
        if (!order || !order.date) return;
        const date = new Date(order.date);
        if (date.getFullYear() === year && date.getMonth() === month && order.status !== 'cancelled') {
          const day = date.getDate();
          stats[day] = (stats[day] || 0) + (order.finalTotal || 0);
        }
      });
      return stats;
    } catch { return {}; }
  }, [orders, currentMonth]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: color ? `${color}10` : '#f3f4f6', color: color || '#000' }}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );

  return (
    <AdminLayout title="الإحصائيات المتقدمة">
      <div className="space-y-8" dir="rtl">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي المبيعات" value={`${stats.totalRevenue.toLocaleString()} ج.م`} icon={DollarSign} color="#10b981" />
          <StatCard title="الطلبات" value={stats.totalOrders} icon={ShoppingBag} color="#3b82f6" />
          <StatCard title="العملاء" value={stats.totalCustomers} icon={Users} color="#8b5cf6" />
          <StatCard title="المنتجات" value={stats.totalProducts} icon={Package} color="#f59e0b" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">منحنى المبيعات (آخر 7 أيام)</h4>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Alerts */}
          <div className="space-y-6">
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                <Clock size={24} />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-orange-900 opacity-60">طلبات معلقة</p>
                <h4 className="text-xl font-black text-orange-900">{stats.pendingOrders}</h4>
              </div>
            </div>
            <Link to="/admin/consultations" className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer w-full text-right">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                <CheckCircle size={24} />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-900 opacity-60">استشارات جديدة</p>
                <h4 className="text-xl font-black text-blue-900">{stats.pendingConsultations}</h4>
              </div>
            </Link>

            {lowStockProducts.length > 0 && (
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-900 opacity-60">نقص في المخزون</p>
                    <h4 className="text-xl font-black text-red-900">{lowStockProducts.length} منتجات</h4>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-white/50 p-3 rounded-xl border border-red-50">
                      <span className="text-[10px] font-bold text-gray-700">{p.name}</span>
                      <span className="text-[10px] font-black text-red-600">{p.stock || 0} قطعة</span>
                    </div>
                  ))}
                </div>
                <Link to="/admin/products" className="block text-center text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline pt-2">إدارة المخزون</Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-gray-900">أكثر المنتجات مبيعاً 🏆</h4>
            <Package className="text-amber-500" size={20} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
                  <th className="p-4">المرتبة</th>
                  <th className="p-4">اسم المنتج</th>
                  <th className="p-4">عدد المبيعات</th>
                  <th className="p-4">إجمالي الإيرادات</th>
                  <th className="p-4">متوسط السعر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {(() => {
                  try {
                    const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
                    (orders || []).forEach(order => {
                      if (order && order.status !== 'cancelled') {
                        order.products?.forEach((item: any) => {
                          const pid = item.product?.id;
                          if (pid) {
                            if (!productSales[pid]) {
                              productSales[pid] = { name: item.product?.name || 'منتج مجهول', count: 0, revenue: 0 };
                            }
                            productSales[pid].count += item.quantity || 1;
                            productSales[pid].revenue += (item.product?.price || 0) * (item.quantity || 1);
                          }
                        });
                      }
                    });

                    return Object.entries(productSales)
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 5)
                      .map(([, product], idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-bold text-slate-800">#{idx + 1}</td>
                          <td className="p-4 font-bold text-slate-800">{product.name}</td>
                          <td className="p-4 text-blue-600 font-bold">{product.count} قطعة</td>
                          <td className="p-4 text-green-600 font-bold">{product.revenue.toLocaleString()} ج.م</td>
                          <td className="p-4 text-amber-600 font-bold">{Math.round(product.revenue / product.count).toLocaleString()} ج.م</td>
                        </tr>
                      ));
                  } catch { 
                    return (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد بيانات مبيعات</td>
                      </tr>
                    );
                  }
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Days History Table (Calendar Style) */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                <CalendarIcon size={20} />
              </div>
              <h4 className="text-lg font-bold text-gray-900">سجل النشاط اليومي والمبيعات</h4>
            </div>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button onClick={() => {
                const d = new Date(currentMonth);
                d.setMonth(d.getMonth() + 1);
                setCurrentMonth(d);
              }} className="p-2 hover:bg-white rounded-xl transition"><ChevronRight size={20} /></button>
              <span className="px-6 py-2 text-sm font-bold text-gray-800">
                {currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => {
                const d = new Date(currentMonth);
                d.setMonth(d.getMonth() - 1);
                setCurrentMonth(d);
              }} className="p-2 hover:bg-white rounded-xl transition"><ChevronLeft size={20} /></button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4">
              {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-gray-400 py-2 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const revenue = manufacturingStats[day] || 0;
                
                const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const isToday = today.getTime() === dateObj.getTime();
                const isFuture = dateObj > today;
                const isSelected = selectedDay === day;
                
                return (
                  <button 
                    key={day}
                    disabled={isFuture}
                    onClick={() => setSelectedDay(day)}
                    className={`relative aspect-square rounded-[2rem] border transition-all duration-300 group flex flex-col items-center justify-center
                      ${isSelected ? 'bg-slate-900 border-slate-900 shadow-xl scale-105 z-10' : ''}
                      ${isToday && !isSelected ? 'bg-amber-100 border-amber-300 shadow-md scale-105 z-10' : ''}
                      ${!isToday && !isSelected && !isFuture ? 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-lg' : ''}
                      ${isFuture ? 'bg-gray-50/50 border-transparent opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    style={revenue > 0 && !isToday && !isSelected ? { backgroundColor: `${theme.accentColor}08`, borderColor: `${theme.accentColor}30` } : {}}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-lg font-black ${isSelected ? 'text-white' : isToday ? 'text-amber-700' : isFuture ? 'text-gray-300' : 'text-gray-400'}`}>
                        {day}
                      </span>
                      {revenue > 0 && (
                        <div className="space-y-0.5 text-center mt-1">
                          <p className={`text-[9px] font-black tracking-tight ${isSelected ? 'text-amber-400' : isToday ? 'text-amber-600' : 'text-gray-900'}`}>
                            {revenue.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {revenue > 0 && !isSelected && (
                      <div className="absolute bottom-4 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#d97706' : theme.accentColor }} />
                    )}
                    {isToday && !isSelected && (
                      <div className="absolute top-3 px-2 py-0.5 bg-amber-600 text-white text-[6px] font-black rounded-full uppercase tracking-widest">اليوم</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details section below calendar */}
          <div className="pt-8 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-xl font-bold flex items-center gap-2">
                      <Clock className="text-amber-400" size={20} />
                      تفاصيل مبيعات يوم {selectedDay}
                   </h4>
                   <div className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                      {currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                   </div>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {(orders || []).filter(o => {
                      if (!o || !o.date) return false;
                      const d = new Date(o.date);
                      return d.getDate() === selectedDay && 
                             d.getMonth() === currentMonth.getMonth() && 
                             d.getFullYear() === currentMonth.getFullYear() &&
                             o.status !== 'cancelled';
                   }).length === 0 ? (
                      <div className="text-center py-12 opacity-40">لا توجد مبيعات في هذا اليوم</div>
                   ) : (
                      (orders || []).filter(o => {
                         if (!o || !o.date) return false;
                         const d = new Date(o.date);
                         return d.getDate() === selectedDay && 
                                d.getMonth() === currentMonth.getMonth() && 
                                d.getFullYear() === currentMonth.getFullYear() &&
                                o.status !== 'cancelled';
                      }).map(order => (
                         <div key={order.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                                  {order.customerName?.charAt(0) || '؟'}
                               </div>
                               <div>
                                  <p className="font-bold text-sm">{order.customerName || 'عميل مجهول'}</p>
                                  <p className="text-[10px] text-gray-400">{order.date ? new Date(order.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-amber-400">{(order.finalTotal || 0).toLocaleString()} ج.م</p>
                               <p className="text-[8px] text-gray-500 uppercase tracking-widest">#{order.id?.slice(-6)}</p>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-[2rem] space-y-2">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">إجمالي مبيعات اليوم</p>
                   <h3 className="text-2xl font-black text-gray-900">
                      {(orders || []).filter(o => {
                         if (!o || !o.date) return false;
                         const d = new Date(o.date);
                         return d.getDate() === selectedDay && 
                                d.getMonth() === currentMonth.getMonth() && 
                                d.getFullYear() === currentMonth.getFullYear() &&
                                o.status !== 'cancelled';
                      }).reduce((acc, o) => acc + (o.finalTotal || 0), 0).toLocaleString()} <span className="text-xs text-gray-400">ج.م</span>
                   </h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] space-y-2">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">عدد الطلبات</p>
                   <h3 className="text-2xl font-black text-gray-900">
                      {(orders || []).filter(o => {
                         if (!o || !o.date) return false;
                         const d = new Date(o.date);
                         return d.getDate() === selectedDay && 
                                d.getMonth() === currentMonth.getMonth() && 
                                d.getFullYear() === currentMonth.getFullYear() &&
                                o.status !== 'cancelled';
                      }).length} <span className="text-xs text-gray-400">طلب</span>
                   </h3>
                </div>
                <div className="col-span-2 bg-amber-50 p-6 rounded-[2rem] flex items-center justify-between group overflow-hidden relative">
                   <div className="relative z-10">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">متوسط قيمة الطلب</p>
                      <h3 className="text-2xl font-black text-amber-900">
                         {(() => {
                            const dayOrders = (orders || []).filter(o => {
                               if (!o || !o.date) return false;
                               const d = new Date(o.date);
                               return d.getDate() === selectedDay && 
                                      d.getMonth() === currentMonth.getMonth() && 
                                      d.getFullYear() === currentMonth.getFullYear() &&
                                      o.status !== 'cancelled';
                            });
                            return dayOrders.length > 0 
                               ? (dayOrders.reduce((acc, o) => acc + (o.finalTotal || 0), 0) / dayOrders.length).toFixed(0)
                               : 0;
                         })()} <span className="text-xs text-amber-700">ج.م</span>
                      </h3>
                   </div>
                   <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-200/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                   <TrendingUp className="text-amber-300 relative z-10" size={40} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
