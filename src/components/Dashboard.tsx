import { useState, useEffect } from "react";
import { YearView } from "./YearView";
import { MonthView } from "./MonthView";
import { DayView } from "./DayView";
import { AdminSummary } from "./AdminSummary";
import apiService, { User } from "../services/api";

// أضف هذا النوع الجديد
type UserWithTotal = User & { monthlyTotal?: number };

interface DashboardProps {
  user: User;
  
}

export function Dashboard({ user }: DashboardProps) {
  const [allUsers, setAllUsers] = useState<UserWithTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAdminSummary, setShowAdminSummary] = useState(false);

  useEffect(() => {
    if (user.isAdmin) {
      loadAllUsers();
    } else {
      setLoading(false);
    }
  }, [user.isAdmin]);

  const loadAllUsers = async () => {
    try {
      const response = await apiService.getAllUsers();
      if (response.users) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const usersWithTotals = await Promise.all(
          response.users.map(async (user: any) => {
            const entriesRes = await apiService.getDailyEntries({ userId: user._id, year, month });
            const total = entriesRes.entries?.reduce(
              (sum: number, entry: any) => sum + (entry.cashAmount || 0) + (entry.networkAmount || 0),
              0
            );
            return { ...user, monthlyTotal: total || 0 };
          })
        );
        setAllUsers(usersWithTotals);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const targetUserId = selectedUserId || user._id;

  if (showAdminSummary && user.isAdmin) {
    return (
      <AdminSummary
        onBack={() => setShowAdminSummary(false)}
      />
    );
  }

  if (selectedDate) {
    return (
      <DayView
        date={selectedDate}
        onBack={() => setSelectedDate(null)}
        userId={targetUserId}
        isAdmin={user.isAdmin}
      />
    );
  }

  if (selectedYear && selectedMonth) {
    return (
      <MonthView
        year={selectedYear}
        month={selectedMonth}
        onBack={() => setSelectedMonth(null)}
        onSelectDate={setSelectedDate}
        userId={targetUserId}
        isAdmin={user.isAdmin}
      />
    );
  }

  if (selectedYear) {
    return (
      <YearView
        year={selectedYear}
        onBack={() => setSelectedYear(null)}
        onSelectMonth={setSelectedMonth}
      />
    );
  }

  return (
    <div className="space-y-6">
      {user.isAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                📊 الملخص الشامل للحسابات
              </h3>
              <p className="text-gray-600">
                عرض تفصيلي لجميع المبالغ والحسابات حسب الأيام والمستخدمين
              </p>
            </div>
            <button
              onClick={() => setShowAdminSummary(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              📈 عرض الملخص الشامل
            </button>
          </div>
        </div>
      )}

      {user.isAdmin && allUsers.length > 1 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            👥 اختيار المستخدم
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allUsers.map((userItem) => (
              <button
                key={userItem._id}
                onClick={() => setSelectedUserId(userItem._id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  targetUserId === userItem._id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl">
                    {userItem.isAdmin ? "👑" : "👤"}
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {userItem.username}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {userItem.monthlyTotal?.toLocaleString() || 0} ر.س
                  </div>
                  <div className="text-xs text-gray-500">
                    الشهر الجاري
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          📅 اختر السنة
        </h2>
        <p className="text-gray-600">
          اختر السنة لعرض البيانات المالية
          {selectedUserId && selectedUserId !== user._id && (
            <span className="block mt-1 text-orange-600 font-medium">
              👤 عرض بيانات: {allUsers.find(u => u._id === selectedUserId)?.username}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {Array.from({ length: 6 }, (_, i) => 2025 + i).map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className="group relative bg-white rounded-xl p-6 shadow-lg border border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                📊
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {year}
              </div>
              <div className="text-sm text-gray-500">
                السنة المالية
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        ))}
      </div>

      {/* معلومات إضافية */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200 max-w-2xl mx-auto">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            💡 معلومات مفيدة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span>تتبع المبالغ اليومية</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">📈</span>
              <span>حسابات تلقائية</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-500">💰</span>
              <span>إدارة السلفيات</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-500">📊</span>
              <span>تقارير مفصلة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
