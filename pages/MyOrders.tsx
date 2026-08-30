import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../state';
import { translations } from '../translations';
import { ArrowRight, Search, Package, Clock, CheckCircle2, XCircle, Droplet, Phone, Globe, Menu, X, Truck, FileText, Printer, Download, ShieldCheck } from 'lucide-react';
import { OrderStatus, Order } from '../types';
import Invoice from '../components/Invoice';

const Logo = ({ className = "" }: { className?: string }) => {
  const { branding, language, theme } = useApp();
  const t = translations[language];

  if (branding?.logoImage) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-1.5">
          <img
            src={branding.logoImage}
            alt="QAAF Logo"
            style={{ width: `clamp(${(branding.logoSize || 100) * 0.7}px, 11vw, ${(branding.logoSize || 100) * 1.1}px)`, height: `clamp(${(branding.logoSize || 100) * 0.7}px, 11vw, ${(branding.logoSize || 100) * 1.1}px)` }}
            className="rounded-full object-cover block"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center leading-none ${className}`} style={{ fontFamily: theme.fontFamily }}>
      <div className="relative">
        <Droplet className="text-yellow-400 fill-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2" size={18} />
        <h1 className="text-3xl font-bold tracking-tight text-black pt-1">قاف</h1>
      </div>
      <span className="text-[7px] font-bold tracking-[0.3em] text-gray-400 mt-1 uppercase">{t.evidenceBased}</span>
    </div>
  );
};

const StatusBadge = ({ status, paymentStatus }: { status: OrderStatus; paymentStatus?: 'required' | 'pending' | 'confirmed' }) => {
  const { language, theme } = useApp();
  const t = translations[language];

  const getBorderRadius = () => {
    if (theme.borderRadius === 'none') return 'rounded-none';
    if (theme.borderRadius === 'sm') return 'rounded-sm';
    if (theme.borderRadius === 'md') return 'rounded-md';
    if (theme.borderRadius === 'lg') return 'rounded-full';
    if (theme.borderRadius === 'full') return 'rounded-full';
    return 'rounded-full';
  };

  const pendingLabel = paymentStatus === 'required' ? (language === 'ar' ? 'برجاء الدفع' : 'Please pay') : t.orderStatus.pending;

  switch (status) {
    case 'pending':
      return (
        <div className={`flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest ${getBorderRadius()}`}>
          <Clock size={12} />
          <span>{pendingLabel}</span>
        </div>
      );
    case 'approved':
      return (
        <div className={`flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest ${getBorderRadius()}`}>
          <CheckCircle2 size={12} />
          <span>{t.orderStatus.processing}</span>
        </div>
      );
    case 'shipped':
      return (
        <div className={`flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-widest ${getBorderRadius()}`}>
          <Truck size={12} />
          <span>{t.orderStatus.shipped}</span>
        </div>
      );
    case 'delivered':
      return (
        <div className={`flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest ${getBorderRadius()}`}>
          <CheckCircle2 size={12} />
          <span>{t.orderStatus.delivered}</span>
        </div>
      );
    case 'cancelled':
      return (
        <div className={`flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-widest ${getBorderRadius()}`}>
          <XCircle size={12} />
          <span>{t.orderStatus.cancelled}</span>
        </div>
      );
    default:
      return null;
  }
};
const MyOrders: React.FC = () => {
  const { orders, updateOrderStatus, branding, language, setLanguage, isTranslating, theme, initialLoading } = useApp();
  const t = translations[language];

  // State declarations first
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searched, setSearched] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingAction, setPendingAction] = useState<'print' | 'download' | undefined>(undefined);
  
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const phone = searchParams.get('phone');
    const cancelOrderId = searchParams.get('cancel');
    
    if (phone) {
      setPhoneSearch(phone);
      setSearched(true);
      
      if (cancelOrderId) {
        // Wait for orders to load from Firestore
        const matched = orders.find(o => o.id === cancelOrderId);
        if (matched) {
          if (matched.status === 'pending' || matched.status === 'approved') {
            setCancellingOrder(matched);
          }
        } else {
          // If orders haven't finished loading yet, try again in a moment
          const timer = setTimeout(() => {
            const retryMatched = orders.find(o => o.id === cancelOrderId);
            if (retryMatched && (retryMatched.status === 'pending' || retryMatched.status === 'approved')) {
              setCancellingOrder(retryMatched);
            }
          }, 1200);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [searchParams, orders]);

  const getBorderRadius = (type: 'card' | 'button' | 'input') => {
    if (theme.borderRadius === 'none') return 'rounded-none';
    if (theme.borderRadius === 'sm') return 'rounded-sm';
    if (theme.borderRadius === 'md') return 'rounded-md';
    if (theme.borderRadius === 'lg') return type === 'card' ? 'rounded-[2rem]' : 'rounded-2xl';
    if (theme.borderRadius === 'full') return 'rounded-full';
    return 'rounded-2xl';
  };

  const handleAction = (order: Order, action?: 'print' | 'download') => {
    setPendingAction(action);
    setSelectedOrder(order);
  };

  const filteredOrders = orders.filter(order => {
    if (!order || !order.phoneNumber || !phoneSearch) return false;
    const cleanOrder = order.phoneNumber.replace(/\D/g, '');
    const cleanSearch = phoneSearch.replace(/\D/g, '');
    return cleanOrder.slice(-10) === cleanSearch.slice(-10);
  }).sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneSearch.trim()) {
      setSearched(true);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    
    // Determine the exact cancellation reason
    let finalReason = '';
    if (cancellationReason === 'changed_mind') {
      finalReason = language === 'ar' ? 'غيرت رأيي / لم أعد بحاجة للمنتج' : 'Changed my mind / No longer need the product';
    } else if (cancellationReason === 'want_modify') {
      finalReason = language === 'ar' ? 'أريد تعديل الطلب (مقاس/لون/منتج آخر)' : 'Want to modify the order (size/color/other product)';
    } else if (cancellationReason === 'high_price') {
      finalReason = language === 'ar' ? 'السعر مرتفع جداً' : 'Price is too high';
    } else if (cancellationReason === 'long_delivery') {
      finalReason = language === 'ar' ? 'مدة التوصيل طويلة جداً' : 'Delivery time is too long';
    } else if (cancellationReason === 'other') {
      finalReason = otherReason.trim();
    }

    if (!finalReason) {
      alert(language === 'ar' ? 'يرجى تحديد أو كتابة سبب الإلغاء' : 'Please select or write a reason for cancellation');
      return;
    }

    // 1. Update order status to 'cancelled' with cancellation metadata
    await updateOrderStatus(cancellingOrder.id, 'cancelled', {
      cancelledByCustomer: true,
      cancellationReason: finalReason
    });

    // Reset state & alert user
    setCancellingOrder(null);
    setCancellationReason('');
    setOtherReason('');
    
    alert(language === 'ar' ? 'تم إلغاء طلبك بنجاح. شكراً لتفهمك!' : 'Your order has been cancelled successfully. Thank you for your understanding!');
  };

  return (
    <div style={{ fontFamily: theme.fontFamily, backgroundColor: theme.secondaryColor }} className="min-h-screen flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed w-full z-50 backdrop-blur-xl border-b border-gray-100" style={{ backgroundColor: `${theme.secondaryColor}CC` }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowRight size={24} className={`text-gray-700 ${language === 'en' ? 'rotate-180' : ''}`} style={{ color: theme.primaryColor }} />
            </Link>
          </div>
          <Logo className="scale-90 md:scale-100" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition md:hidden"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              disabled={isTranslating}
              className="hidden md:flex items-center gap-1 bg-gray-50 hover:bg-gray-100 transition px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-500 disabled:opacity-50"
            >
              <Globe size={12} className={isTranslating ? "animate-spin" : ""} />
              <span>{isTranslating ? (language === 'ar' ? 'Translating...' : 'جاري الترجمة...') : (language === 'ar' ? 'EN' : 'AR')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] flex justify-start md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className={`relative w-full max-w-[280px] bg-white h-full shadow-2xl flex flex-col animate-in ${language === 'ar' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-300`}>
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <Logo className="scale-75 origin-right" />
              <button onClick={() => setShowMobileMenu(false)} className="p-2.5 hover:bg-gray-100 rounded-full transition text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className={`flex flex-col gap-6 text-sm font-bold text-gray-500 tracking-wide uppercase ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <Link to="/" onClick={() => setShowMobileMenu(false)} className="hover:opacity-70 transition" style={{ color: theme.primaryColor }}>{t.home}</Link>
                <Link to="/" onClick={() => setShowMobileMenu(false)} className="hover:opacity-70 transition">{t.shop}</Link>
                <Link to="/my-orders" onClick={() => setShowMobileMenu(false)} className="hover:opacity-70 transition">{t.myOrders}</Link>
              </div>

              <div className="pt-8 border-t border-gray-50">
                <button
                  onClick={() => { setLanguage(language === 'ar' ? 'en' : 'ar'); setShowMobileMenu(false); }}
                  className={`flex items-center gap-3 w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-600 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Globe size={16} />
                  <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900" style={{ fontFamily: theme.fontFamily }}>{t.myOrders}</h1>
            <p className="text-gray-500 font-medium">{t.searchOrdersPrompt}</p>
          </div>

          {/* Search Form */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSearch} className="relative group">
              <div className={`absolute ${language === 'ar' ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:opacity-70 transition-colors`} style={{ color: theme.primaryColor }}>
                <Phone size={20} />
              </div>
              <input
                type="tel"
                placeholder={t.phonePlaceholder}
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className={`w-full bg-white border border-gray-100 py-6 ${language === 'ar' ? 'pr-16 pl-32' : 'pl-16 pr-32'} outline-none focus:ring-4 focus:ring-opacity-10 shadow-sm text-lg font-bold transition-all ${getBorderRadius('input')}`}
              />
              <button
                type="submit"
                className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 px-8 py-4 font-bold transition-all flex items-center gap-2 ${getBorderRadius('button')}`}
                style={{ backgroundColor: theme.primaryColor, color: theme.secondaryColor }}
              >
                <Search size={18} />
                <span>{t.search}</span>
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {searched ? (
              filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const hasProducts = order && order.products && order.products.length > 0;
                  const firstProduct = hasProducts ? order.products[0].product : null;
                  const orderDate = order.date ? new Date(order.date) : new Date();

                  return (
                    <div key={order.id} className={`bg-white p-8 shadow-sm border border-gray-50 hover:shadow-md transition-shadow ${getBorderRadius('card')}`}>
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className={`w-24 h-24 bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center ${getBorderRadius('card')}`}>
                          {firstProduct && firstProduct.image ? (
                            <img src={firstProduct.image} className="w-full h-full object-cover" alt={firstProduct.name} />
                          ) : (
                            <Package size={32} className="text-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className={`space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                              <div className="flex flex-col gap-1">
                                {hasProducts ? (
                                  order.products.map((item, idx) => (
                                    <h3 key={idx} className="text-lg font-bold text-gray-900" style={{ fontFamily: theme.fontFamily }}>
                                      {item.product.name} <span className="text-amber-700 text-xs"> (x{item.quantity}) </span>
                                    </h3>
                                  ))
                                ) : (
                                  <h3 className="text-xl font-bold text-gray-900">...</h3>
                                )}
                              </div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.orderNumber}: #{order.id}</p>
                            </div>
                            <StatusBadge status={order.status} paymentStatus={order.paymentStatus} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                            <div className={`flex items-center gap-3 text-gray-500 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse justify-end'}`}>
                              <Clock size={16} style={{ color: theme.primaryColor }} />
                              <span className="text-sm font-medium">
                                {orderDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className={`flex items-center gap-3 text-gray-500 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse justify-end'}`}>
                              <Droplet size={16} style={{ color: theme.primaryColor }} />
                              <span className="text-sm font-medium">
                                {order.finalTotal !== undefined ? order.finalTotal : (hasProducts ? firstProduct?.price || 0 : 0)} {t.egp}
                                {order.promoCode && (
                                  <span className="text-[10px] text-green-600 font-bold mr-2">
                                    ({t.discountApplied})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {(order.status === 'pending' || order.status === 'approved') && (
                            <div className="pt-4 flex flex-wrap justify-end gap-3">
                              <button
                                onClick={() => handleAction(order)}
                                className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors ${getBorderRadius('button')}`}
                              >
                                <FileText size={14} />
                                {t.view}
                              </button>
                              <button
                                onClick={() => handleAction(order, 'print')}
                                className={`flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors ${getBorderRadius('button')}`}
                              >
                                <Printer size={14} />
                                {t.print}
                              </button>
                              <button
                                onClick={() => handleAction(order, 'download')}
                                className={`flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors ${getBorderRadius('button')}`}
                              >
                                <Download size={14} />
                                {t.download}
                              </button>
                              <button
                                onClick={() => setCancellingOrder(order)}
                                className={`flex items-center gap-2 px-6 py-2 border border-red-100 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors ${getBorderRadius('button')}`}
                              >
                                <XCircle size={14} />
                                {t.cancelOrder}
                              </button>
                            </div>
                          )}
                          {(order.status === 'shipped' || order.status === 'delivered') && (
                            <div className="pt-4 flex flex-wrap justify-end gap-3">
                              <button
                                onClick={() => handleAction(order)}
                                className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors ${getBorderRadius('button')}`}
                              >
                                <FileText size={14} />
                                {t.view}
                              </button>
                              <button
                                onClick={() => handleAction(order, 'print')}
                                className={`flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors ${getBorderRadius('button')}`}
                              >
                                <Printer size={14} />
                                {t.print}
                              </button>
                              <button
                                onClick={() => handleAction(order, 'download')}
                                className={`flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors ${getBorderRadius('button')}`}
                              >
                                <Download size={14} />
                                {t.download}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`text-center py-20 bg-white border border-dashed border-gray-200 space-y-6 ${getBorderRadius('card')}`}>
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Package size={32} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-gray-900">{t.noOrders}</p>
                    <p className="text-gray-400 font-medium">{t.noOrdersFound}</p>
                  </div>
                  <Link to="/" className={`inline-block px-8 py-3 font-bold transition ${getBorderRadius('button')}`} style={{ backgroundColor: theme.primaryColor, color: theme.secondaryColor }}>
                    {t.shopNow}
                  </Link>
                </div>
              )
            ) : (
              <div className="text-center py-20 opacity-30">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <Search size={32} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: theme.secondaryColor }}>
        <div className={`max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 ${language === 'ar' ? 'text-right' : 'text-left'} border-t border-gray-100`}>
          <div className="space-y-8">
            <Logo className={language === 'ar' ? 'md:items-end' : 'md:items-start'} />
            <p className={`text-gray-400 leading-relaxed text-sm max-w-sm font-medium ${language === 'ar' ? 'mr-0' : 'ml-0'}`}>{t.footerDesc}</p>
          </div>
          <div className={`flex flex-col ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
            <div className={`mb-8 flex ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
              <Link to="/admin/login" className="p-4 rounded-full bg-gray-50 text-gray-300 hover:bg-amber-50 hover:text-amber-700 transition-all group" title={t.adminPanel}><ShieldCheck size={24} className="group-hover:scale-110" /></Link>
            </div>
          </div>
        </div>
        {/* Bottom Black Bar */}
        <div className="bg-black py-8">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[10px] md:text-xs text-white font-bold uppercase tracking-[0.4em] leading-relaxed">{t.allRightsReserved}</p>
          </div>
        </div>
      </footer>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="absolute inset-0" onClick={() => { setSelectedOrder(null); setPendingAction(undefined); }} />
          <div className="relative w-full max-w-lg z-10 animate-in zoom-in duration-300">
            <Invoice
              order={selectedOrder}
              onClose={() => { setSelectedOrder(null); setPendingAction(undefined); }}
              initialAction={pendingAction}
            />
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="absolute inset-0" onClick={() => { setCancellingOrder(null); setCancellationReason(''); setOtherReason(''); }} />
          <div className={`relative w-full max-w-md bg-white p-8 shadow-2xl border border-gray-100 z-10 animate-in zoom-in duration-300 ${getBorderRadius('card')}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            <button 
              onClick={() => { setCancellingOrder(null); setCancellationReason(''); setOtherReason(''); }} 
              className={`absolute ${language === 'ar' ? 'left-6' : 'right-6'} top-6 p-2 hover:bg-gray-100 rounded-full transition text-gray-400`}
            >
              <X size={18} />
            </button>

            <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: theme.fontFamily }}>
                  {language === 'ar' ? 'إلغاء الطلب ❌' : 'Cancel Order ❌'}
                </h3>
                <p className="text-gray-500 text-sm font-medium">
                  {language === 'ar' 
                    ? 'يؤسفنا إلغاء طلبك. يرجى إخبارنا بالسبب لمساعدتنا في تحسين خدماتنا:' 
                    : 'We are sorry to see you cancel. Please let us know the reason to help us improve:'}
                </p>
              </div>

              {/* Reasons list */}
              <div className="space-y-3">
                {[
                  { value: 'changed_mind', ar: 'غيرت رأيي / لم أعد بحاجة للمنتج', en: 'Changed my mind / No longer need the product' },
                  { value: 'want_modify', ar: 'أريد تعديل الطلب (مقاس/لون/منتج آخر)', en: 'Want to modify the order (size/color/other product)' },
                  { value: 'high_price', ar: 'السعر مرتفع جداً', en: 'Price is too high' },
                  { value: 'long_delivery', ar: 'مدة التوصيل طويلة جداً', en: 'Delivery time is too long' },
                  { value: 'other', ar: 'سبب آخر (يرجى توضيحه)', en: 'Other reason (please specify)' }
                ].map((opt) => (
                  <label 
                    key={opt.value} 
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-all ${
                      cancellationReason === opt.value 
                        ? 'border-red-500 bg-red-50/10' 
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="cancel_reason" 
                      value={opt.value}
                      checked={cancellationReason === opt.value}
                      onChange={() => setCancellationReason(opt.value)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-bold text-gray-700">
                      {language === 'ar' ? opt.ar : opt.en}
                    </span>
                  </label>
                ))}
              </div>

              {/* Other input text */}
              {cancellationReason === 'other' && (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder={language === 'ar' ? 'يرجى كتابة سبب الإلغاء بالتفصيل...' : 'Please specify the cancellation reason...'}
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className={`w-full p-4 border border-gray-200 outline-none focus:border-red-500 transition-colors text-sm font-medium ${getBorderRadius('input')}`}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmCancelOrder}
                  disabled={!cancellationReason || (cancellationReason === 'other' && !otherReason.trim())}
                  className={`flex-1 py-4 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 ${getBorderRadius('button')}`}
                >
                  {language === 'ar' ? 'تأكيد إلغاء الطلب' : 'Confirm Cancel Order'}
                </button>
                <button
                  onClick={() => { setCancellingOrder(null); setCancellationReason(''); setOtherReason(''); }}
                  className={`flex-1 py-4 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition ${getBorderRadius('button')}`}
                >
                  {language === 'ar' ? 'تراجع' : 'Go Back'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
