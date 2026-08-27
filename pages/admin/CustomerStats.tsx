
import React, { useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Users, Phone, Package, Trophy, TrendingUp, UserCheck, UserPlus } from 'lucide-react';

interface CustomerStat {
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
}

const CustomerStats: React.FC = () => {
  const { orders } = useApp();

  const customerStats = useMemo(() => {
    const statsMap: Record<string, CustomerStat> = {};

    (orders || []).forEach(order => {
      if (!order) return;
      const phone = order.phoneNumber?.trim();
      if (!phone) return;

      if (!statsMap[phone]) {
        statsMap[phone] = {
          name: order.customerName || 'عميل غير معروف',
          phone: phone,
          orderCount: 0,
          totalSpent: 0
        };
      }

      statsMap[phone].orderCount += 1;
      statsMap[phone].totalSpent += (order.finalTotal || 0);
    });

    return Object.values(statsMap).sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  // Retention metrics
  const retentionMetrics = useMemo(() => {
    try {
      const newCustomers = customerStats.filter(c => c.orderCount === 1).length;
      const repeatCustomers = customerStats.filter(c => c.orderCount > 1).length;
      const vipCustomers = customerStats.filter(c => c.orderCount >= 5).length;
      const totalCustomers = customerStats.length;
      
      const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
      const avgOrderValue = (orders || []).length > 0 
        ? (orders || []).reduce((acc, o) => acc + (o.finalTotal || 0), 0) / (orders || []).length 
        : 0;
      const totalRevenue = customerStats.reduce((acc, c) => acc + c.totalSpent, 0);

      return {
        newCustomers,
        repeatCustomers,
        vipCustomers,
        retentionRate: isNaN(retentionRate) ? 0 : retentionRate,
        avgOrderValue,
        totalRevenue,
        totalCustomers
      };
    } catch {
      return {
        newCustomers: 0,
        repeatCustomers: 0,
        vipCustomers: 0,
        retentionRate: 0,
        avgOrderValue: 0,
        totalRevenue: 0,
        totalCustomers: 0
      };
    }
  }, [customerStats, orders]);

  return (
    <AdminLayout title="إحصائيات العملاء">
      <div className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-[2rem] border border-white shadow-sm flex items-center justify-between">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">إجمالي العملاء</p>
              <h3 className="text-2xl font-bold text-gray-800">{retentionMetrics.totalCustomers}</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-500"><Users size={24} /></div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-[2rem] border border-white shadow-sm flex items-center justify-between">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">معدل الاحتفاظ</p>
              <h3 className="text-2xl font-bold text-gray-800">{Math.round(retentionMetrics.retentionRate)}%</h3>
              <p className="text-[10px] text-gray-500 mt-1">{retentionMetrics.repeatCustomers} من {retentionMetrics.totalCustomers}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-purple-500"><TrendingUp size={24} /></div>
          </div>

          <div className="bg-green-50 p-6 rounded-[2rem] border border-white shadow-sm flex items-center justify-between">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">عملاء جدد</p>
              <h3 className="text-2xl font-bold text-gray-800">{retentionMetrics.newCustomers}</h3>
              <p className="text-[10px] text-gray-500 mt-1">{retentionMetrics.totalCustomers > 0 ? Math.round((retentionMetrics.newCustomers / retentionMetrics.totalCustomers) * 100) : 0}% من الإجمالي</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-green-500"><UserPlus size={24} /></div>
          </div>

          <div className="bg-amber-50 p-6 rounded-[2rem] border border-white shadow-sm flex items-center justify-between">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">عملاء VIP</p>
              <h3 className="text-2xl font-bold text-gray-800">{retentionMetrics.vipCustomers}</h3>
              <p className="text-[10px] text-gray-500 mt-1">(5+ طلبات)</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-500"><Trophy size={24} /></div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50">
            <h3 className="font-bold text-gray-800">قائمة العملاء الأكثر طلباً</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">الترتيب</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">اسم العميل</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">رقم الهاتف</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">عدد الطلبات</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">إجمالي المدفوعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customerStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">لا يوجد بيانات عملاء حالياً</td>
                  </tr>
                ) : (
                  customerStats.map((customer, index) => (
                    <tr key={customer.phone} className="hover:bg-gray-50/50 transition">
                      <td className="px-8 py-6">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-amber-100 text-amber-700' : 
                          index === 1 ? 'bg-slate-100 text-slate-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-bold text-slate-800">{customer.name}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                          <Phone size={14} />
                          {customer.phone}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm">
                          {customer.orderCount} طلبات
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-bold text-green-600">{customer.totalSpent} ج.م</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomerStats;
