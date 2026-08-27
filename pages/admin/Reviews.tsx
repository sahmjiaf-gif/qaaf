import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, Plus } from 'lucide-react';
import { Review } from '../../types';

const Reviews: React.FC = () => {
  const { reviews, addReview, updateReview, deleteReview, currentStaff, adminAuth, language } = useApp();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'add'>('pending');
  const [newReview, setNewReview] = useState<Partial<Review>>({ rating: 5, customerName: '', comment: '' });

  const pendingReviews = reviews.filter(r => !r.isApproved);
  const approvedReviews = reviews.filter(r => r.isApproved);

  const handleApprove = async (id: string) => {
    try {
      await updateReview(id, { isApproved: true });
      alert('تم الموافقة على التقييم ونشره بنجاح! ✅');
    } catch (err: any) {
      alert('حدث خطأ أثناء الموافقة: ' + err.message);
    }
  };

  const handleHide = async (id: string) => {
    try {
      await updateReview(id, { isApproved: false });
      alert('تم إخفاء التقييم من الموقع 👁️‍🗨️');
    } catch (err: any) {
      alert('حدث خطأ أثناء الإخفاء: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
      try {
        await deleteReview(id);
      } catch (err: any) {
        alert('لا يمكن حذف التقييم: ' + err.message);
      }
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.customerName || !newReview.comment) {
      alert('يرجى إدخال اسم العميل والتعليق');
      return;
    }

    try {
      await addReview({
        id: Date.now().toString(),
        customerName: newReview.customerName,
        comment: newReview.comment,
        rating: newReview.rating || 5,
        date: new Date().toISOString(),
        isApproved: false, 
      });

      alert('تم إضافة التقييم بنجاح! الرجاء الموافقة عليه قبل النشر 📝');
      setNewReview({ rating: 5, customerName: '', comment: '' });
      setActiveTab('pending');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة التقييم. يرجى التأكد من اتصال الإنترنت.');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={14} className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout title="إدارة الآراء والتقييمات" icon={<MessageSquare />}>
      <div className="space-y-6">
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 pb-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Clock size={16} />
            بانتظار الموافقة ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'approved' ? 'bg-green-50 text-green-600 border border-green-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CheckCircle size={16} />
            الموافق عليها ({approvedReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 mr-auto ${activeTab === 'add' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Plus size={16} />
            إضافة تقييم يدوياً
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          
          {activeTab === 'add' && (
            <form onSubmit={handleAddReview} className="max-w-xl mx-auto space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">إضافة رأي عميل جديد</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">اسم العميل</label>
                <input
                  type="text"
                  required
                  value={newReview.customerName}
                  onChange={(e) => setNewReview({...newReview, customerName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-slate-900 transition"
                  placeholder="مثال: سارة أحمد"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">التقييم</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({...newReview, rating: star})}
                      className="p-2"
                    >
                      <Star size={32} className={star <= (newReview.rating || 0) ? 'text-amber-400 fill-amber-400 scale-110 transition' : 'text-gray-200 hover:text-amber-200 transition'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">نص الرأي / التعليق</label>
                <textarea
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 min-h-[120px] outline-none focus:border-slate-900 transition resize-none"
                  placeholder="اكتب تجربة العميل هنا..."
                />
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-lg flex justify-center items-center gap-2">
                <CheckCircle size={18} />
                نشر التقييم مباشرة
              </button>
            </form>
          )}

          {activeTab !== 'add' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(activeTab === 'pending' ? pendingReviews : approvedReviews).length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  لا توجد تقييمات في هذه القائمة حالياً
                </div>
              ) : (
                (activeTab === 'pending' ? pendingReviews : approvedReviews).map(review => (
                  <div key={review.id} className="p-6 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{review.customerName}</h4>
                          <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('ar-EG')}</p>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed italic">"{review.comment}"</p>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200/60">
                      {activeTab === 'pending' ? (
                        <button onClick={() => handleApprove(review.id)} className="flex-1 bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600 transition flex items-center justify-center gap-2">
                          <CheckCircle size={14} /> موافقة ونشر
                        </button>
                      ) : (
                        <button onClick={() => handleHide(review.id)} className="flex-1 bg-amber-100 text-amber-700 font-bold py-2 rounded-lg text-xs hover:bg-amber-200 transition flex items-center justify-center gap-2">
                          <XCircle size={14} /> إخفاء من الموقع
                        </button>
                      )}
                      {activeTab === 'pending' && (
                        <button onClick={() => handleDelete(review.id)} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-100 transition">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

// Simple Clock Icon component for the tab
const Clock = ({size = 24}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default Reviews;
