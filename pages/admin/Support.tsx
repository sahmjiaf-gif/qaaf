import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { SupportTicket } from '../../types';
import { MessageCircle, Phone, User, Image as ImageIcon, CheckCircle2, Clock3, Sparkles, Send, UserCheck, Search, AlertCircle } from 'lucide-react';

const SupportPage: React.FC = () => {
  const { supportTickets, staff, assignSupportTicket, resolveSupportTicket, closeSupportTicket, addSupportMessage, findPendingOrderMatch } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'waiting' | 'assigned' | 'resolved'>('all');

  const filtered = useMemo(() => {
    const list = supportTickets || [];
    return list.filter(ticket => {
      const matchesText = !search || ticket.customerName.toLowerCase().includes(search.toLowerCase()) || ticket.phone.includes(search) || ticket.message.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [supportTickets, search, statusFilter]);

  useEffect(() => {
    if (!selected && filtered.length > 0) {
      setSelected(filtered[0]);
    }
  }, [filtered, selected]);

  const handleAutoAssign = async (ticket: SupportTicket) => {
    const available = staff.filter(s => s.isOnline && (s.permissions.includes('support' as any) || s.permissions.includes('orders' as any) || s.permissions.includes('consultations' as any)));
    if (!available.length) return;
    const leastLoaded = [...available].sort((a, b) => {
      const countA = (supportTickets || []).filter(t => t.assignedStaffId === a.id && t.status !== 'resolved').length;
      const countB = (supportTickets || []).filter(t => t.assignedStaffId === b.id && t.status !== 'resolved').length;
      return countA - countB;
    })[0];

    await assignSupportTicket(ticket.id, leastLoaded.id);
    if (selected?.id === ticket.id) {
      setSelected({ ...ticket, assignedStaffId: leastLoaded.id, status: 'assigned' });
    }
  };

  const handleSendReply = async () => {
    if (!selected || !reply.trim() || selected.isClosed) return;
    await addSupportMessage(selected.id, { sender: 'agent', text: reply.trim() });
    setReply('');
    await assignSupportTicket(selected.id, selected.assignedStaffId || staff[0]?.id || '');
  };

  const handleResolve = async () => {
    if (!selected) return;
    await resolveSupportTicket(selected.id, 'تم حل المشكلة بنجاح');
  };

  const handleCloseChat = async () => {
    if (!selected) return;
    await closeSupportTicket(selected.id, 'agent', 'تم إغلاق المحادثة من الموظف.');
    setSelected({ ...selected, isClosed: true, isOpen: false, status: 'resolved', closedBy: 'agent' });
  };

  return (
    <AdminLayout title="خدمة العملاء">
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'waiting', 'assigned', 'resolved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${statusFilter === filter ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                {filter === 'all' ? 'الكل' : filter === 'new' ? 'جديدة' : filter === 'waiting' ? 'بانتظار الرد' : filter === 'assigned' ? 'تمت الإحالة' : 'تمت'}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3 pr-12 pl-4 outline-none text-sm font-bold"
              placeholder="ابحث بالاسم أو الرقم أو الرسالة..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">التذاكر</h3>
              </div>
              <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">{filtered.length}</span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {filtered.map((ticket) => {
                const isSelected = selected?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelected(ticket)}
                    className={`w-full text-right p-4 transition ${isSelected ? 'bg-slate-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f5efe7] text-[#8a6430] flex items-center justify-center">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{ticket.customerName}</p>
                          <p className="text-xs text-gray-400">{ticket.phone}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : ticket.status === 'assigned' ? 'bg-blue-100 text-blue-700' : ticket.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {ticket.status === 'resolved' ? 'مغلق' : ticket.status === 'assigned' ? 'مُحال' : ticket.status === 'waiting' ? 'بانتظار' : 'جديد'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{ticket.message}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                      <span>{new Date(ticket.createdAt).toLocaleString('ar-EG')}</span>
                      <span>{ticket.orderMatch === 'matched' ? 'مطابق لطلب' : ticket.orderMatch === 'pending' ? 'قيد الانتظار' : 'لا يوجد طلب'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            {selected ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">التذكرة</p>
                    <h3 className="mt-1 text-2xl font-black text-gray-900">{selected.customerName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAutoAssign(selected)} className="bg-slate-900 text-white text-xs font-bold rounded-xl px-4 py-2">تعيين موظف</button>
                    {!selected.isClosed ? (
                      <button onClick={handleCloseChat} className="bg-red-600 text-white text-xs font-bold rounded-xl px-4 py-2">إغلاق المحادثة</button>
                    ) : (
                      <button onClick={handleResolve} className="bg-green-600 text-white text-xs font-bold rounded-xl px-4 py-2">تم الإغلاق</button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone size={16} />
                      <span className="text-[10px] font-bold uppercase">الهاتف</span>
                    </div>
                    <p className="mt-2 font-black text-gray-900">{selected.phone}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <UserCheck size={16} />
                      <span className="text-[10px] font-bold uppercase">الموظف</span>
                    </div>
                    <p className="mt-2 font-black text-gray-900">{selected.assignedStaffId ? (staff.find(s => s.id === selected.assignedStaffId)?.username || 'غير محدد') : 'غير محدد'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-bold uppercase">حالة الطلب</span>
                    </div>
                    <p className="mt-2 font-black text-gray-900">{selected.orderMatch === 'matched' ? 'تمت المطابقة' : selected.orderMatch === 'pending' ? 'في انتظار' : 'لا يوجد طلب'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-xs font-bold text-slate-600">حالة المحادثة</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${selected.isClosed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {selected.isClosed ? 'مغلقة' : 'مفتوحة'}
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-right">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">رسالة العميل</span>
                  </div>
                  <p className="font-bold text-amber-900">{selected.message}</p>
                  {selected.imageUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100 bg-white">
                      <img src={selected.imageUrl} alt="Customer transfer" className="max-h-[300px] w-full object-contain" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                  {(selected.messages || []).map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === 'customer' ? 'bg-slate-100 text-slate-900' : msg.sender === 'agent' ? 'bg-[#f4ebdd] text-[#473721]' : 'bg-green-100 text-green-700'}`}>
                        <p className="text-sm font-bold whitespace-pre-wrap">{msg.text}</p>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="message attachment" className="mt-3 max-h-[180px] rounded-xl object-contain" />
                        )}
                        <div className="mt-2 text-[10px] opacity-70">{new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} disabled={selected.isClosed} className="w-full rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm font-bold resize-none outline-none focus:border-slate-300 disabled:opacity-60" placeholder={selected.isClosed ? 'تم إغلاق المحادثة، لا يمكن إرسال رسالة جديدة' : 'اكتب رد الموظف هنا...'} />
                  <button onClick={handleSendReply} disabled={selected.isClosed} className="w-full bg-slate-900 text-white rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"><Send size={16} /> إرسال</button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle size={42} className="mx-auto mb-3" />
                  <p className="font-bold">لا توجد تذاكر</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SupportPage;
