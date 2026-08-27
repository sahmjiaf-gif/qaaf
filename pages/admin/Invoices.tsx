
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  Search, 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock,
  FileSpreadsheet,
  Calendar,
  ChevronDown
} from 'lucide-react';
import Invoice from '../../components/Invoice';
import * as XLSX from 'xlsx';

const Invoices: React.FC = () => {
  const { orders } = useApp();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filterRange, setFilterRange] = useState<'all' | 'weekly' | 'monthly'>('all');

  const filtered = useMemo(() => {
    let base = (orders || []).filter(o => 
      o.customerName.toLowerCase().includes(search.toLowerCase()) || 
      o.phoneNumber.includes(search) ||
      o.id.includes(search)
    );

    if (filterRange === 'weekly') {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      base = base.filter(o => new Date(o.date) >= weekAgo);
    } else if (filterRange === 'monthly') {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      base = base.filter(o => new Date(o.date) >= monthAgo);
    }

    return base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, search, filterRange]);

  const exportInvoicesToExcel = (type: 'weekly' | 'monthly' | 'filtered') => {
    let data = [...filtered];
    let fileName = 'الفواتير_المفلترة.xlsx';
    let sheetTitle = 'الفواتير المفلترة';

    if (type === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      data = (orders || []).filter(o => new Date(o.date) >= weekAgo)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      fileName = `الفواتير_الاسبوعية_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`;
      sheetTitle = 'تقرير الفواتير الأسبوعية';
    } else if (type === 'monthly') {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      data = (orders || []).filter(o => new Date(o.date) >= monthStart)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      fileName = `الفواتير_الشهرية_${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }).replace(/\s/g, '_')}.xlsx`;
      sheetTitle = 'تقرير الفواتير الشهرية';
    }

    // Build rows - one row per order with all details
    const exportData = data.map((o, index) => {
      const productsText = (o.products || []).map((p: any) =>
        `${p.product?.name || 'منتج'} × ${p.quantity}`
      ).join(' | ');

      const productsTotalCalc = (o.products || []).reduce((sum: number, p: any) => {
        const price = (p.product?.isOnSale && p.product?.salePrice) ? p.product.salePrice : (p.product?.price || 0);
        return sum + price * p.quantity;
      }, 0);

      const statusMap: Record<string, string> = {
        pending: 'معلق',
        approved: 'تمت الموافقة',
        shipped: 'جاري التوصيل',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي',
      };

      return {
        'م': index + 1,
        'رقم الطلب': o.id,
        'التاريخ': new Date(o.date).toLocaleDateString('ar-EG'),
        'الوقت': new Date(o.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        'اسم العميل': o.customerName || '',
        'رقم الهاتف': o.phoneNumber || '',
        'المحافظة': o.governorate || '',
        'المركز': o.city || '',
        'العنوان التفصيلي': o.address || '',
        'علامة مميزة': o.landmark || '',
        'المنتجات': productsText,
        'عدد المنتجات': (o.products || []).reduce((s: number, p: any) => s + (p.quantity || 1), 0),
        'سعر المنتجات': productsTotalCalc,
        'الخصم': o.discountAmount || 0,
        'كود الخصم': o.promoCode || '',
        'رسوم الشحن': o.shippingFee || 0,
        'الإجمالي (بدون شحن)': o.finalTotal || 0,
        'الإجمالي الكلي': (o.finalTotal || 0) + (o.shippingFee || 0),
        'الحالة': statusMap[o.status] || o.status,
      };
    });

    // Add summary row at the bottom
    const totalFinalTotal = data.reduce((s, o) => s + (o.finalTotal || 0), 0);
    const totalShipping = data.reduce((s, o) => s + (o.shippingFee || 0), 0);
    const totalDiscount = data.reduce((s, o) => s + (o.discountAmount || 0), 0);
    const totalGrand = totalFinalTotal + totalShipping;

    const summaryRow = {
      'م': '',
      'رقم الطلب': '--- الإجمالي ---',
      'التاريخ': '',
      'الوقت': '',
      'اسم العميل': `${data.length} طلب`,
      'رقم الهاتف': '',
      'المحافظة': '',
      'المركز': '',
      'العنوان التفصيلي': '',
      'علامة مميزة': '',
      'المنتجات': '',
      'عدد المنتجات': data.reduce((s, o) => s + (o.products || []).reduce((ss: number, p: any) => ss + (p.quantity || 1), 0), 0),
      'سعر المنتجات': totalFinalTotal + totalDiscount,
      'الخصم': totalDiscount,
      'كود الخصم': '',
      'رسوم الشحن': totalShipping,
      'الإجمالي (بدون شحن)': totalFinalTotal,
      'الإجمالي الكلي': totalGrand,
      'الحالة': '',
    };

    const ws = XLSX.utils.json_to_sheet([...exportData, summaryRow]);

    // Set column widths
    ws['!cols'] = [
      { wch: 4 },   // م
      { wch: 14 },  // رقم الطلب
      { wch: 12 },  // التاريخ
      { wch: 8 },   // الوقت
      { wch: 18 },  // اسم العميل
      { wch: 14 },  // رقم الهاتف
      { wch: 12 },  // المحافظة
      { wch: 12 },  // المركز
      { wch: 25 },  // العنوان
      { wch: 15 },  // علامة مميزة
      { wch: 40 },  // المنتجات
      { wch: 10 },  // عدد المنتجات
      { wch: 14 },  // سعر المنتجات
      { wch: 10 },  // الخصم
      { wch: 12 },  // كود الخصم
      { wch: 12 },  // رسوم الشحن
      { wch: 16 },  // الإجمالي بدون شحن
      { wch: 14 },  // الإجمالي الكلي
      { wch: 14 },  // الحالة
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    XLSX.writeFile(wb, fileName);
  };

  return (
    <AdminLayout title="الفواتير والمستندات">
      <div className="space-y-6" dir="rtl">
        {/* Search and Advanced Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="space-y-1 text-right">
            <h3 className="text-xl font-bold text-gray-900">سجل الفواتير</h3>
            <p className="text-sm text-gray-400">إدارة وتحميل التقارير المالية</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة أو العميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full lg:w-64 bg-gray-50 border-none rounded-2xl py-3 pr-12 pl-4 outline-none text-sm font-bold shadow-inner"
              />
            </div>

            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button onClick={() => setFilterRange('all')} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${filterRange === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>الكل</button>
              <button onClick={() => setFilterRange('weekly')} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${filterRange === 'weekly' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>أسبوعي</button>
              <button onClick={() => setFilterRange('monthly')} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${filterRange === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>شهري</button>
            </div>

            <div className="flex gap-2">
               <button 
                onClick={() => exportInvoicesToExcel('weekly')}
                className="bg-green-50 text-green-600 px-4 py-2.5 rounded-xl font-bold text-[10px] flex items-center gap-2 hover:bg-green-600 hover:text-white transition shadow-sm border border-green-100"
               >
                 <FileSpreadsheet size={16} />
                 تصدير الأسبوع
               </button>
               <button 
                onClick={() => exportInvoicesToExcel('monthly')}
                className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl font-bold text-[10px] flex items-center gap-2 hover:bg-blue-600 hover:text-white transition shadow-sm border border-blue-100"
               >
                 <FileSpreadsheet size={16} />
                 تصدير الشهر
               </button>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">المعرف</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">العميلة</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">التاريخ</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">المبلغ</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-4">
                    <span className="font-mono font-bold text-gray-400 group-hover:text-black transition-colors">#{order.id.slice(-5)}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{order.customerName}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{order.phoneNumber}</div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="text-[10px] font-bold text-gray-500">{new Date(order.date).toLocaleDateString('ar-EG')}</span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="font-black text-gray-900">{(order.finalTotal || 0).toLocaleString()} ج.م</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase"
                       >
                         <Eye size={16} />
                         عرض الفاتورة
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 text-center space-y-4">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                 <FileText className="text-gray-200" size={32} />
               </div>
               <p className="text-gray-400 font-bold">لا توجد فواتير مطابقة لهذا البحث</p>
            </div>
          )}
        </div>

        {/* Invoice Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-12 overflow-y-auto">
            <div className="relative w-full max-w-[320px] animate-fade-in-up">
              <Invoice order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Invoices;
