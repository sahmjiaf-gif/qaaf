import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp, Customer } from '../../state';
import { Users, Search, ShoppingBag, DollarSign, Calendar, Star, Filter, ArrowUpRight, MessageCircle, Phone } from 'lucide-react';

const CRM: React.FC = () => {
  const { customers, orders } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'loyal' | 'vip' | 'new'>('all');

  const dynamicCustomers = React.useMemo(() => {
    const customerMap = new Map<string, any>();
    
    orders.forEach(order => {
      // Only include customers if their order is delivered
      if (order.status !== 'delivered') return;
      
      const phone = order.phoneNumber?.trim() || '';
      if (!phone) return;
      
      if (!customerMap.has(phone)) {
        const existingCust = customers.find(c => c.phone === phone);
        customerMap.set(phone, {
          id: existingCust ? existingCust.id : phone,
          name: order.customerName, // Start with this order's name
          phone: phone,
          customerType: existingCust ? existingCust.customerType : 'new',
          totalSpent: 0,
          ordersCount: 0,
          lastOrderDate: order.date
        });
      }
      
      const c = customerMap.get(phone);
      c.ordersCount += 1;
      // Do not include shipping fee in total spent if possible, but for now we just use finalTotal
      c.totalSpent += (order.finalTotal || 0);
      
      if (new Date(order.date) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = order.date;
        c.name = order.customerName; // Always take the most recent name
      }
      
      if (c.ordersCount > 10) c.customerType = 'vip';
      else if (c.ordersCount > 1) c.customerType = 'loyal';
    });
    
    return Array.from(customerMap.values());
  }, [customers, orders]);

  const filtered = dynamicCustomers.filter(c => {
    const matchesFilter = filter === 'all' || c.customerType === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const StatCard = ({ title, value, color, icon: Icon }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${color}10`, color }}>
        <Icon size={24} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-xl font-black text-gray-900">{value}</h4>
      </div>
    </div>
  );

  return (
    <AdminLayout title="إدارة العملاء (CRM)">
      <div className="space-y-8" dir="rtl">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي العملاء" value={dynamicCustomers.length} color="#3b82f6" icon={Users} />
          <StatCard title="عملاء VIP" value={dynamicCustomers.filter(c => c.customerType === 'vip').length} color="#8b5cf6" icon={Star} />
          <StatCard title="متوسط الإنفاق" value={`${Math.round(dynamicCustomers.reduce((acc, c) => acc + c.totalSpent, 0) / (dynamicCustomers.length || 1))} ج.م`} color="#10b981" icon={DollarSign} />
          <StatCard title="نشاط اليوم" value={orders.filter(o => o.date && o.date.startsWith(new Date().toISOString().split('T')[0])).length} color="#f59e0b" icon={Calendar} />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['all', 'vip', 'loyal', 'new'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {f === 'all' ? 'الكل' : f === 'vip' ? 'VIP' : f === 'loyal' ? 'ولاء عالي' : 'جديد'}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3 pr-12 pl-4 outline-none text-sm font-bold shadow-inner"
            />
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((customer) => (
            <div key={customer.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 justify-end">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      customer.customerType === 'vip' ? 'bg-purple-50 text-purple-600' :
                      customer.customerType === 'loyal' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {customer.customerType === 'vip' ? 'VIP Customer' : customer.customerType === 'loyal' ? 'Loyal' : 'New'}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">إجمالي الإنفاق</span>
                        <DollarSign size={12} className="text-green-500" />
                      </div>
                      <span className="text-lg font-black text-gray-900">{customer.totalSpent.toLocaleString()} ج.م</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">عدد الطلبات</span>
                        <ShoppingBag size={12} className="text-blue-500" />
                      </div>
                      <span className="text-lg font-black text-gray-900">{customer.ordersCount} طلبيات</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 font-bold px-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>آخر طلب: {new Date(customer.lastOrderDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span dir="ltr">{customer.phone}</span>
                      <Phone size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 justify-center">
                  <a 
                    href={`https://wa.me/${customer.phone.replace(/^0/, '20')}`}
                    target="_blank"
                    className="p-4 rounded-2xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    title="مراسلة واتساب"
                  >
                    <MessageCircle size={20} />
                  </a>
                  <button className="p-4 rounded-2xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CRM;
