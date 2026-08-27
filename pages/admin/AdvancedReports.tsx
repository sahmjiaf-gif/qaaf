
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Download, Calendar, TrendingUp, Users, ShoppingBag, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AdvancedReports: React.FC = () => {
  const { orders, products, customers } = useApp();
  const [dateRange, setDateRange] = useState('7d');

  const stats = useMemo(() => {
    const days = dateRange === '7d' ? 7 : 30;
    const now = new Date();
    
    // Current period
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const currentOrders = orders.filter(o => 
      o.status !== 'cancelled' && new Date(o.date) >= currentStart
    );
    const currentSales = currentOrders.reduce((acc, o) => acc + (o.finalTotal || 0), 0);
    const currentAvg = currentSales / (currentOrders.length || 1);
    
    // Previous period (same length)
    const prevStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);
    const prevEnd = currentStart;
    const prevOrders = orders.filter(o => 
      o.status !== 'cancelled' && 
      new Date(o.date) >= prevStart && 
      new Date(o.date) < prevEnd
    );
    const prevSales = prevOrders.reduce((acc, o) => acc + (o.finalTotal || 0), 0);
    const prevAvg = prevSales / (prevOrders.length || 1);
    const prevCustomers = [...new Set(prevOrders.map(o => o.customerName))].length;
    
    // Calculate percentage changes
    const salesChange = prevSales !== 0 ? ((currentSales - prevSales) / prevSales) * 100 : 0;
    const avgChange = prevAvg !== 0 ? ((currentAvg - prevAvg) / prevAvg) * 100 : 0;
    const currentCustomers = [...new Set(currentOrders.map(o => o.customerName))].length;
    const customersChange = prevCustomers !== 0 ? ((currentCustomers - prevCustomers) / prevCustomers) * 100 : 0;
    
    return { 
      totalSales: currentSales, 
      avgOrder: currentAvg, 
      totalCustomers: currentCustomers,
      salesChange: Math.round(salesChange),
      avgChange: Math.round(avgChange),
      customersChange: Math.round(customersChange)
    };
  }, [orders, dateRange]);

  const salesData = useMemo(() => {
    const days = dateRange === '7d' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => o.status !== 'cancelled' && o.date.startsWith(dateStr));
      return {
        name: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
        sales: dayOrders.reduce((acc, o) => acc + (o.finalTotal || 0), 0),
        count: dayOrders.length
      };
    });
  }, [orders, dateRange]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      o.products.forEach(p => {
        const cat = p.product.category || 'عام';
        categories[cat] = (categories[cat] || 0) + (p.product.price * p.quantity);
      });
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Revenue Forecast (Linear trend)
  const forecastData = useMemo(() => {
    try {
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (14 - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          dateObj: date
        };
      });

      // Calculate actual sales for last 14 days
      const actualData = last14Days.map(({ date, dateObj }) => {
        const dayOrders = orders.filter(o => o.status !== 'cancelled' && o.date.startsWith(date));
        const sales = dayOrders.reduce((acc, o) => acc + (o.finalTotal || 0), 0);
        return {
          name: dateObj.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
          actual: sales,
          forecast: null,
          isPast: true
        };
      });

      // Calculate linear trend for forecast
      const salesValues = actualData.map(d => d.actual).filter(v => v > 0);
      const avgSales = salesValues.length > 0 ? salesValues.reduce((a, b) => a + b, 0) / salesValues.length : 0;
      const trend = salesValues.length > 1 ? (salesValues[salesValues.length - 1] - salesValues[0]) / salesValues.length : 0;

      // Add 7 forecast days
      const nextDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        const forecastValue = avgSales + (trend * (actualData.length + i + 1));
        return {
          name: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
          actual: null,
          forecast: Math.max(0, forecastValue),
          isPast: false
        };
      });

      return [...actualData, ...nextDays];
    } catch {
      return [];
    }
  }, [orders]);

  const COLORS = ['#92400e', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className={`p-4 rounded-2xl`} style={{ backgroundColor: `${color}10`, color }}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-3xl font-black text-gray-900">{value}</h4>
      </div>
    </div>
  );

  return (
    <AdminLayout title="التقارير المتقدمة">
      <div className="space-y-8" dir="rtl">
        {/* Header and Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="text-right">
            <h3 className="text-2xl font-black text-gray-900">تحليلات الأداء</h3>
            <p className="text-sm text-gray-400">متابعة شاملة لنمو متجرك وتفاعل العملاء</p>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button onClick={() => setDateRange('7d')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${dateRange === '7d' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>آخر 7 أيام</button>
            <button onClick={() => setDateRange('30d')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${dateRange === '30d' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>آخر 30 يوم</button>
            <button className="px-4 py-2.5 text-gray-300 hover:text-gray-500 transition-colors"><Calendar size={20} /></button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard title="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ج.م`} change={stats.salesChange} icon={TrendingUp} color="#92400e" />
          <StatCard title="متوسط قيمة الطلب" value={`${Math.round(stats.avgOrder).toLocaleString()} ج.م`} change={stats.avgChange} icon={ShoppingBag} color="#3b82f6" />
          <StatCard title="العملاء النشطون" value={stats.totalCustomers} change={stats.customersChange} icon={Users} color="#10b981" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Area Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">منحنى المبيعات</h4>
              <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><Download size={18} className="text-gray-400" /></button>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#92400e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#92400e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="#92400e" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Pie Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <h4 className="text-lg font-bold text-gray-900">تحليل الفئات</h4>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs font-bold text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-gray-900">{Math.round((item.value / stats.totalSales) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Forecast */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-gray-900">توقع المبيعات (14 يوم + 7 أيام مستقبلية)</h4>
              <p className="text-sm text-gray-400 mt-1">بناءً على معدل النمو الحالي</p>
            </div>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} name="المبيعات الفعلية" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#f59e0b', r: 4 }} name="التوقع" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-right p-4 bg-blue-50 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">متوسط المبيعات الفعلية</p>
              <h4 className="text-xl font-black text-gray-900">
                {forecastData
                  .filter(d => d.actual)
                  .reduce((acc, d) => acc + (d.actual || 0), 0) / Math.max(1, forecastData.filter(d => d.actual).length) | 0
                  .toLocaleString()} ج.م
              </h4>
            </div>
            <div className="text-right p-4 bg-amber-50 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">متوسط التوقع</p>
              <h4 className="text-xl font-black text-gray-900">
                {forecastData
                  .filter(d => d.forecast)
                  .reduce((acc, d) => acc + (d.forecast || 0), 0) / Math.max(1, forecastData.filter(d => d.forecast).length) | 0
                  .toLocaleString()} ج.م
              </h4>
            </div>
            <div className="text-right p-4 bg-green-50 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">الاتجاه العام</p>
              <h4 className="text-xl font-black text-green-600 flex items-center gap-2 justify-end">
                <ArrowUpRight size={18} />
                نمو متوقع
              </h4>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdvancedReports;
