import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Search, Phone, Calendar, Package, Eye, ArrowRight } from 'lucide-react';

const StaffOrders: React.FC = () => {
  const { orders, currentStaff, branding, language } = useApp();
  const [searchPhone, setSearchPhone] = useState('');
  const [showAll, setShowAll] = useState(false); // Toggle between assigned and search results

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  // Get assigned orders (default view)
  const assignedOrders = useMemo(() => {
    if (!currentStaff) return [];
    return orders.filter(order => order.assignedTo === currentStaff.id)
      .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
  }, [orders, currentStaff]);

  // Get orders by phone search
  const searchedOrders = useMemo(() => {
    if (!searchPhone.trim()) return [];
    const cleanSearch = cleanPhone(searchPhone);
    return orders
      .filter(order => cleanPhone(order.phoneNumber).slice(-10) === cleanSearch.slice(-10))
      .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
  }, [orders, searchPhone]);

  const displayedOrders = showAll && searchPhone.trim() ? searchedOrders : assignedOrders;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPhone.trim()) {
      setShowAll(true);
    }
  };

  const handleClear = () => {
    setSearchPhone('');
    setShowAll(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ قيد الانتظار',
      approved: '✅ مقبول',
      shipped: '🚚 مرسل',
      delivered: '📦 تم التسليم',
      cancelled: '❌ ملغي'
    };
    return labels[status] || status;
  };

  return (
    <AdminLayout title="طلباتي">
      <div className="max-w-6xl mx-auto" dir="rtl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Package size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black">طلباتي</h1>
                <p className="text-blue-100 text-sm mt-2">
                  عرض الطلبات المسندة لك وابحث عن طلبات أخرى برقم التليفون
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="ابحث برقم التليفون (مثال: 201012345678 أو 01012345678)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-12 pl-4 outline-none focus:border-blue-600 transition"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap"
            >
              <Search size={18} />
              بحث
            </button>
            {showAll && (
              <button
                type="button"
                onClick={handleClear}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-3 rounded-xl font-bold transition whitespace-nowrap"
              >
                إعادة تعيين
              </button>
            )}
          </div>
        </form>

        {/* Display Mode Info */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-900 font-bold">
            {showAll && searchPhone.trim()
              ? `🔍 يتم عرض ${searchedOrders.length} طلب للرقم ${searchPhone}`
              : `📋 يتم عرض ${assignedOrders.length} طلب مسند لك`}
          </p>
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">
              {showAll ? 'لم يتم العثور على طلبات' : 'لا توجد طلبات مسندة'}
            </h3>
            <p className="text-gray-500">
              {showAll ? 'لا توجد طلبات لرقم التليفون هذا' : 'سيتم إسناد الطلبات لك قريباً'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const isAssignedToMe = order.assignedTo === currentStaff?.id;
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border-2 transition p-6 ${
                    isAssignedToMe 
                      ? 'border-blue-200 shadow-md hover:shadow-lg' 
                      : 'border-gray-200 shadow-sm hover:shadow-md opacity-90'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">رقم الطلب</p>
                        <p className="text-lg font-black text-gray-900">{order.id?.substring(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">👤 اسم العميل</p>
                        <p className="font-bold text-gray-900">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">📞 رقم التليفون</p>
                        <p className="font-mono font-bold text-gray-900">{order.phoneNumber}</p>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">الحالة</p>
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">📅 التاريخ</p>
                        <p className="text-gray-900">
                          {order.date
                            ? new Date(order.date).toLocaleDateString('ar-EG')
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">💰 الإجمالي</p>
                        <p className="text-lg font-black text-gray-900">{order.finalTotal || 0} ج.م</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAssignedToMe && (
                        <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          ✅ مسند لي
                        </span>
                      )}
                      {order.assignedTo && order.assignedTo !== currentStaff?.id && (
                        <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                          👤 لموظف آخر
                        </span>
                      )}
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2 transition">
                      <span>تفاصيل</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default StaffOrders;
