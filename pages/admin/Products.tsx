
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  Plus, 
  Trash2, 
  Search, 
  Package, 
  ChevronRight, 
  ArrowRight, 
  Download, 
  FolderPlus,
  LayoutGrid,
  FileSpreadsheet,
  Check,
  X,
  Edit3,
  Image as ImageIcon,
  Upload,
  Info,
  Calendar
} from 'lucide-react';
import { Product, Category, Offer } from '../../types';
import * as XLSX from 'xlsx';

const Products: React.FC = () => {
  const { products, setProducts, deleteProduct, branding, setBranding } = useApp();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeView, setActiveView] = useState<'products' | 'offers'>('products');
  const [search, setSearch] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddOffer, setShowAddOffer] = useState(false);
  
  // Offer Form State
  const [offerForm, setOfferForm] = useState<Partial<Offer>>({
    productName: '',
    productType: '',
    productId: '',
    originalPrice: 0,
    salePrice: 0,
    image: '',
    expiryDate: '',
    isActive: true,
    stock: undefined
  });
  
  // Category Form State
  const [catForm, setCatForm] = useState<Partial<Category>>({
    name: '',
    description: '',
    image: '',
    type: 'skincare'
  });

  // Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    description: '',
    image: '',
    inStock: true,
    isOnSale: false,
    salePrice: 0,
    saleExpiry: '',
    sizes: [],
    colors: []
  });

  const categories = useMemo(() => branding.categories || [], [branding.categories]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchesCat = !activeCategory || p.categoryId === activeCategory.id || p.category === activeCategory.name;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, search]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = () => {
    if (catForm.name) {
      const newCat: Category = {
        id: Date.now().toString(),
        name: catForm.name,
        description: catForm.description || '',
        image: catForm.image || '',
        type: catForm.type || 'skincare'
      };
      setBranding({
        ...branding,
        categories: [...categories, newCat]
      });
      setShowAddCategory(false);
      setCatForm({ name: '', description: '', image: '', type: 'skincare' });
    }
  };

  const deleteCategory = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const catToDelete = categories.find(c => c.id === id);
    const catName = catToDelete?.name || 'هذا القسم';
    if (window.confirm(`هل أنت متأكد من حذف قسم "${catName}"؟`)) {
      const nextCategories = categories.filter(c => c.id !== id);
      setBranding({
        ...branding,
        categories: nextCategories
      });
      if (activeCategory?.id === id) {
        setActiveCategory(null);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.price) {
      const product: Product = {
        ...newProduct,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        category: activeCategory?.name || 'عام',
        categoryId: activeCategory?.id,
        inStock: newProduct.inStock ?? true,
        sizes: newProduct.sizes || [],
        colors: newProduct.colors || []
      } as Product;
      
      try {
        await setProducts(prev => [product, ...(prev || [])]);
        setShowAddProduct(false);
        setNewProduct({ name: '', price: 0, category: '', description: '', image: '', inStock: true, isOnSale: false, salePrice: 0, saleExpiry: '', sizes: [], colors: [] });
      } catch (err) {
        console.error("Error adding product:", err);
        alert('حدث خطأ أثناء الإضافة. التأكد من الاتصال أو محاولة إعادة التحميل.');
      }
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredProducts.map(p => ({
      'اسم المنتج': p.name,
      'السعر': p.price,
      'القسم': p.category,
      'الحالة': p.inStock ? 'متوفر' : 'غير متوفر',
      'الوصف': p.description,
      'المقاسات': p.sizes?.join(', ') || '',
      'الألوان': p.colors?.join(', ') || '',
      'رابط الصورة': p.image || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');
    XLSX.writeFile(wb, `منتجات_${activeCategory?.name || 'الكل'}.xlsx`);
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const toAdd: Product[] = [];
        for (const row of data as any[]) {
          if (!row['اسم المنتج'] || !row['السعر']) continue;

          const newProd: Product = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: row['اسم المنتج'],
            price: Number(row['السعر']) || 0,
            category: row['القسم'] || activeCategory?.name || 'عام',
            categoryId: activeCategory?.id,
            inStock: row['الحالة'] !== 'غير متوفر',
            description: row['الوصف'] || '',
            sizes: row['المقاسات'] ? row['المقاسات'].toString().split(',').map((s: string) => s.trim()).filter((s: string) => s) : [],
            colors: row['الألوان'] ? row['الألوان'].toString().split(',').map((s: string) => s.trim()).filter((s: string) => s) : [],
            image: row['رابط الصورة'] || '',
            isOnSale: false
          } as Product;
          toAdd.push(newProd);
        }
        if (toAdd.length > 0) {
          await setProducts(prev => [...toAdd, ...(prev || [])]);
        }
        alert(`تم استيراد ${toAdd.length} منتج بنجاح!`);
      } catch (err) {
        console.error("Error importing:", err);
        alert('حدث خطأ أثناء استيراد الملف. تأكد من صحة الصيغة.');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };
  const handleAddOffer = () => {
    if (offerForm.productName && offerForm.expiryDate) {
      const newOffer: Offer = {
        id: Date.now().toString(),
        productName: offerForm.productName!,
        productType: offerForm.productType || '',
        productId: offerForm.productId,
        originalPrice: offerForm.originalPrice || 0,
        salePrice: offerForm.salePrice || 0,
        image: offerForm.image || '',
        expiryDate: offerForm.expiryDate!,
        isActive: true,
        stock: offerForm.stock
      };
      setBranding({
        ...branding,
        offers: [...(branding.offers || []), newOffer]
      });
      setShowAddOffer(false);
      setOfferForm({ productName: '', productType: '', image: '', expiryDate: '', isActive: true, stock: undefined });
    }
  };

  const deleteOffer = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      setBranding({
        ...branding,
        offers: (branding.offers || []).filter(o => o.id !== id)
      });
    }
  };

  return (
    <AdminLayout title="إدارة الأقسام والمنتجات">
      <div className="space-y-8" dir="rtl">
        {/* Toggle Switch */}
        <div className="flex gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto">
          <button 
            onClick={() => setActiveView('products')}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeView === 'products' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            إدارة المنتجات والأقسام
          </button>
          <button 
            onClick={() => setActiveView('offers')}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeView === 'offers' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            إدارة العروض الخاصة
          </button>
        </div>

        {activeView === 'products' ? (
          <>
        {/* Header Section */}
        {activeCategory ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveCategory(null)}
                className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition text-gray-400"
              >
                <ArrowRight size={24} />
              </button>
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                    {activeCategory.image ? <img src={activeCategory.image} className="w-full h-full object-cover" /> : <LayoutGrid size={24} className="m-auto text-gray-300" />}
                 </div>
                 <div className="text-right">
                    <h3 className="text-2xl font-black text-gray-900">{activeCategory.name}</h3>
                    <p className="text-sm text-gray-400 font-medium">{activeCategory.description || 'لا يوجد وصف لهذا القسم'}</p>
                 </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <button 
                 onClick={() => deleteCategory(activeCategory.id)} 
                 className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm"
                 title="حذف هذا القسم"
               >
                 <Trash2 size={18} />
                 حذف القسم
               </button>
               <label className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                 <Upload size={18} />
                 استيراد
                 <input type="file" accept=".xlsx, .xls" className="hidden" onChange={importFromExcel} />
               </label>
               <button onClick={exportToExcel} className="bg-green-50 text-green-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-600 hover:text-white transition">
                 <FileSpreadsheet size={18} />
                 تصدير
               </button>
               <button onClick={() => setShowAddProduct(true)} className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl">
                 <Plus size={18} />
                 إضافة منتج للقسم
               </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="text-right">
                <h3 className="text-2xl font-black text-gray-900">أقسام المتجر الرئيسية</h3>
                <p className="text-sm text-gray-400 font-medium">قومي بإدارة الأقسام وإضافة صور تعبيرية وأوصاف لكل قسم</p>
             </div>
             <div className="flex gap-3">
                <button onClick={exportToExcel} className="bg-green-50 text-green-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-600 hover:text-white transition">
                  <FileSpreadsheet size={18} />
                  تصدير الكل
                </button>
                <button onClick={() => setShowAddCategory(true)} className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl">
                  <FolderPlus size={18} />
                  إضافة قسم جديد
                </button>
             </div>
          </div>
        )}

        {/* Categories Grid */}
        {!activeCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => setActiveCategory(cat)}
                className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-700 group cursor-pointer relative"
              >
                <div className="aspect-[16/9] relative overflow-hidden bg-gray-50">
                  {cat.image ? (
                    <img src={cat.image} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={48} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 right-6 text-right">
                    <h4 className="text-2xl font-black text-white mb-1">{cat.name}</h4>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">
                      {(products || []).filter(p => p.categoryId === cat.id || p.category === cat.name).length} منتج متوفر
                    </p>
                  </div>
                  <button 
                    onClick={(e) => deleteCategory(cat.id, e)}
                    title="حذف هذا القسم"
                    className="absolute top-4 left-4 p-3 bg-red-600/80 backdrop-blur-md text-white hover:bg-red-600 hover:scale-110 transition-all rounded-2xl shadow-lg z-10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-8 space-y-4">
                  <p className="text-sm text-gray-400 font-medium line-clamp-2 leading-relaxed">{cat.description || 'لا يوجد وصف مضاف لهذا القسم حالياً...'}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest">إدارة المنتجات</span>
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                       <ChevronRight size={18} className="transition-transform group-hover:translate-x-[-2px]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full py-32 text-center space-y-4 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <LayoutGrid size={48} className="mx-auto text-gray-200" />
                <p className="text-gray-400 font-bold">لا توجد أقسام مضافة بعد، ابدأي بإنشاء أول قسم لبراند قاف</p>
              </div>
            )}
          </div>
        )}

        {/* Products Table/Grid View */}
        {activeCategory && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative max-w-md w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="ابحث عن منتج داخل هذا القسم..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-black transition shadow-sm text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-700">
                      <div className="aspect-square relative overflow-hidden bg-gray-50">
                        <img src={product.image} className={`w-full h-full object-cover transition duration-1000 group-hover:scale-110 ${!product.inStock ? 'grayscale opacity-60' : ''}`} />
                        {!product.inStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                             <span className="bg-white text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl">غير متوفر</span>
                          </div>
                        )}
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                          <p className="text-xl font-black text-amber-800">{product.price} <span className="text-[10px]">ج.م</span></p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                           <button onClick={() => deleteProduct(product.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={20} /></button>
                           <button 
                            onClick={() => {
                              const next = products.map(p => p.id === product.id ? { ...p, inStock: !p.inStock } : p);
                              setProducts(next);
                            }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${product.inStock ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                           >
                             {product.inStock ? <Check size={16} /> : <X size={16} />}
                             {product.inStock ? 'متوفر بالمخزن' : 'نفذ من المخزن'}
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 font-bold">لا توجد منتجات في هذا القسم حالياً</div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="text-right">
                <h3 className="text-2xl font-black text-gray-900">العروض الترويجية الحالية</h3>
                <p className="text-sm text-gray-400 font-medium">إدارة العروض التي تظهر بشريط "عرض خاص" وعداد تنازلي</p>
              </div>
              <button onClick={() => setShowAddOffer(true)} className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl">
                <Plus size={18} />
                إضافة عرض ترويجي جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(branding.offers || []).map(offer => (
                <div key={offer.id} className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-700 relative">
                  <div className="aspect-video relative overflow-hidden bg-gray-50">
                    <img src={offer.image} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" />
                    <div className="absolute top-4 right-[-35px] bg-amber-600 text-white px-10 py-1 rotate-45 text-[10px] font-black uppercase tracking-widest shadow-xl">
                      عرض خاص
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{offer.productName}</h4>
                        <p className="text-xs text-gray-400 font-bold">{offer.productType}</p>
                      </div>
                      <button onClick={() => deleteOffer(offer.id)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={18} /></button>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">الكمية المتاحة:</p>
                          <p className="text-sm font-black text-amber-900 flex items-center gap-2">
                             <Package size={14} />
                             {offer.stock !== undefined ? `${offer.stock} قطعة` : 'غير محدود'}
                          </p>
                       </div>
                       <div className="text-right border-r border-amber-200 pr-4">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">ينتهي في:</p>
                          <p className="text-sm font-black text-amber-900">{new Date(offer.expiryDate).toLocaleString('ar-EG', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</p>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {(branding.offers || []).length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">لا توجد عروض ترويجية نشطة حالياً</div>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        {showAddCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
               <div className="flex items-center justify-between mb-8">
                  <button onClick={() => setShowAddCategory(false)} className="text-gray-300 hover:text-black transition"><X size={24} /></button>
                  <h3 className="text-2xl font-black text-gray-900">إنشاء قسم جديد</h3>
               </div>
               <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">اسم القسم</label>
                    <input 
                      type="text" 
                      value={catForm.name}
                      onChange={(e) => setCatForm({...catForm, name: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right"
                      placeholder="مثلاً: منتجات البشرة الجافة"
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">وصف القسم</label>
                    <textarea 
                      value={catForm.description}
                      onChange={(e) => setCatForm({...catForm, description: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right resize-none"
                      rows={3}
                      placeholder="اكتبي نبذة عن المنتجات التي سيحتويها هذا القسم..."
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">صورة القسم التعبيرية</label>
                    <div className="flex items-center gap-4 justify-end">
                       <label className="flex-1 border-2 border-dashed border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group">
                          <Upload className="text-gray-300 mb-2 group-hover:text-black transition-colors" size={32} />
                          <span className="text-xs font-bold text-gray-400">ارفعي صورة مميزة للقسم</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => setCatForm({...catForm, image: b64}))} />
                       </label>
                       {catForm.image && (
                         <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                           <img src={catForm.image} className="w-full h-full object-cover" />
                         </div>
                       )}
                    </div>
                  </div>
                  <button 
                    onClick={handleAddCategory}
                    disabled={!catForm.name}
                    className="w-full py-5 bg-black text-white font-black rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
                  >
                    إنشاء القسم الآن
                  </button>
               </div>
            </div>
          </div>
        )}

        {showAddProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-8">
                 <button onClick={() => setShowAddProduct(false)} className="text-gray-300 hover:text-black transition"><X size={24} /></button>
                 <h3 className="text-2xl font-black text-gray-900">إضافة منتج لـ {activeCategory?.name}</h3>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">اسم المنتج</label>
                    <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">السعر (ج.م)</label>
                    <input 
                      type="number" 
                      required 
                      value={newProduct.price || ''} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProduct({...newProduct, price: val === '' ? 0 : Number(val)});
                      }} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" 
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">كمية المخزون الأولي</label>
                    <input 
                      type="number" 
                      value={newProduct.stock || 0} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProduct({...newProduct, stock: val === '' ? 0 : Number(val)});
                      }} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" 
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">وصف المنتج</label>
                  <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right resize-none" placeholder="اكتبي مميزات المنتج هنا..." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">المقاسات (افصل بينها بفاصلة)</label>
                    <input type="text" value={newProduct.sizes?.join(', ') || ''} onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="S, M, L, XL" />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">الألوان (افصل بينها بفاصلة)</label>
                    <input type="text" value={newProduct.colors?.join(', ') || ''} onChange={(e) => setNewProduct({...newProduct, colors: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="أحمر, أسود, أبيض" />
                  </div>
                </div>

                <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <button 
                      type="button"
                      onClick={() => setNewProduct({...newProduct, isOnSale: !newProduct.isOnSale})}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${newProduct.isOnSale ? 'bg-amber-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
                    >
                      {newProduct.isOnSale ? <Check size={16} /> : <div className="w-4 h-4 rounded-full border border-gray-200" />}
                      تفعيل كـ عرض (Sale)
                    </button>
                    <span className="text-xs font-bold text-amber-800">هل هذا المنتج عليه عرض مؤقت؟</span>
                  </div>

                  {newProduct.isOnSale && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top duration-300">
                      <div className="space-y-2 text-right">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">سعر العرض (ج.م)</label>
                        <input type="number" value={newProduct.salePrice || ''} onChange={(e) => setNewProduct({...newProduct, salePrice: Number(e.target.value)})} className="w-full bg-white border border-gray-200 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="مثلاً: 150" />
                      </div>
                        <div className="space-y-2 text-right">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">تاريخ انتهاء العرض</label>
                          <div className="relative bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-black transition-all cursor-pointer" onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input && 'showPicker' in input) input.showPicker();
                          }}>
                            <div className="flex items-center gap-3">
                              <Calendar size={18} className="text-amber-600" />
                              <span className="text-xs font-bold text-gray-700">
                                {newProduct.saleExpiry ? new Date(newProduct.saleExpiry).toLocaleString('ar-EG') : 'اضغط للاختيار من التقويم'}
                              </span>
                            </div>
                            <input 
                              type="datetime-local" 
                              value={newProduct.saleExpiry} 
                              onChange={(e) => setNewProduct({...newProduct, saleExpiry: e.target.value})} 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                            <div className="text-[9px] font-black bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                              اختيار التاريخ
                            </div>
                          </div>
                          <div className="flex gap-1 justify-end mt-1">
                            {[1, 3, 7].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const date = new Date();
                                  date.setDate(date.getDate() + d);
                                  setNewProduct({...newProduct, saleExpiry: date.toISOString().slice(0, 16)});
                                }}
                                className="px-2 py-1 bg-white border border-gray-100 text-[8px] font-bold text-amber-700 rounded-lg hover:bg-amber-50"
                              >
                                +{d === 1 ? '24 ساعة' : d + ' أيام'}
                              </button>
                            ))}
                          </div>
                        </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">صورة المنتج</label>
                  <div className="flex items-center gap-4 justify-end">
                     <label className="flex-1 border-2 border-dashed border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group">
                        <ImageIcon className="text-gray-300 mb-2 group-hover:text-black transition-colors" size={32} />
                        <span className="text-xs font-bold text-gray-400">ارفعي صورة المنتج</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => setNewProduct({...newProduct, image: b64}))} />
                     </label>
                     {newProduct.image && (
                       <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                         <img src={newProduct.image} className="w-full h-full object-cover" />
                       </div>
                     )}
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-black text-white font-black rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4">حفظ وإضافة المنتج</button>
              </form>
            </div>
          </div>
        )}

        {showAddOffer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
               <div className="flex items-center justify-between mb-8">
                  <button onClick={() => setShowAddOffer(false)} className="text-gray-300 hover:text-black transition"><X size={24} /></button>
                  <h3 className="text-2xl font-black text-gray-900">إضافة عرض خاص جديد</h3>
               </div>
               <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">ربط بمنتج موجود (اختياري)</label>
                    <select 
                      value={offerForm.productId} 
                      onChange={(e) => {
                        const pid = e.target.value;
                        const p = products.find(prod => prod.id === pid);
                        if (p) {
                          setOfferForm({
                            ...offerForm,
                            productId: pid,
                            productName: p.name,
                            originalPrice: p.price,
                            salePrice: p.salePrice || p.price,
                            image: p.image
                          });
                        } else {
                          setOfferForm({...offerForm, productId: pid});
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right appearance-none"
                    >
                      <option value="">-- اختاري منتجاً للربط السريع --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 text-right">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">اسم المنتج بالعرض</label>
                      <input type="text" value={offerForm.productName} onChange={(e) => setOfferForm({...offerForm, productName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="مثلاً: كريم قاف الليلي" />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">نوع المنتج</label>
                      <input type="text" value={offerForm.productType} onChange={(e) => setOfferForm({...offerForm, productType: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="مثلاً: عناية بالبشرة" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 text-right">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">السعر قبل العرض</label>
                      <input type="number" value={offerForm.originalPrice || ''} onChange={(e) => setOfferForm({...offerForm, originalPrice: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="مثلاً: 500" />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">السعر بعد العرض</label>
                      <input type="number" value={offerForm.salePrice || ''} onChange={(e) => setOfferForm({...offerForm, salePrice: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="مثلاً: 350" />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">كمية العرض (اختياري)</label>
                      <input type="number" value={offerForm.stock || ''} onChange={(e) => setOfferForm({...offerForm, stock: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:border-black transition font-bold text-right" placeholder="سيختفي العرض عند انتهاء الكمية" />
                    </div>
                  </div>
                   <div className="space-y-4 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">تاريخ انتهاء العرض</label>
                    <div className="relative bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center justify-between group hover:border-black transition-all cursor-pointer shadow-inner" onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input && 'showPicker' in input) input.showPicker();
                    }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                          <Calendar size={24} />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">التاريخ المحدد:</p>
                          <p className="text-sm font-black text-gray-800">
                            {offerForm.expiryDate ? new Date(offerForm.expiryDate).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' }) : 'لم يتم تحديد موعد بعد'}
                          </p>
                        </div>
                      </div>
                      <input 
                        type="datetime-local" 
                        value={offerForm.expiryDate} 
                        onChange={(e) => setOfferForm({...offerForm, expiryDate: e.target.value})} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      <div className="bg-black text-white px-6 py-3 rounded-xl text-xs font-bold hover:scale-105 transition-transform shadow-lg">
                        تغيير التاريخ
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      {[
                        { label: 'بعد 24 ساعة', days: 1 },
                        { label: 'بعد 3 أيام', days: 3 },
                        { label: 'بعد أسبوع', days: 7 }
                      ].map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const d = new Date();
                            d.setDate(d.getDate() + opt.days);
                            setOfferForm({...offerForm, expiryDate: d.toISOString().slice(0, 16)});
                          }}
                          className="px-4 py-2 bg-white border border-gray-100 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-black hover:text-white transition shadow-sm"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">صورة العرض</label>
                    <div className="flex items-center gap-4 justify-end">
                       <label className="flex-1 border-2 border-dashed border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group">
                          <Upload className="text-gray-300 mb-2 group-hover:text-black transition-colors" size={32} />
                          <span className="text-xs font-bold text-gray-400">ارفعي صورة العرض المميزة</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => setOfferForm({...offerForm, image: b64}))} />
                       </label>
                       {offerForm.image && (
                         <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                           <img src={offerForm.image} className="w-full h-full object-cover" />
                         </div>
                       )}
                    </div>
                  </div>
                  <button onClick={handleAddOffer} disabled={!offerForm.productName || !offerForm.expiryDate} className="w-full py-5 bg-amber-600 text-white font-black rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50">حفظ العرض الآن</button>
               </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Products;
