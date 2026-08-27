
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Trash2, CheckCircle, XCircle, Clock, MapPin, Phone, Package, Search, Truck, FileText, Printer, Download, Calendar as CalendarIcon, ChevronRight, ChevronLeft, MessageCircle, User } from 'lucide-react';
import { OrderStatus, Order } from '../../types';
import Invoice from '../../components/Invoice';

const Orders: React.FC = () => {
  const { orders, updateOrderStatus, updateOrderAssignment, updateOrderShippingFee, deleteOrder, manufacturingRequests, staff } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingAction, setPendingAction] = useState<'print' | 'download' | undefined>(undefined);
  
  // History State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const handleAction = (order: Order, action?: 'print' | 'download') => {
    setPendingAction(action);
    setSelectedOrder(order);
  };

  const filteredOrders = useMemo(() => {
    const safeOrders = [...(orders || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!searchQuery.trim()) return safeOrders;
    const query = searchQuery.toLowerCase();
    return safeOrders.filter(o => 
      o && (
        o.customerName?.toLowerCase().includes(query) || 
        o.phoneNumber?.includes(query)
      )
    );
  }, [orders, searchQuery]);

  const updateStatus = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
  };

  const handleDeleteOrder = (id: string) => {
    deleteOrder(id);
    setConfirmDelete(null);
  };

  const statusMap: Record<OrderStatus, { label: string, color: string, icon: React.ReactNode }> = {
    pending: { label: 'معلق', color: 'bg-amber-100 text-amber-700', icon: <Clock size={14} /> },
    approved: { label: 'تم الموافقة', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={14} /> },
    shipped: { label: 'جاري التوصيل', color: 'bg-purple-100 text-purple-700', icon: <Truck size={14} /> },
    delivered: { label: 'تم التوصيل', color: 'bg-green-100 text-green-700', icon: <Truck size={14} /> },
    cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
  };

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month, 1).getDay();
  }, [currentMonth]);

  const manufacturingStats = useMemo(() => {
    const stats: Record<number, number> = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    manufacturingRequests.forEach(req => {
      const reqDate = new Date(req.createdAt);
      if (reqDate.getFullYear() === year && reqDate.getMonth() === month && req.status === 'completed') {
        const day = reqDate.getDate();
        stats[day] = (stats[day] || 0) + req.quantity;
      }
    });
    return stats;
  }, [manufacturingRequests, currentMonth]);

  const selectedDayRequests = useMemo(() => {
    if (selectedDay === null) return [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return manufacturingRequests.filter(req => {
      const reqDate = new Date(req.createdAt);
      return reqDate.getFullYear() === year && 
             reqDate.getMonth() === month && 
             reqDate.getDate() === selectedDay &&
             req.status === 'completed';
    });
  }, [manufacturingRequests, currentMonth, selectedDay]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
    setSelectedDay(null);
  };

  return (
    <AdminLayout title="إدارة الطلبات">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto" dir="rtl">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'orders' 
              ? 'bg-slate-900 text-white shadow-lg' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          الطلبات الحالية
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'history' 
              ? 'bg-slate-900 text-white shadow-lg' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          سجل التصنيع
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          <div className="mb-4 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">إجمالي الطلبات في النظام: {orders?.length || 0}</span>
          </div>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث بالاسم أو رقم الهاتف..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-amber-500 transition shadow-sm text-sm"
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-4">
            {(!filteredOrders || filteredOrders.length === 0) ? (
              <div className="text-center py-20 bg-white rounded-2xl text-gray-400">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد طلبات حالية'}
              </div>
            ) : (
              filteredOrders.map(order => {
                // فحص إضافي للتأكد من أن بيانات المنتج موجودة لمنع الانهيار
                // فحص إضافي للتأكد من أن بيانات المنتجات موجودة لمنع الانهيار
                const hasProducts = order && order.products && order.products.length > 0;
                const firstProduct = hasProducts ? order.products[0].product : null;
                
                return (
                  <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center group relative overflow-hidden">
                    <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                      {firstProduct && firstProduct.image ? (
                        <img src={firstProduct.image} className="w-full h-full object-cover" alt={firstProduct.name} />
                      ) : (
                        <Package size={40} className="text-gray-200" />
                      )}
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">{order.customerName || 'عميل غير معروف'}</h4>
                        <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Phone size={14} /> {order.phoneNumber || 'لا يوجد رقم'}
                        </p>
                        <div className="mt-3">
                          <p className="flex items-start gap-1 text-sm text-gray-600">
                            <MapPin size={14} className="mt-1 flex-shrink-0" />
                            <span className="font-bold text-slate-900">{order.governorate} - {order.city}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1 mr-5">{order.address}</p>
                          <p className="text-[10px] text-amber-600 font-bold mt-1 mr-5">العلامة المميزة: {order.landmark || 'لا توجد'}</p>
                          {order.cancelledByCustomer && order.cancellationReason && (
                            <p className="text-[11px] text-red-600 font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-100/50 mr-5 flex items-center gap-1">
                              <span>❌ سبب الإلغاء:</span>
                              <span className="text-gray-800">{order.cancellationReason}</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                             <User size={14} className="text-gray-400" />
                             <select 
                               value={order.assignedTo || ''}
                               onChange={(e) => updateOrderAssignment(order.id, e.target.value)}
                               className="bg-gray-50 border-none rounded-lg py-1.5 px-3 text-[10px] font-bold text-gray-600 outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
                             >
                               <option value="">غير معين</option>
                               {(staff || []).filter(s => s.permissions.includes('orders')).map(s => (
                                 <option key={s.id} value={s.id}>{s.username}</option>
                               ))}
                             </select>
                          </div>
                        </div>
                      </div>

                      <div className="border-r border-gray-100 pr-6">
                        <span className="text-[10px] uppercase font-bold text-gray-400">المنتجات المطلوبة</span>
                        <div className="mt-2 space-y-2 max-h-24 overflow-y-auto">
                          {hasProducts ? order.products.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-800">{item.product.name}</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded-full font-bold text-amber-700"> {item.quantity} </span>
                            </div>
                          )) : (
                            <p className="text-xs text-gray-400 italic">لا توجد منتجات</p>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400">الإجمالي:</span>
                            <p className="text-lg font-black text-amber-800">{order.finalTotal} ج.م</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                               <Truck size={12} className="text-gray-400" />
                               <span className="text-[10px] font-bold text-gray-400">الشحن:</span>
                            </div>
                            <span className="text-[10px] font-black text-gray-800">{order.shippingFee || 0} ج.م</span>
                          </div>

                          {order.promoCode && (
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-green-600">كود: {order.promoCode}</span>
                              <span className="text-[9px] font-bold text-gray-400"> (خصم: {order.discountAmount} ج.م)</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                           <p className="text-[10px] text-gray-400 font-bold">رقم الطلب: #{order.id}</p>
                           <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                             <Clock size={10} />
                             {new Date(order.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                      </div>

                      {/* Column 3: Actions & Status */}
                      <div className="flex flex-col gap-4 min-w-[200px]">
                        <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-between shadow-sm ${statusMap[order.status]?.color || 'bg-gray-100'}`}>
                          <div className="flex items-center gap-2">
                            {statusMap[order.status]?.icon || <Clock size={14} />}
                            {order.cancelledByCustomer && order.status === 'cancelled' ? 'ملغي من قبل العميل' : (statusMap[order.status]?.label || 'غير محدد')}
                          </div>
                        </div>

                        <div className="space-y-3">
                           {/* Status Controls */}
                           {!order.cancelledByCustomer && (
                             <div className="flex gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                <button onClick={() => updateStatus(order.id, 'approved')} className={`flex-1 p-2 rounded-lg transition ${order.status === 'approved' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-600 hover:bg-blue-100'}`} title="موافقة"><CheckCircle size={18} /></button>
                                <button onClick={() => updateStatus(order.id, 'shipped')} className={`flex-1 p-2 rounded-lg transition ${order.status === 'shipped' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-600 hover:bg-purple-100'}`} title="شحن"><Truck size={18} /></button>
                                <button onClick={() => updateStatus(order.id, 'delivered')} className={`flex-1 p-2 rounded-lg transition ${order.status === 'delivered' ? 'bg-green-600 text-white shadow-md' : 'text-green-600 hover:bg-green-100'}`} title="توصيل"><CheckCircle size={18} /></button>
                                <button onClick={() => updateStatus(order.id, 'cancelled')} className={`flex-1 p-2 rounded-lg transition ${order.status === 'cancelled' ? 'bg-red-600 text-white shadow-md' : 'text-red-600 hover:bg-red-100'}`} title="إلغاء"><XCircle size={18} /></button>
                             </div>
                           )}

                           {/* Secondary Actions */}
                           <div className="flex gap-2 justify-end">
                             <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                               <button onClick={() => handleAction(order)} className="p-2 text-slate-600 hover:bg-white rounded-lg transition" title="فاتورة"><FileText size={18} /></button>
                               <button onClick={() => handleAction(order, 'print')} className="p-2 text-blue-600 hover:bg-white rounded-lg transition" title="طباعة"><Printer size={18} /></button>
                             </div>
                             <button onClick={() => setConfirmDelete(order.id)} className="p-2.5 bg-gray-50 text-gray-300 rounded-xl hover:bg-red-600 hover:text-white transition" title="حذف">
                               <Trash2 size={18} />
                             </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="space-y-8" dir="rtl">
          {/* Calendar Header */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-2xl text-amber-700">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-sm text-gray-500">سجل الإنتاج اليومي للمنتجات</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <ChevronRight size={24} />
              </button>
              <button 
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Grid */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-gray-400 py-2 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const hasProduction = manufacturingStats[day] > 0;
                  const isSelected = selectedDay === day;
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative group ${
                        isSelected 
                          ? 'bg-slate-900 text-white shadow-xl scale-105 z-10' 
                          : hasProduction 
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg font-bold">{day}</span>
                      {hasProduction && !isSelected && (
                        <div className="absolute bottom-2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      )}
                      {hasProduction && (
                        <span className={`text-[8px] font-bold mt-1 ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>
                          {manufacturingStats[day]} قطعة
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Details */}
            <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-amber-400" />
                  تفاصيل يوم {selectedDay || '--'}
                </h4>
                
                {selectedDayRequests.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Package size={24} />
                    </div>
                    <p className="text-slate-400 text-sm">لا يوجد إنتاج مكتمل في هذا اليوم</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDayRequests.map(req => (
                      <div key={req.id} className="bg-white/10 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-sm">{req.productName}</span>
                          <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded text-[10px] font-bold">
                            {req.quantity} قطعة
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>بواسطة: {req.requesterName}</span>
                          <span>{new Date(req.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-white/10 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400">إجمالي الإنتاج:</span>
                        <span className="text-xl font-bold text-amber-400">
                          {selectedDayRequests.reduce((acc: number, curr) => acc + curr.quantity, 0)} قطعة
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">ملخص الشهر</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">إجمالي القطع المصنعة:</span>
                    <span className="font-bold text-slate-900">
                      {(Object.values(manufacturingStats) as number[]).reduce((acc: number, curr: number) => acc + curr, 0)} قطعة
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">أيام العمل النشطة:</span>
                    <span className="font-bold text-slate-900">
                      {Object.keys(manufacturingStats).length} أيام
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">تأكيد الحذف</h3>
            <p className="text-gray-500 text-center mb-8">هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الفعل.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                تراجع
              </button>
              <button 
                onClick={() => handleDeleteOrder(confirmDelete!)}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="absolute inset-0" onClick={() => { setSelectedOrder(null); setPendingAction(undefined); }} />
          <div className="relative w-full max-w-lg z-10 animate-in zoom-in duration-300">
            <Invoice 
              order={selectedOrder} 
              onClose={() => { setSelectedOrder(null); setPendingAction(undefined); }} 
              initialAction={pendingAction}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;
