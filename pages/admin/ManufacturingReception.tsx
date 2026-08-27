
import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { ManufacturingRequest } from '../../types';

const ManufacturingReception: React.FC = () => {
  const { manufacturingRequests, setManufacturingRequests } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ManufacturingRequest['status'] | 'all'>('all');

  const filteredRequests = manufacturingRequests.filter(req => {
    const matchesSearch = req.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id: string, status: ManufacturingRequest['status']) => {
    setManufacturingRequests(manufacturingRequests.map(req => 
      req.id === id ? { ...req, status } : req
    ));
  };

  const getStatusColor = (status: ManufacturingRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ManufacturingRequest['status']) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in-progress': return 'جاري التنفيذ';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };

  return (
    <AdminLayout title="تلقى طلبات التصنيع">
      <div className="space-y-8" dir="rtl">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">طلبات بانتظار البدء</p>
              <p className="text-2xl font-bold text-slate-900">
                {manufacturingRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">طلبات جاري تنفيذها</p>
              <p className="text-2xl font-bold text-slate-900">
                {manufacturingRequests.filter(r => r.status === 'in-progress').length}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-50 p-4 rounded-2xl text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">طلبات اكتملت اليوم</p>
              <p className="text-2xl font-bold text-slate-900">
                {manufacturingRequests.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:border-slate-900 transition"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-6 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-6 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              بانتظار البدء
            </button>
            <button
              onClick={() => setStatusFilter('in-progress')}
              className={`px-6 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === 'in-progress' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              جاري التنفيذ
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-6 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === 'completed' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              مكتمل
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center space-y-4">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Package size={40} />
              </div>
              <p className="text-gray-400 font-bold">لا توجد طلبات تصنيع مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 group hover:shadow-md transition duration-300">
                  <div className="w-24 h-24 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0 relative">
                    {req.productImage ? (
                      <img src={req.productImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={32} />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(req.status)} shadow-sm`}></div>
                  </div>

                  <div className="flex-1 text-center md:text-right space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <h4 className="text-xl font-bold text-gray-800">{req.productName}</h4>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white w-fit mx-auto md:mx-0 ${getStatusColor(req.status)}`}>
                        {getStatusText(req.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{new Date(req.createdAt).toLocaleString('ar-EG')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle size={14} />
                        <span>الكمية: {req.quantity} قطعة</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-[8px]">
                          {req.requesterName.charAt(0).toUpperCase()}
                        </div>
                        <span>بواسطة: {req.requesterName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {req.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(req.id, 'in-progress')}
                        className="flex-1 md:flex-none bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition shadow-lg flex items-center justify-center gap-2"
                      >
                        <ArrowRightLeft size={18} />
                        <span>بدء التنفيذ</span>
                      </button>
                    )}
                    {req.status === 'in-progress' && (
                      <button
                        onClick={() => updateStatus(req.id, 'completed')}
                        className="flex-1 md:flex-none bg-green-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={18} />
                        <span>تم الانتهاء</span>
                      </button>
                    )}
                    {req.status === 'completed' && (
                      <div className="flex-1 md:flex-none bg-green-50 text-green-600 px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-green-100">
                        <CheckCircle2 size={18} />
                        <span>مكتمل</span>
                      </div>
                    )}
                    {req.status !== 'pending' && (
                       <button
                       onClick={() => updateStatus(req.id, 'pending')}
                       className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition"
                       title="إعادة للانتظار"
                     >
                       <RotateCcw size={18} />
                     </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const RotateCcw = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);

export default ManufacturingReception;
