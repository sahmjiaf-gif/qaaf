
import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Package, Search, AlertTriangle, ArrowRightLeft, MapPin, Plus, TrendingDown } from 'lucide-react';

const Inventory: React.FC = () => {
  const { products, updateProductStock } = useApp();
  const [search, setSearch] = useState('');

  const lowStockProducts = products.filter(p => p.stock < 5);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
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
    <AdminLayout title="إدارة المخزون">
      <div className="space-y-8" dir="rtl">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="إجمالي القطع" value={products.reduce((acc, p) => acc + (p.stock || 0), 0)} color="#3b82f6" icon={Package} />
          <StatCard title="منتجات قاربت للنفاذ" value={lowStockProducts.length} color="#ef4444" icon={AlertTriangle} />
          <StatCard title="قيمة المخزون" value={`${products.reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0).toLocaleString()} ج.م`} color="#10b981" icon={TrendingDown} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن منتج بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3 pr-12 pl-4 outline-none text-sm font-bold shadow-inner"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">المنتج</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">الفئة</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">المخزون الحالي</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">المحجوز</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4 justify-end">
                      <span className="font-bold text-gray-900">{product.name}</span>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        {product.image && <img src={product.image} className="w-full h-full object-cover" />}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">{product.category}</span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => updateProductStock(product.id, { stock: Math.max(0, (product.stock || 0) - 1) })}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-black shrink-0"
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        value={product.stock || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateProductStock(product.id, { stock: Math.max(0, val) });
                        }}
                        className={`w-16 text-center text-lg font-black bg-transparent outline-none border-b-2 border-transparent focus:border-gray-300 transition-colors ${
                          (product.stock || 0) < 5 ? 'text-red-500' : 'text-gray-900'
                        }`}
                        min="0"
                      />
                      <button 
                        onClick={() => updateProductStock(product.id, { stock: (product.stock || 0) + 1 })}
                        className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all font-black shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">{product.reserved || 0}</span>
                  </td>
                  <td className="px-8 py-4 text-center text-gray-300">
                    -
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Inventory;
