import React, { useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

const StaffAnalytics: React.FC = () => {
  const { staff = [], theme } = useApp();

  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Staff Performance Stats
  const stats = useMemo(() => {
    try {
      const todayKey = getTodayKey();
      let totalActive = 0;
      let totalAway = 0;
      let staffWithData = 0;
      let onlineNow = 0;

      staff.forEach(member => {
        if (member.isOnline) onlineNow++;
        const todayAttendance = member.attendance?.[todayKey];
        if (todayAttendance) {
          staffWithData++;
          totalActive += todayAttendance.totalActiveSeconds || 0;
          totalAway += todayAttendance.totalAwaySeconds || 0;
        }
      });

      const avgActivePerStaff = staffWithData > 0 ? (totalActive / staffWithData) : 0;
      const avgAwayPerStaff = staffWithData > 0 ? (totalAway / staffWithData) : 0;
      const attendanceRate = (totalActive / (totalActive + totalAway)) * 100 || 0;

      return {
        totalStaff: staff.length,
        onlineNow,
        offlineNow: staff.length - onlineNow,
        totalActive,
        totalAway,
        avgActivePerStaff,
        avgAwayPerStaff,
        attendanceRate: isNaN(attendanceRate) ? 0 : attendanceRate,
        staffWithData
      };
    } catch (e) {
      console.error("Stats calc error:", e);
      return {
        totalStaff: 0,
        onlineNow: 0,
        offlineNow: 0,
        totalActive: 0,
        totalAway: 0,
        avgActivePerStaff: 0,
        avgAwayPerStaff: 0,
        attendanceRate: 0,
        staffWithData: 0
      };
    }
  }, [staff]);

  // Weekly attendance data
  const weeklyData = useMemo(() => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      return last7Days.map(date => {
        let dayActive = 0;
        let dayAway = 0;
        const staffCount = staff.length;

        staff.forEach(member => {
          const dayAttendance = member.attendance?.[date];
          if (dayAttendance) {
            dayActive += dayAttendance.totalActiveSeconds || 0;
            dayAway += dayAttendance.totalAwaySeconds || 0;
          }
        });

        return {
          date: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }),
          active: Math.round(dayActive / 3600), // Convert to hours
          away: Math.round(dayAway / 3600),
          attendance: dayActive > 0 ? Math.round((dayActive / (dayActive + dayAway)) * 100) : 0
        };
      });
    } catch { return []; }
  }, [staff]);

  // Top performers
  const topPerformers = useMemo(() => {
    try {
      const todayKey = getTodayKey();
      return staff
        .map(member => {
          const todayAttendance = member.attendance?.[todayKey];
          return {
            name: member.username,
            active: todayAttendance?.totalActiveSeconds || 0,
            away: todayAttendance?.totalAwaySeconds || 0,
            status: member.isOnline ? 'متصل' : 'غير متصل'
          };
        })
        .sort((a, b) => b.active - a.active)
        .slice(0, 5);
    } catch { return []; }
  }, [staff]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}س ${minutes}د`;
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        {subtext && <p className="text-[10px] text-gray-500 mt-1">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: color ? `${color}10` : '#f3f4f6', color: color || '#000' }}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );

  return (
    <AdminLayout title="تحليلات الموظفين">
      <div className="space-y-8" dir="rtl">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي الموظفين" value={stats.totalStaff} icon={Users} color="#3b82f6" />
          <StatCard 
            title="متصلين الآن" 
            value={stats.onlineNow} 
            icon={CheckCircle} 
            color="#10b981" 
            subtext={`${Math.round((stats.onlineNow / stats.totalStaff) * 100)}%`}
          />
          <StatCard 
            title="معدل الحضور" 
            value={`${Math.round(stats.attendanceRate)}%`} 
            icon={Activity} 
            color="#8b5cf6" 
          />
          <StatCard 
            title="متوسط الوقت النشط" 
            value={formatDuration(stats.avgActivePerStaff)} 
            icon={Clock} 
            color="#f59e0b" 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Attendance Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">حضور الموظفين (آخر 7 أيام)</h4>
              <Calendar className="text-blue-500" size={20} />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="active" fill="#10b981" name="نشط (ساعات)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="away" fill="#f59e0b" name="غياب (ساعات)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Rate Trend */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">معدل الحضور (الترند)</h4>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} name="نسبة الحضور %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-gray-900">أفضل أداء اليوم</h4>
            <TrendingUp className="text-green-500" size={20} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
                  <th className="p-4">المرتبة</th>
                  <th className="p-4">اسم الموظف</th>
                  <th className="p-4">وقت النشاط</th>
                  <th className="p-4">وقت الغياب</th>
                  <th className="p-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {topPerformers.length > 0 ? (
                  topPerformers.map((performer, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-slate-800">#{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-800">{performer.name}</td>
                      <td className="p-4 text-green-600 font-bold">{formatDuration(performer.active)}</td>
                      <td className="p-4 text-amber-600 font-bold">{formatDuration(performer.away)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          performer.status === 'متصل' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {performer.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد بيانات حضور اليوم</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StaffAnalytics;
