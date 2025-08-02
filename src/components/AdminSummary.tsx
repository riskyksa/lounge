import { useState, useEffect } from "react";
import apiService from "../services/api";

interface AdminSummaryProps {
  onBack: () => void;
}

const MONTH_NAMES = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export function AdminSummary({ onBack }: AdminSummaryProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<'daily' | 'users'>('daily');
  const [comprehensiveSummary, setComprehensiveSummary] = useState<any>(null);
  const [usersSummary, setUsersSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getAdminSummary({ year: selectedYear, month: selectedMonth });
        setComprehensiveSummary({
          dailySummary: res.dailySummary,
          totals: res.totals
        });
        setUsersSummary({ users: res.usersSummary });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedMonth]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const weekday = date.toLocaleDateString('ar-SA', { weekday: 'long' });
    const day = date.getDate();
    return `${weekday} ${day}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('comprehensiveSummary:', comprehensiveSummary);
  console.log('usersSummary:', usersSummary);

  const hasData = comprehensiveSummary?.dailySummary && comprehensiveSummary.dailySummary.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-blue-200 hover:border-blue-400 transition-colors"
          >
            <span>←</span>
            <span>العودة</span>
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              📊 الملخص الشامل للحسابات
            </h2>
            <p className="text-gray-600 mt-1">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {MONTH_NAMES.slice(1).map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 6 }, (_, i) => 2025 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {comprehensiveSummary?.totals?.totalGross?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">إجمالي المبالغ</div>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            {comprehensiveSummary?.totals?.totalCash?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">إجمالي الكاش</div>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            {comprehensiveSummary?.totals?.totalNetwork?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">إجمالي الشبكة</div>
        </div>
        
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {comprehensiveSummary?.totals?.totalPurchases?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">إجمالي المشتريات</div>
        </div>
        
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <div className="text-2xl font-bold text-indigo-600">
            {(comprehensiveSummary?.totals?.totalAdvances ?? 0).toLocaleString('ar-EG')}
          </div>
          <div className="text-sm text-gray-600">إجمالي السلفيات</div>
        </div>
        
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-600">
            {(() => {
              const totalCash = comprehensiveSummary?.totals?.totalCash || 0;
              const totalNetwork = comprehensiveSummary?.totals?.totalNetwork || 0;
              const totalPurchases = comprehensiveSummary?.totals?.totalPurchases || 0;
              const calculatedNet = totalCash + totalNetwork - totalPurchases;
              return calculatedNet.toLocaleString('ar-EG');
            })()}
          </div>
          <div className="text-sm text-gray-600">الصافي</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
          <div className="text-xl font-bold text-gray-800">
            {Number(comprehensiveSummary?.totals?.activeDays) || 0}
          </div>
          <div className="text-sm text-gray-600">أيام نشطة</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
          <div className="text-xl font-bold text-gray-800">
            {Number(comprehensiveSummary?.totals?.activeUsers) || 0}
          </div>
          <div className="text-sm text-gray-600">مستخدمين نشطين</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
          <div className="text-xl font-bold text-gray-800">
            {Number(comprehensiveSummary?.totals?.averageDailyAmount) || 0}
          </div>
          <div className="text-sm text-gray-600">متوسط يومي</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
          <div className="text-xl font-bold text-gray-800">
            {comprehensiveSummary?.totals?.activeDays && comprehensiveSummary?.totals?.daysInMonth && comprehensiveSummary.totals.daysInMonth !== 0
              ? ((comprehensiveSummary.totals.activeDays / comprehensiveSummary.totals.daysInMonth) * 100).toFixed(1)
              : 0}%
          </div>
          <div className="text-sm text-gray-600">نسبة النشاط</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === 'daily'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          📅 ملخص يومي
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          👥 ملخص المستخدمين
        </button>
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="bg-yellow-50 rounded-xl p-8 border border-yellow-200 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد بيانات</h3>
          <p className="text-gray-600">لا توجد بيانات مالية لشهر {MONTH_NAMES[selectedMonth]} {selectedYear} بعد</p>
          <p className="text-sm text-gray-500 mt-2">قم بإضافة بعض البيانات اليومية أولاً</p>
        </div>
      ) : activeTab === 'daily' ? (
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden mt-4">
        <div className="px-6 py-4 bg-blue-700 flex items-center gap-2 rounded-t-2xl">
          <span className="text-2xl">🗓️</span>
          <h3 className="text-xl font-bold text-white">الملخص اليومي</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-3 text-right font-bold text-blue-900 border-b border-blue-200 whitespace-nowrap">التاريخ</th>
                <th className="px-4 py-3 text-center font-bold text-blue-900 border-b border-blue-200 whitespace-nowrap">الكاش</th>
                <th className="px-4 py-3 text-center font-bold text-blue-900 border-b border-blue-200 whitespace-nowrap">الشبكة</th>
                <th className="px-4 py-3 text-center font-bold text-green-700 border-b border-blue-200 whitespace-nowrap">المجموع</th>
                <th className="px-4 py-3 text-center font-bold text-orange-700 border-b border-blue-200 whitespace-nowrap">المشتريات</th>
                <th className="px-4 py-3 text-center font-bold text-indigo-700 border-b border-blue-200 whitespace-nowrap">السلفيات</th>
                <th className="px-4 py-3 text-center font-bold text-green-700 border-b border-blue-200 whitespace-nowrap">المتبقي</th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 border-b border-blue-200 whitespace-nowrap">المدخلات</th>
              </tr>
            </thead>
            <tbody>
              {comprehensiveSummary?.dailySummary?.map((day: any, idx: number) => (
                <tr
                  key={day.date}
                  className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100`}
                >
                  {/* التاريخ */}
                  <td className="px-4 py-3 border-b border-blue-50 font-medium text-gray-900 whitespace-nowrap text-sm md:text-base text-right">
                    {formatDate(day.date)}
                  </td>
      
                  {/* الكاش */}
                  <td className={`px-4 py-3 border-b border-blue-50 font-bold whitespace-nowrap text-sm md:text-base text-center ${
                    (day.totalCash ?? 0) === 0 ? 'text-gray-400' : 'text-blue-600'
                  }`}>
                    {(day.totalCash ?? 0).toLocaleString('ar-EG')}
                  </td>
      
                  {/* الشبكة */}
                  <td className={`px-4 py-3 border-b border-blue-50 font-bold whitespace-nowrap text-sm md:text-base text-center ${
                    (day.totalNetwork ?? 0) === 0 ? 'text-gray-400' : 'text-purple-600'
                  }`}>
                    {(day.totalNetwork ?? 0).toLocaleString('ar-EG')}
                  </td>
      
                  {/* المجموع */}
                  <td className="px-4 py-3 border-b border-blue-50 text-green-700 font-bold whitespace-nowrap text-sm md:text-base text-center">
                    {(day.totalAmount ?? 0).toLocaleString('ar-EG')}
                  </td>
      
                  {/* المشتريات */}
                  <td className="px-4 py-3 border-b border-blue-50 text-orange-600 font-bold whitespace-nowrap text-sm md:text-base text-center">
                    {(day.totalPurchases ?? 0).toLocaleString('ar-EG')}
                  </td>
      
                  {/* السلفيات */}
                  <td className="px-4 py-3 border-b border-blue-50 text-indigo-700 font-bold whitespace-nowrap text-sm md:text-base text-center">
                    {(day.totalAdvances ?? 0).toLocaleString('ar-EG')}
                  </td>
      
                  {/* المتبقي */}
                  <td className={`px-4 py-3 border-b border-blue-50 font-bold whitespace-nowrap text-sm md:text-base text-center ${
                    (() => {
                      const totalCash = day.totalCash || 0;
                      const totalNetwork = day.totalNetwork || 0;
                      const totalPurchases = day.totalPurchases || 0;
                      const calculatedRemaining = totalCash + totalNetwork - totalPurchases;
                      return calculatedRemaining >= 0 ? 'text-green-700' : 'text-red-600';
                    })()
                  }`}>
                    {(() => {
                      const totalCash = day.totalCash || 0;
                      const totalNetwork = day.totalNetwork || 0;
                      const totalPurchases = day.totalPurchases || 0;
                      const calculatedRemaining = totalCash + totalNetwork - totalPurchases;
                      return calculatedRemaining.toLocaleString('ar-EG');
                    })()}
                  </td>
      
                  {/* المدخلات */}
                  <td className="px-4 py-3 border-b border-blue-50 text-gray-700 whitespace-nowrap text-sm md:text-base text-center">
                    {(day.entriesCount ?? 0).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-green-200 overflow-hidden mt-4">
          <div className="px-6 py-4 bg-green-700 flex items-center gap-2 rounded-t-2xl">
            <span className="text-2xl">👥</span>
            <h3 className="text-xl font-bold text-white">ملخص المستخدمين</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-green-900 border-b border-green-200">المستخدم</th>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-blue-900 border-b border-green-200">الكاش</th>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-purple-900 border-b border-green-200">الشبكة</th>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-green-900 border-b border-green-200">المجموع</th>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-orange-700 border-b border-green-200">المشتريات</th>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-indigo-700 border-b border-green-200">السلفيات</th>
                  {/* <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-red-700 border-b border-green-200">الخصميات</th> */}
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-green-900 border-b border-green-200">المتبقي</th>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap font-bold text-gray-700 border-b border-green-200">أيام نشطة</th>
                </tr>
              </thead>
              <tbody>
                {usersSummary?.users?.map((user: any, idx: number) => (
                  <tr key={user.userId} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50'} hover:bg-green-100`}>
                    <td className="px-4 py-3 border-b border-green-50 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">{user.isAdmin ? "👑" : "👤"}</span>
                        <span className="font-medium text-gray-900 text-base">{user.username}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 border-b border-green-50 text-blue-600 font-bold text-center align-middle whitespace-nowrap text-base">{(user.totalCash ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 border-b border-green-50 text-purple-600 font-bold text-center align-middle whitespace-nowrap text-base">{(user.totalNetwork ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 border-b border-green-50 text-green-700 font-bold text-center align-middle whitespace-nowrap text-base">{(user.totalAmount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 border-b border-green-50 text-orange-600 font-bold text-center align-middle whitespace-nowrap text-base">{(user.totalPurchases ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 border-b border-green-50 text-indigo-700 font-bold text-center align-middle whitespace-nowrap text-base">{(user.totalAdvances ?? 0).toLocaleString('ar-EG')}</td>
                    {/* <td className="px-4 py-3 border-b border-green-50 text-red-700 font-bold text-center align-middle whitespace-nowrap text-base">{(user.deductions ?? 0).toLocaleString('ar-EG')}</td> */}
                    <td className={`px-4 py-3 border-b border-green-50 font-bold text-center align-middle whitespace-nowrap text-base ${
                      (() => {
                        const totalCash = user.totalCash || 0;
                        const totalNetwork = user.totalNetwork || 0;
                        const totalPurchases = user.totalPurchases || 0;
                        const calculatedRemaining = totalCash + totalNetwork - totalPurchases;
                        return calculatedRemaining >= 0 ? 'text-green-700' : 'text-red-600';
                      })()
                    }`}>
                      {(() => {
                        const totalCash = user.totalCash || 0;
                        const totalNetwork = user.totalNetwork || 0;
                        const totalPurchases = user.totalPurchases || 0;
                        const calculatedRemaining = totalCash + totalNetwork - totalPurchases;
                        return calculatedRemaining.toLocaleString('ar-EG');
                      })()}
                    </td>
                    <td className="px-4 py-3 border-b border-green-50 text-gray-700 text-center align-middle whitespace-nowrap text-base">{(user.activeDays ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
