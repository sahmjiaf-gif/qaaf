import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Search, Phone, User, Wallet, Image as ImageIcon, Clock3, CalendarDays, ShieldCheck, Copy, Trash2 } from 'lucide-react';

interface ShippingProofRecord {
  id: string;
  customerName: string;
  phone: string;
  senderPhone: string;
  amount: number;
  orderId?: string;
  smsText?: string;
  imageUrl?: string;
  createdAt: string;
  status: 'pending' | 'confirmed';
  note?: string;
}

const ShippingProofs: React.FC = () => {
  const { orders, updateOrderStatus, currentStaff } = useApp();
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<ShippingProofRecord[]>([]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!query) return sorted;
    return sorted.filter(record =>
      record.customerName.toLowerCase().includes(query) ||
      record.phone.includes(query) ||
      record.senderPhone.includes(query) ||
      (record.orderId || '').toLowerCase().includes(query)
    );
  }, [records, search]);

  const confirmProof = async (record: ShippingProofRecord) => {
    if (!record.orderId) return;
    const matchedOrder = orders.find(order => order.id === record.orderId || order.id === record.id);
    if (matchedOrder) {
      await updateOrderStatus(matchedOrder.id, 'approved', {
        paymentStatus: 'confirmed',
        shippingFeePaid: true,
        paymentSenderPhone: record.senderPhone,
        shippingPaymentNote: record.smsText || record.note || 'تم تأكيد الدفع'
      });
    }
  };

  const deleteProof = (id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isPM = d.getHours() >= 12 ? 'مساءً' : 'صباحاً';
    return `${date} - ${time} ${isPM}`;
  };

  return (
    <AdminLayout title="إثبات الدفع">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">إثبات الدفع للشحن</h3>
              <p className="text-sm text-gray-400">جميع تحويلات مبلغ الشحن، مرتبة بالأحدث أولاً</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-12 pl-4 outline-none focus:border-amber-500 text-sm"
              placeholder="بحث برقم الهاتف أو الاسم أو رقم الطلب"
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-gray-400 text-sm">
              لا توجد طلبات إثبات دفع حتى الآن.
            </div>
          ) : filtered.map(record => (
            <div key={record.id} className="border border-gray-100 rounded-2xl p-5 bg-gray-50/60">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-3 text-right">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                    <User size={16} className="text-gray-400" />
                    <span>{record.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>{record.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Wallet size={16} className="text-gray-400" />
                    <span>{record.amount} ج.م</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShieldCheck size={16} className="text-gray-400" />
                    <span>الرقم المرسل منه: {record.senderPhone}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 text-xs font-bold text-gray-700">
                    <CalendarDays size={14} className="text-gray-400" />
                    <span>{formatDateTime(record.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 text-xs font-bold text-gray-700">
                    <Clock3 size={14} className="text-gray-400" />
                    <span>{record.status === 'confirmed' ? 'تم التأكيد' : 'بانتظار التأكيد'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white p-4 border border-gray-200 text-right">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">نص رسالة SMS</p>
                <p className="text-sm text-gray-700 leading-7">{record.smsText || 'لا توجد رسالة مسجلة'}</p>
              </div>

              {record.imageUrl ? (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-white p-2">
                  <img src={record.imageUrl} alt="إثبات الدفع" className="w-full max-h-72 object-contain rounded-lg" />
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-400">
                  <ImageIcon size={16} />
                  لا يوجد صورة إثبات
                </div>
              )}

              <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Copy size={14} className="text-gray-400" />
                  <span>رقم الطلب: {record.orderId || 'غير مرتبط'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => confirmProof(record)}
                    className={`px-5 py-3 rounded-xl text-sm font-black transition ${
                      record.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-900 text-white hover:bg-black'
                    }`}
                  >
                    {record.status === 'confirmed' ? 'تم التأكيد' : 'تأكيد الدفع'}
                  </button>

                  {!currentStaff && (
                    <button
                      type="button"
                      onClick={() => deleteProof(record.id)}
                      className="p-3 rounded-xl text-red-600 hover:bg-red-50 transition"
                      title="حذف طلب إثبات الدفع"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShippingProofs;
