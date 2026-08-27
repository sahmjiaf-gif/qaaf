
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './state';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import OrderManagement from './pages/admin/Orders';
import ManufacturingManagement from './pages/admin/Manufacturing';
import ManufacturingReception from './pages/admin/ManufacturingReception';
import SalariesManagement from './pages/admin/Salaries';
import ProductManagement from './pages/admin/Products';
import AppearanceSettings from './pages/admin/Appearance';
import SocialSettings from './pages/admin/Social';
import ShippingFeesSettings from './pages/admin/ShippingFees';
import ShippingProofs from './pages/admin/ShippingProofs';
import ProfileSettings from './pages/admin/Settings';
import PromoCodes from './pages/admin/PromoCodes';
import CustomerStats from './pages/admin/CustomerStats';
import Invoices from './pages/admin/Invoices';
import StaffManagement from './pages/StaffManagement';
import Templates from './pages/admin/Templates';
import CRM from './pages/admin/CRM';
import Inventory from './pages/admin/Inventory';
import Consultations from './pages/admin/Consultations';
import AdvancedReports from './pages/admin/AdvancedReports';
import StaffAnalytics from './pages/admin/StaffAnalytics';
import Reviews from './pages/admin/Reviews';
import StaffOrders from './pages/admin/StaffOrders';
import SupportPage from './pages/admin/Support';
import MyConsultations from './pages/MyConsultations';
import { GlobalPresenceManager } from './components/PresenceManager';

// Error Boundary for Admin Section
class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Admin Layout Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8 text-center" dir="rtl">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ في النظام</h1>
            <p className="text-gray-600 mb-6">نعتذر عن هذا الخطأ التقني. يرجى محاولة تحديث الصفحة أو العودة للرئيسية.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">تحديث الصفحة</button>
              <button onClick={() => window.location.href = '#/admin/login'} className="px-6 py-2 bg-gray-100 text-gray-800 rounded-xl font-bold">تسجيل الدخول</button>
            </div>
            <div className="mt-8 text-left text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-60 text-red-800">
               <strong>تفاصيل الخطأ التقني:</strong>
               <pre className="mt-2 whitespace-pre-wrap font-mono">
                  {this.state.error && this.state.error.toString()}
               </pre>
               <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-gray-500">
                  {this.state.error?.stack}
               </pre>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PermissionRoute: React.FC<{ permission: string; children: React.ReactNode }> = ({ permission, children }) => {
  const { isLoggedIn, currentStaff } = useApp();
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;
  // Full admin (not a staff login) → always allowed
  if (!currentStaff) return <>{children}</>;
  // Staff member → check permission
  if (currentStaff.permissions.includes(permission as any)) return <>{children}</>;
  // No permission → redirect to first allowed page
  const first = currentStaff.permissions[0];
  return <Navigate to={first ? `/admin/${first}` : '/admin/login'} replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const GlobalLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <GlobalLoader>
        <GlobalPresenceManager />
        <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-consultations" element={<MyConsultations />} />
          <Route path="/admin/login" element={
            <AdminErrorBoundary>
              <AdminLogin />
            </AdminErrorBoundary>
          } />
          
          <Route path="/admin/*" element={
            <AdminErrorBoundary>
              <ProtectedRoute>
                <Routes>
                  <Route path="dashboard" element={<PermissionRoute permission="dashboard"><AdminDashboard /></PermissionRoute>} />
                  <Route path="customer-stats" element={<PermissionRoute permission="customer-stats"><CustomerStats /></PermissionRoute>} />
                  <Route path="invoices" element={<PermissionRoute permission="invoices"><Invoices /></PermissionRoute>} />
                  <Route path="orders" element={<PermissionRoute permission="orders"><OrderManagement /></PermissionRoute>} />
                  <Route path="manufacturing" element={<PermissionRoute permission="manufacturing"><ManufacturingManagement /></PermissionRoute>} />
                  <Route path="manufacturing-reception" element={<PermissionRoute permission="manufacturing-reception"><ManufacturingReception /></PermissionRoute>} />
                  <Route path="salaries" element={<PermissionRoute permission="salaries"><SalariesManagement /></PermissionRoute>} />
                  <Route path="products" element={<PermissionRoute permission="products"><ProductManagement /></PermissionRoute>} />
                  <Route path="promo-codes" element={<PermissionRoute permission="promo-codes"><PromoCodes /></PermissionRoute>} />
                  <Route path="appearance" element={<PermissionRoute permission="appearance"><AppearanceSettings /></PermissionRoute>} />
                  <Route path="shipping-fees" element={<PermissionRoute permission="shipping-fees"><ShippingFeesSettings /></PermissionRoute>} />
                  <Route path="shipping-proofs" element={<PermissionRoute permission="orders"><ShippingProofs /></PermissionRoute>} />
                  <Route path="templates" element={<PermissionRoute permission="appearance"><Templates /></PermissionRoute>} />
                  <Route path="social" element={<PermissionRoute permission="social"><SocialSettings /></PermissionRoute>} />
                  <Route path="crm" element={<PermissionRoute permission="crm"><CRM /></PermissionRoute>} />
                  <Route path="inventory" element={<PermissionRoute permission="inventory"><Inventory /></PermissionRoute>} />
                  <Route path="consultations" element={<PermissionRoute permission="consultations"><Consultations /></PermissionRoute>} />
                  <Route path="staff-analytics" element={<PermissionRoute permission="team"><StaffAnalytics /></PermissionRoute>} />
                  <Route path="reports" element={<PermissionRoute permission="reports"><AdvancedReports /></PermissionRoute>} />
                  <Route path="reviews" element={<PermissionRoute permission="reviews"><Reviews /></PermissionRoute>} />
                  <Route path="staff-orders" element={<PermissionRoute permission="orders"><StaffOrders /></PermissionRoute>} />
                  <Route path="support" element={<PermissionRoute permission="support"><SupportPage /></PermissionRoute>} />
                  <Route path="settings" element={<PermissionRoute permission="settings"><ProfileSettings /></PermissionRoute>} />
                  <Route path="team" element={<PermissionRoute permission="team"><StaffManagement /></PermissionRoute>} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            </AdminErrorBoundary>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      </GlobalLoader>
    </AppProvider>
  );
};

export default App;
