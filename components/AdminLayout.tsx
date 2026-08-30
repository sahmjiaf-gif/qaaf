import React, { useEffect, useState, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  Share2,
  Settings,
  LogOut,
  PackageSearch,
  Droplet,
  Ticket,
  Users,
  Printer,
  Wifi,
  WifiOff,
  Menu,
  X,
  Home,
  CheckCircle2,
  Send,
  Banknote,
  Clock,
  Volume2,
  BarChart3,
  UserCheck,
  Boxes,
  Stethoscope,
  MessageSquare,
  Truck,
  Bell,
  BellOff
} from 'lucide-react';
import { useApp } from '../state';

const Logo = ({ className = "" }: { className?: string }) => {
  const { branding } = useApp();

  if (branding?.logoImage) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.16)] p-1.5">
          <img
            src={branding.logoImage}
            alt="QAAF Logo"
            style={{ width: `${Math.max(72, (branding.logoSize || 100) * 0.9)}px`, height: `${Math.max(72, (branding.logoSize || 100) * 0.9)}px` }}
            className="rounded-full object-cover block"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center leading-none ${className}`}>
      <div className="flex flex-col items-center justify-center text-white select-none" style={{ background: '#36070a', padding: '0.5rem 1rem', minWidth: '180px' }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '2.6rem',
          lineHeight: 0.72,
          letterSpacing: '-0.12em',
          fontWeight: 400,
          color: '#f3efe9',
        }}>QAAF</div>
        <div style={{
          fontFamily: 'Amiri, serif',
          fontSize: '1.4rem',
          lineHeight: 0.88,
          letterSpacing: '0.02em',
          fontWeight: 400,
          color: '#f3efe9',
          marginTop: '-0.08em',
        }}>قاف</div>
      </div>
    </div>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode, title: string, actions?: React.ReactNode }> = ({ children, title, actions }) => {
  const { setIsLoggedIn, currentStaff, setCurrentStaff, resetBranding, orders, supportTickets, t, language } = useApp();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showResetToast, setShowResetToast] = useState(false);
  const [bellMuted, setBellMuted] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);

  const previousOrdersCountRef = useRef(orders?.length || 0);
  const previousSupportCountRef = useRef(supportTickets?.length || 0);
  const newOrderAudioRef = useRef<HTMLAudioElement | null>(null);
  const sidebarNavRef = useRef<HTMLDivElement>(null);

  const triggerBell = () => {
    if (bellMuted) return;
    setBellRinging(true);
    const audio = newOrderAudioRef.current;
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {}
    }
    window.setTimeout(() => setBellRinging(false), 2000);
  };

  // Restore sidebar scroll position
  useEffect(() => {
    const savedScroll = localStorage.getItem('admin_sidebar_scroll');
    if (savedScroll && sidebarNavRef.current) {
      sidebarNavRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    localStorage.setItem('admin_sidebar_scroll', e.currentTarget.scrollTop.toString());
  };

  const pendingOrdersCount = useMemo(() => {
    try {
      if (!orders || !Array.isArray(orders)) return 0;
      if (!currentStaff) {
        return orders.filter(o => o && o.status === 'pending').length;
      }
      return orders.filter(o => o && o.status === 'pending' && o.assignedTo === currentStaff.id).length;
    } catch (e) {
      console.error("Pending orders calc error:", e);
      return 0;
    }
  }, [orders, currentStaff]);

  useEffect(() => {
    try {
      const currentCount = orders?.length || 0;
      if (currentCount > previousOrdersCountRef.current) {
        if (currentStaff) {
          const hasAllPermissions = (currentStaff?.permissions?.length || 0) >= 12;
          if (!hasAllPermissions) {
            triggerBell();
          }
        }
      }
      previousOrdersCountRef.current = currentCount;
    } catch (e) { }
  }, [orders?.length, currentStaff, bellMuted]);

  useEffect(() => {
    try {
      const currentSupportCount = supportTickets?.length || 0;
      if (currentSupportCount > previousSupportCountRef.current) {
        triggerBell();
      }
      previousSupportCountRef.current = currentSupportCount;
    } catch (e) { }
  }, [supportTickets?.length, bellMuted]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleResetBranding = () => {
    resetBranding();
    setShowResetToast(true);
    setTimeout(() => setShowResetToast(false), 3000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentStaff(null);
    navigate('/admin/login');
  };

  const menuItems = [
    { id: 'dashboard', name: t.adminDashboard, path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'reports', name: t.adminReports, path: '/admin/reports', icon: <BarChart3 size={20} /> },
    { id: 'crm', name: t.adminCRM, path: '/admin/crm', icon: <UserCheck size={20} /> },
    { id: 'inventory', name: t.adminInventory, path: '/admin/inventory', icon: <Boxes size={20} /> },
    { id: 'orders', name: t.adminOrders, path: '/admin/orders', icon: <ShoppingBag size={20} /> },
    { id: 'customer-stats', name: t.adminBehavior, path: '/admin/customer-stats', icon: <Users size={20} /> },
    { id: 'invoices', name: t.adminInvoices, path: '/admin/invoices', icon: <Printer size={20} /> },
    { id: 'products', name: t.adminProducts, path: '/admin/products', icon: <PackageSearch size={20} /> },
    { id: 'manufacturing', name: t.adminManufacturing, path: '/admin/manufacturing', icon: <ShoppingBag size={20} /> },
    { id: 'manufacturing-reception', name: t.adminReception, path: '/admin/manufacturing-reception', icon: <PackageSearch size={20} /> },
    { id: 'salaries', name: t.adminSalaries, path: '/admin/salaries', icon: <Banknote size={20} /> },
    { id: 'support', name: 'خدمة العملاء', path: '/admin/support', icon: <MessageSquare size={20} /> },
    { id: 'reviews', name: 'إدارة الآراء', path: '/admin/reviews', icon: <MessageSquare size={20} /> },
    { id: 'promo-codes', name: t.adminPromo, path: '/admin/promo-codes', icon: <Ticket size={20} /> },
    { id: 'appearance', name: t.adminAppearance, path: '/admin/appearance', icon: <Palette size={20} /> },
    { id: 'shipping-fees', name: 'الشحن', path: '/admin/shipping-fees', icon: <Truck size={20} /> },
    { id: 'shipping-proofs', name: 'إثبات الدفع', path: '/admin/shipping-proofs', icon: <Banknote size={20} /> },
    { id: 'templates', name: t.adminTemplates, path: '/admin/templates', icon: <LayoutDashboard size={20} /> },
    { id: 'social', name: t.adminSocial, path: '/admin/social', icon: <Share2 size={20} /> },
    { id: 'settings', name: t.adminSettings, path: '/admin/settings', icon: <Settings size={20} /> },
    { id: 'team', name: t.adminTeam, path: '/admin/team', icon: <Users size={20} /> },
  ];

  const filteredMenuItems = currentStaff
    ? menuItems.filter(item => Array.isArray(currentStaff.permissions) && currentStaff.permissions.includes(item.id as any))
    : menuItems;

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden relative">

      {/* Reset Toast */}
      {showResetToast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-white shadow-2xl border border-amber-100 rounded-2xl p-4 flex items-center gap-4 min-w-[280px]">
            <div className="bg-amber-500 p-2 rounded-full text-white">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">تمت استعادة القالب الأصلي بنجاح!</p>
            </div>
            <button onClick={() => setShowResetToast(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-slate-900 text-white flex flex-col h-screen fixed ${language === 'ar' ? 'right-0' : 'left-0'} top-0 z-50 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="p-6 bg-white/5 border-b border-slate-800/50 text-center relative">
          <div className="bg-white p-3 rounded-2xl shadow-sm inline-block min-w-[80%] mx-auto relative">
            <Logo />
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 left-4 text-slate-400 hover:text-white lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav 
          ref={sidebarNavRef}
          onScroll={handleSidebarScroll}
          className="flex-1 p-4 space-y-2 overflow-y-auto" 
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-4">
                {item.icon}
                <span className="font-semibold">{item.name}</span>
              </div>
              {item.id === 'orders' && pendingOrdersCount > 0 && (
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center justify-center min-w-[24px]">
                  {pendingOrdersCount}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition"
          >
            <LogOut size={20} />
            <span className="font-semibold">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* New Order Audio Notification */}
      <audio ref={newOrderAudioRef} src="https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg" preload="auto" />

      {/* Main Content */}
      <main className={`flex-1 min-w-0 ${language === 'ar' ? 'lg:mr-64' : 'lg:ml-64'} min-h-screen transition-all duration-300`}>
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-3 md:px-4 lg:px-8 sticky top-0 z-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden shrink-0"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-base lg:text-xl font-bold text-gray-800 truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              onClick={() => setBellMuted(v => !v)}
              className={`p-2 rounded-full transition ${bellRinging ? 'animate-pulse bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-label={bellMuted ? 'Enable notifications' : 'Mute notifications'}
              title={bellMuted ? 'تفعيل الجرس' : 'كتم الجرس'}
            >
              {bellMuted ? <BellOff size={18} /> : <Bell size={18} />}
            </button>
            <button
              onClick={handleResetBranding}
              className="flex items-center gap-1.5 md:gap-2 bg-slate-800 text-white px-2 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition shadow-lg"
              title={t.backToHome}
            >
              <Home size={14} />
              <span className="hidden sm:inline">{t.home}</span>
            </button>
            {/* Firestore sync status */}
            {(() => {
              const { firestoreOk, lastRemoteUpdate, lastWriteError } = useApp();
              return (
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1.5 rounded-full flex items-center gap-1 ${firestoreOk ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} truncate`} title={lastRemoteUpdate ? `آخر تحديث: ${new Date(lastRemoteUpdate).toLocaleString()}` : (firestoreOk ? 'متصل' : 'غير متصل')}>
                    {firestoreOk ? <Wifi size={12} className="shrink-0" /> : <WifiOff size={12} className="shrink-0" />}
                    <span className="hidden sm:inline">{firestoreOk ? 'متزامن' : 'غير متزامن'}</span>
                  </span>
                  {lastWriteError && (
                    <button onClick={() => alert(lastWriteError)} className="text-[10px] font-bold px-2 py-1.5 rounded-full bg-red-100 text-red-700">
                      عرض خطأ الحفظ
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
