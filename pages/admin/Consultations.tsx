
import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { MessageCircle, CheckCircle, Clock, Phone, User, Search, Send, ShieldCheck } from 'lucide-react';

const Consultations: React.FC = () => {
  const { consultations, updateConsultation } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [search, setSearch] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = consultations.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch = c.customerName.toLowerCase().includes(search.toLowerCase()) || c.customerPhone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const handleReply = async () => {
    if (!selectedConsultation || !replyText.trim()) return;
    setSending(true);
    try {
      await updateConsultation(selectedConsultation.id, {
        status: 'replied',
        reply: replyText,
        repliedAt: new Date().toISOString()
      });
      setSelectedConsultation(null);
      setReplyText('');
    } catch (e) {
      alert("Error sending reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout title="إدارة الاستشارات">
      <div className="space-y-6" dir="rtl">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['all', 'pending', 'replied'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {f === 'all' ? 'الكل' : f === 'pending' ? 'انتظار الرد' : 'تم الرد'}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الرقم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3 pr-12 pl-4 outline-none text-sm font-bold"
            />
          </div>
        </div>

        {/* Consultations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${c.status === 'replied' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  {c.status === 'replied' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {c.status === 'replied' ? 'تم الرد' : 'بانتظار الرد'}
                </div>
                <div className="text-[10px] text-gray-400 font-bold">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-gray-900">{c.customerName}</h4>
                    <p className="text-xs text-gray-400">{c.customerPhone}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 text-right">
                  <span className="text-[9px] font-bold text-gray-300 uppercase block mb-1">المشكلة / السؤال</span>
                  <p className="text-sm text-gray-600 font-bold line-clamp-3">{c.concern}</p>
                </div>

                {c.status === 'replied' && (
                  <div className="bg-blue-50/50 rounded-2xl p-4 text-right border border-blue-100">
                    <span className="text-[9px] font-bold text-blue-400 uppercase block mb-1">الرد الطبي</span>
                    <p className="text-sm text-blue-900 font-bold line-clamp-2">{c.reply}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedConsultation(c)}
                className={`mt-6 w-full py-3 rounded-2xl font-bold text-xs transition-all ${c.status === 'replied' ? 'bg-gray-50 text-gray-400 hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                {c.status === 'replied' ? 'تعديل الرد' : 'إرسال الرد الآن'}
              </button>
            </div>
          ))}
        </div>

        {/* Reply Modal */}
        {selectedConsultation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <button onClick={() => setSelectedConsultation(null)} className="text-gray-300 hover:text-gray-500">
                    <CheckCircle className="rotate-45" size={24} />
                  </button>
                  <h3 className="text-xl font-bold text-gray-900">الرد على الاستشارة</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-3xl">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">الاسم</span>
                    <span className="font-bold">{selectedConsultation.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">رقم الهاتف</span>
                    <span className="font-bold">{selectedConsultation.customerPhone}</span>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mr-2">وصف الحالة</span>
                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                    <p className="text-sm text-amber-900 font-bold leading-relaxed">{selectedConsultation.concern}</p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">الرد الطبي المخصص</span>
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-bold uppercase">معتمد طبياً</span>
                    </div>
                  </div>
                  <textarea
                    autoFocus
                    placeholder="اكتب ردك الطبي المخصص هنا..."
                    value={replyText || selectedConsultation.reply || ''}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full h-40 bg-gray-50 border-none rounded-3xl p-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="w-full h-16 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {sending ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                  إرسال الرد للعميلة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Consultations;
