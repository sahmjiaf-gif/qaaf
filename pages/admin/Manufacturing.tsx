
import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  Package, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { ManufacturingRequest, Product } from '../../types';

const Manufacturing: React.FC = () => {
  const { products, manufacturingRequests, setManufacturingRequests, currentStaff, adminAuth } = useApp();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [requestType, setRequestType] = useState<'existing' | 'new'>('existing');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewProductImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requestType === 'existing' && !selectedProduct) return;
    if (requestType === 'new' && !newProductName) return;

    const newRequest: ManufacturingRequest = {
      id: Date.now().toString(),
      productName: requestType === 'existing' ? selectedProduct!.name : newProductName,
      productImage: requestType === 'existing' ? selectedProduct!.image : newProductImage,
      quantity,
      type: requestType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requesterName: currentStaff?.username || adminAuth.username
    };

    setManufacturingRequests([newRequest, ...manufacturingRequests]);
    
    // Reset form
    setSelectedProduct(null);
    setNewProductName('');
    setNewProductImage('');
    setQuantity(1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setActiveTab('history');
  };

  const updateStatus = (id: string, status: ManufacturingRequest['status']) => {
    setManufacturingRequests(manufacturingRequests.map(req => 
      req.id === id ? { ...req, status } : req
    ));
  };

  const deleteRequest = (id: string) => {
    setRequestToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (requestToDelete) {
      setManufacturingRequests(manufacturingRequests.filter(req => req.id !== requestToDelete));
      setShowDeleteConfirm(false);
      setRequestToDelete(null);
    }
  };

  return (
    <AdminLayout title="إدارة تصنيع المنتجات">
      {showToast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-white shadow-2xl border border-green-100 rounded-2xl p-4 flex items-center gap-4 min-w-[280px]">
            <div className="bg-green-500 p-2 rounded-full text-white">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">تم إرسال طلب التصنيع بنجاح!</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8" dir="rtl">
        {/* Tabs */}
        <div className="flex gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'create' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            طلب تصنيع جديد
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            سجل الطلبات
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Form */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800">تفاصيل الطلب</h3>
                <p className="text-sm text-gray-400">اختر نوع المنتج والكمية المطلوبة للتصنيع.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRequestType('existing')}
                    className={`p-4 rounded-2xl border-2 transition text-right space-y-2 ${
                      requestType === 'existing' ? 'border-slate-900 bg-slate-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Package className={requestType === 'existing' ? 'text-slate-900' : 'text-gray-300'} />
                    <p className="font-bold text-sm">منتج موجود</p>
                    <p className="text-[10px] text-gray-400">اختر من المنتجات المعروضة حالياً</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('new')}
                    className={`p-4 rounded-2xl border-2 transition text-right space-y-2 ${
                      requestType === 'new' ? 'border-slate-900 bg-slate-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Plus className={requestType === 'new' ? 'text-slate-900' : 'text-gray-300'} />
                    <p className="font-bold text-sm">منتج جديد</p>
                    <p className="text-[10px] text-gray-400">إضافة منتج غير موجود بالموقع</p>
                  </button>
                </div>

                {requestType === 'existing' ? (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">اختر المنتج</label>
                      <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="ابحث عن منتج..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pr-12 pl-4 text-sm outline-none focus:border-slate-900 transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                        {filteredProducts.map(product => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 ${
                              selectedProduct?.id === product.id ? 'border-slate-900 bg-slate-50 shadow-md scale-105' : 'border-gray-50 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <img src={product.image} className="w-10 h-10 rounded-lg object-cover bg-white" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[10px] font-bold text-gray-800 truncate">{product.name}</span>
                              <span className="text-[8px] text-gray-400 truncate">{product.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">اسم المنتج الجديد</label>
                      <input
                        type="text"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-slate-900 transition"
                        placeholder="مثال: لوشن الجسم بزيت الأرجان"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">صورة المنتج (اختياري)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:bg-gray-50 hover:border-slate-900 hover:text-slate-900 transition cursor-pointer">
                          <ImageIcon size={20} />
                          <span className="text-xs font-bold">رفع صورة</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        {newProductImage && (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100">
                            <img src={newProductImage} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">الكمية المطلوبة</label>
                  <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 bg-transparent border-none text-center font-bold text-lg focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-amber-700 transition transform hover:scale-[1.02]"
                >
                  إرسال طلب التصنيع
                </button>
              </form>
            </div>

            {/* Preview Card */}
            <div className="hidden lg:block space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">معاينة الطلب</h3>
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نوع الطلب</p>
                    <p className="text-lg font-bold">{requestType === 'existing' ? 'تصنيع منتج حالي' : 'تصنيع منتج جديد'}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <Settings className="text-amber-400" />
                  </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-24 h-24 bg-white/10 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center">
                    {requestType === 'existing' ? (
                      selectedProduct ? <img src={selectedProduct.image} className="w-full h-full object-cover" /> : <Package size={32} className="text-white/20" />
                    ) : (
                      newProductImage ? <img src={newProductImage} className="w-full h-full object-cover" /> : <Plus size={32} className="text-white/20" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">
                      {requestType === 'existing' ? (selectedProduct?.name || 'اختر منتجاً') : (newProductName || 'اسم المنتج')}
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 font-bold">
                      <span className="text-amber-400">{quantity}</span>
                      <span className="text-xs">قطعة مطلوبة</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs">
                      {(currentStaff?.username || adminAuth.username).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-300">بواسطة: {currentStaff?.username || adminAuth.username}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">قيد الانتظار</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">تاريخ طلبات التصنيع</h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  قيد الانتظار
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  جاري العمل
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  مكتمل
                </div>
              </div>
            </div>

            {manufacturingRequests.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center space-y-4">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <Package size={40} />
                </div>
                <p className="text-gray-400 font-bold">لا توجد طلبات تصنيع سابقة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {manufacturingRequests.map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6 group relative">
                    <button 
                      onClick={() => deleteRequest(req.id)}
                      className="absolute top-4 left-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
                        {req.productImage ? (
                          <img src={req.productImage} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{req.productName}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                          <Clock size={12} />
                          <span>{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">الكمية</p>
                        <p className="text-lg font-bold text-slate-900">{req.quantity}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">النوع</p>
                        <p className="text-sm font-bold text-slate-900">{req.type === 'existing' ? 'منتج حالي' : 'منتج جديد'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">تحديث الحالة</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(req.id, 'pending')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${
                            req.status === 'pending' ? 'bg-amber-400 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          انتظار
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'in-progress')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${
                            req.status === 'in-progress' ? 'bg-blue-400 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          تنفيذ
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'completed')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${
                            req.status === 'completed' ? 'bg-green-400 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          اكتمل
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-[10px]">
                          {req.requesterName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">بواسطة: {req.requesterName}</span>
                      </div>
                      {req.status === 'completed' && <CheckCircle2 className="text-green-500" size={16} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-red-600 p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">تأكيد الحذف</h3>
                <p className="text-red-100 text-xs">لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-600 text-sm font-bold">هل أنت متأكد من حذف هذا الطلب نهائياً؟</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRequestToDelete(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Manufacturing;
