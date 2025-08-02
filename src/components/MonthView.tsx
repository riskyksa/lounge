import { useState, useEffect } from "react";
import { toast } from "sonner";
import apiService from "../services/api";

interface MonthViewProps {
  year: number;
  month: number;
  onBack: () => void;
  onSelectDate: (date: string) => void;
  userId: string;
  isAdmin: boolean;
}

const MONTH_NAMES = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function MonthView({ year, month, onBack, onSelectDate, userId, isAdmin }: MonthViewProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [monthlyAdvances, setMonthlyAdvances] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch daily entries
      const entriesResponse = await apiService.getDailyEntries({ 
        year, 
        month,
        userId 
      });
      if (entriesResponse.entries) {
        setEntries(entriesResponse.entries);
      }
      
      // Fetch monthly advances
      const advancesResponse = await apiService.getMonthlyAdvances({
        yearMonth: `${year}-${month.toString().padStart(2, '0')}`,
        userId
      });
      if (advancesResponse.advances) {
        setMonthlyAdvances(advancesResponse.advances);
      }
      
      // Fetch user profile
      const userResponse = await apiService.getUser(userId);
      if (userResponse.user) {
        setUserProfile(userResponse.user);
      }
      
      // Fetch deductions
      const deductionsResponse = await apiService.getDeductions({
        userId,
        year,
        month
      });
      if (deductionsResponse.entries) {
        setDeductions(deductionsResponse.entries);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // إعادة تحميل البيانات كل 30 ثانية للتأكد من تحديث السلفيات
    const interval = setInterval(() => {
      console.log('Auto-refreshing data in MonthView...');
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [year, month, userId]);

  // إنشاء تقويم الشهر
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getEntryForDate = (day: number) => {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return entries?.find(entry => entry.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    onSelectDate(dateStr);
  };

  const totalCash = entries.reduce((sum, entry) => sum + (entry.cashAmount || 0), 0);
  const totalNetwork = entries.reduce((sum, entry) => sum + (entry.networkAmount || 0), 0);
  const totalPurchases = entries.reduce((sum, entry) => sum + (entry.purchasesAmount || 0), 0);
  const totalAdvances = Array.isArray(monthlyAdvances) && monthlyAdvances[0]?.totalAdvances ? monthlyAdvances[0].totalAdvances : 0;
  const fixedDeductions = userProfile?.deductions || 0;
  const monthlyDeductions = deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0);
  const totalDeductions = fixedDeductions + monthlyDeductions;
  const totalAmount = totalCash + totalNetwork;
  const totalRemaining = totalCash + totalNetwork - totalPurchases;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-orange-200 hover:border-orange-400 transition-colors"
          >
            <span>←</span>
            <span>العودة</span>
          </button>
          <h2 className="text-3xl font-bold text-gray-800">
            📅 {MONTH_NAMES[month]} {year}
          </h2>
        </div>
        
     
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200">
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {entries?.length || 0}
            </div>
            <div className="text-sm text-gray-600">أيام مسجلة</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {entries?.reduce((sum, entry) => sum + ((entry.cashAmount || 0) + (entry.networkAmount || 0)), 0).toLocaleString()} ر.س
            </div>
            <div className="text-sm text-gray-600">إجمالي المبالغ</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {(Array.isArray(monthlyAdvances) && monthlyAdvances[0]?.totalAdvances
  ? monthlyAdvances[0].totalAdvances.toLocaleString()
  : '0')} 
            </div>
            <div className="text-sm text-gray-600">السلفيات التراكمية</div>
          </div>
          <div>
              <div className="text-2xl font-bold text-red-600">{monthlyDeductions.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">الخصميات الشهرية</div>
            </div>     </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {entries?.length || 0}
              </div>
              <div className="text-sm text-gray-600">أيام مسجلة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {(Array.isArray(monthlyAdvances) && monthlyAdvances[0]?.totalAdvances
  ? monthlyAdvances[0].totalAdvances.toLocaleString()
  : '0')}         
   
              </div>
              <div className="text-sm text-gray-600">السلفيات التراكمية</div>
            </div>
            {/* <div>
              <div className="text-2xl font-bold text-orange-600">
                {userProfile?.deductions?.toLocaleString() || 0} ر.س
              </div>
              <div className="text-sm text-gray-600">الخصومات الثابتة</div>
            </div> */}



            <div>
              <div className="text-2xl font-bold text-red-600">
                {monthlyDeductions.toLocaleString()} ر.س</div>
              {/* <div className="text-sm text-gray-600">إجمالي الخصميات</div> */}
              <div className="text-sm text-gray-600">الخصميات الشهرية</div>

            </div>


          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
      {calendarDays.map((day, index) => {
  if (day === null) {
    return <div key={`empty-${index}`} className="h-16"></div>;
  }

  const entry = getEntryForDate(day);
  const hasData = !!entry;
  const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();

  return (
    <button
      key={`day-${index}`} 
      onClick={() => handleDateClick(day)}
      className={`
        relative h-16 rounded-lg border-2 transition-all duration-200 transform hover:scale-105
        ${hasData 
          ? 'bg-green-50 border-green-300 hover:border-green-400 shadow-md' 
          : 'bg-gray-50 border-gray-200 hover:border-orange-300'
        }
        ${isToday ? 'ring-2 ring-orange-400' : ''}
      `}
    >
      <div className="text-lg font-semibold text-gray-800">
        {day}
      </div>
      {hasData && isAdmin && (
        <div className="absolute bottom-1 left-1 right-1">
          <div className="text-xs text-green-600 font-medium">
            {entry.total?.toLocaleString()} ر.س
          </div>
        </div>
      )}
      {hasData && !isAdmin && (
        <div className="absolute bottom-1 left-1 right-1">
          <div className="text-xs text-green-600 font-medium">
            ✅ مكتمل
          </div>
        </div>
      )}
      {isToday && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
      )}
    </button>
  );
})}

        </div>
      </div>

      {/* إرشادات */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-orange-500">💡</span>
          <span>اضغط على أي يوم لإضافة أو عرض البيانات المالية</span>
        </div>
      </div>

      {/* عرض الخصميات الشهرية */}
      {deductions.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">خصميات الشهر</h3>
          <div className="space-y-3">
            {deductions.map((deduction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1">
                  <div className="font-medium text-red-800">{deduction.reason}</div>
                  <div className="text-sm text-red-600">
                    {new Date(deduction.date).toLocaleDateString('ar-SA')}
                  </div>
                </div>
                <div className="text-lg font-bold text-red-700">
                  {deduction.amount.toLocaleString()} ر.س
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg border border-red-300">
              <div className="font-semibold text-red-800">إجمالي الخصميات الشهرية</div>
              <div className="text-lg font-bold text-red-700">
                {monthlyDeductions.toLocaleString()} ر.س
              </div>
            </div>
          </div>
        </div>
      )}

      {/* إحصائيات الشهر */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalCash.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">إجمالي الكاش</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{totalNetwork.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">إجمالي الشبكة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalAmount.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">إجمالي المبالغ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{totalPurchases.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">إجمالي المشتريات</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{totalAdvances.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">السلفيات التراكمية</div>
            </div>
            {/* <div>
              <div className="text-2xl font-bold text-red-600">{monthlyDeductions.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">الخصميات الشهرية</div>
            </div> */}
            <div>
              <div className="text-2xl font-bold text-red-600">{totalDeductions.toLocaleString()} ر.س</div>
              {/* <div className="text-sm text-gray-600">إجمالي الخصميات</div> */}
              <div className="text-sm text-gray-600">الخصميات الشهرية</div>

            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">{totalRemaining.toLocaleString()} ر.س</div>
              <div className="text-sm text-gray-600">المتبقي النهائي</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{entries.length}</div>
              <div className="text-sm text-gray-600">أيام مسجلة</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
