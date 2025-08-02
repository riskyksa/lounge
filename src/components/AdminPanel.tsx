import { useState, useEffect } from "react";
import { toast } from "sonner";
import apiService, { User } from "../services/api";

// أضف هذا النوع الجديد
type UserWithTotal = User & { monthlyTotal?: number; totalAdvances?: number; monthlyDeductions?: number };

export function AdminPanel() {
  const [users, setUsers] = useState<UserWithTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingDeductions, setEditingDeductions] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newDeductions, setNewDeductions] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // حالات التصفير
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState<'complete' | 'data'>('data');
  const [confirmationText, setConfirmationText] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [editingAdvances, setEditingAdvances] = useState<string | null>(null);
  const [newAdvances, setNewAdvances] = useState(0);

  const [addingDeduction, setAddingDeduction] = useState<string | null>(null);
  const [deductionAmount, setDeductionAmount] = useState(0);
  const [deductionReason, setDeductionReason] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);


  useEffect(() => {
    // التحقق من وجود token قبل تحميل المستخدمين
    if (!apiService.isAuthenticated()) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    loadUsers();

    // إعادة تحميل البيانات كل دقيقة للتأكد من تحديث السلفيات
    const interval = setInterval(() => {
      console.log('Auto-refreshing data in AdminPanel...');
      loadUsers();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      if (!document.hasFocus()) {
        console.log('Window not focused, skipping auto-refresh');
        return;
      }
      setLoading(true);
      console.log('Loading users...');

      // التحقق من وجود token
      if (!apiService.isAuthenticated()) {
        toast.error('يجب تسجيل الدخول أولاً');
        setUsers([]);
        return;
      }

      const response = await apiService.getAllUsers();
      console.log('Users response:', response);

      if (response.users && response.users.length > 0) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        console.log(`Loading data for ${response.users.length} users for ${year}-${month}`);

        // تحميل البيانات الإضافية بشكل متوازي لتحسين الأداء
        const usersWithTotals = await Promise.all(
          response.users.map(async (user: any) => {
            try {
              console.log(`Loading data for user: ${user.username}`);

              // جلب المدخلات الشهرية
              const entriesRes = await apiService.getDailyEntries({
                userId: user._id,
                year,
                month
              });
              const total = entriesRes.entries?.reduce(
                (sum: number, entry: any) => sum + (entry.cashAmount || 0) + (entry.networkAmount || 0),
                0
              ) || 0;

              // جلب السلفيات الشهرية
              const advancesRes = await apiService.getMonthlyAdvances({
                userId: user._id,
                yearMonth: `${year}-${month.toString().padStart(2, '0')}`
              });
              const totalAdvances = advancesRes.advances?.[0]?.totalAdvances || 0;

              // جلب الخصميات الشهرية
              const deductionsRes = await apiService.getDeductions({
                userId: user._id,
                year,
                month
              });
              const monthlyDeductions = (deductionsRes as any).entries?.reduce(
                (sum: number, deduction: any) => sum + (deduction.amount || 0),
                0
              ) || 0;

              console.log(`User ${user.username} data loaded successfully`);

              return {
                ...user,
                monthlyTotal: total,
                totalAdvances,
                monthlyDeductions
              };
            } catch (userError) {
              console.error(`Error loading data for user ${user._id}:`, userError);
              // في حالة حدوث خطأ، نرجع المستخدم مع قيم افتراضية
              return {
                ...user,
                monthlyTotal: 0,
                totalAdvances: 0,
                monthlyDeductions: 0
              };
            }
          })
        );

        console.log('All users data loaded successfully');
        if (JSON.stringify(usersWithTotals) !== JSON.stringify(users)) {
          setUsers(usersWithTotals);
        }

      } else {
        console.log('No users found');
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);

      // رسائل خطأ أكثر تفصيلاً
      let errorMessage = 'فشل في تحميل المستخدمين';
      if (error instanceof Error) {
        if (error.message.includes('Database not available')) {
          errorMessage = 'قاعدة البيانات غير متاحة، يرجى المحاولة لاحقاً';
        } else if (error.message.includes('401')) {
          errorMessage = 'يجب تسجيل الدخول أولاً';
        } else if (error.message.includes('403')) {
          errorMessage = 'ليس لديك صلاحيات المدير';
        } else if (error.message.includes('500')) {
          errorMessage = 'خطأ في الخادم، يرجى المحاولة لاحقاً';
        } else {
          errorMessage = `فشل في تحميل المستخدمين: ${error.message}`;
        }
      }

      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async (userId: string) => {
    if (!newUsername.trim()) {
      toast.error("يرجى إدخال اسم المستخدم الجديد");
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiService.updateUsername(userId, newUsername.trim());
      if (response.user) {
        toast.success("تم تحديث اسم المستخدم بنجاح");
        setEditingUser(null);
        setNewUsername("");
        loadUsers();
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث اسم المستخدم");
    } finally {
      setActionLoading(false);
    }
  };
  const handleUpdateEmail = async (userId: string) => {
    if (!newEmail.trim()) {
      toast.error("يرجى إدخال البريد الجديد");
      return;
    }
    setActionLoading(true);
    try {
      await apiService.updateUserEmail(userId, newEmail.trim());
      toast.success("تم تحديث البريد الإلكتروني بنجاح");
      setEditingEmail(null);
      setNewEmail("");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث البريد الإلكتروني");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePassword = async (userId: string) => {
    if (!newPassword.trim()) {
      toast.error("يرجى إدخال كلمة المرور الجديدة");
      return;
    }
    setActionLoading(true);
    try {
      await apiService.updateUserPassword(userId, newPassword.trim());
      toast.success("تم تحديث كلمة المرور بنجاح");
      setEditingPassword(null);
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث كلمة المرور");
    } finally {
      setActionLoading(false);
    }
  };
  const handleUpdateDeductions = async (userId: string) => {
    if (newDeductions < 0) {
      toast.error("لا يمكن أن تكون الخصميات أقل من الصفر");
      return;
    }

    setActionLoading(true);
    try {
      // بدلاً من تعديل الخصميات الثابتة، أضف خصمية شهرية جديدة
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const reason = "خصمية شهرية من الأدمن";
      const response = await apiService.addDeduction(String(userId), Number(newDeductions), reason);
      if (response) {
        toast.success("تم إضافة الخصمية الشهرية بنجاح");
        setEditingDeductions(null);
        setNewDeductions(0);
        loadUsers(); // إعادة تحميل القائمة
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء إضافة الخصمية الشهرية");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAdvances = async (userId: string) => {
    if (newAdvances < 0) {
      toast.error("لا يمكن أن تكون السلفيات أقل من الصفر");
      return;
    }
    setActionLoading(true);
    try {
      console.log('Updating advances for user:', userId, 'with amount:', newAdvances);
      const response = await apiService.updateUserAdvances(userId, newAdvances);
      console.log('Update advances response:', response);

      if (response.user) {
        toast.success(`تم تحديث السلفيات بنجاح إلى ${newAdvances.toLocaleString()} ر.س`);
        setEditingAdvances(null);
        setNewAdvances(0);

        // إعادة تحميل البيانات فوراً
        await loadUsers();

        // إضافة تأخير قصير للتأكد من تحديث البيانات
        setTimeout(() => {
          loadUsers();
          toast.info("تم تحديث البيانات في الواجهة");
        }, 1000);

        // إضافة تأخير آخر للتأكد من تحديث البيانات
        setTimeout(() => {
          loadUsers();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error updating advances:', error);
      toast.error(error.message || "حدث خطأ أثناء تحديث السلفيات");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟ سيتم حذف جميع بياناته نهائياً.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await apiService.deleteUser(userId);
      toast.success("تم حذف المستخدم بنجاح");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حذف المستخدم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    const expectedText = resetType === 'complete' ? 'تصفير كامل' : 'تصفير البيانات';

    if (confirmationText !== expectedText) {
      toast.error(`يرجى كتابة "${expectedText}" بالضبط للتأكيد`);
      return;
    }

    setResetLoading(true);
    try {
      if (resetType === 'complete') {
        await apiService.completeSystemReset(confirmationText);
        toast.success("تم التصفير الكامل بنجاح");
      } else {
        await apiService.resetDataOnly(confirmationText);
        toast.success("تم تصفير البيانات بنجاح");
      }
      setShowResetModal(false);
      setConfirmationText("");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء التصفير");
    } finally {
      setResetLoading(false);
    }
  };

  const handleAddDeduction = async (userId: string) => {
    console.log('handleAddDeduction called with userId:', userId);
    console.log('Current state:', { deductionAmount, deductionReason });

    if (!userId || deductionAmount <= 0 || !deductionReason.trim()) {
      toast.error("يرجى إدخال جميع الحقول بشكل صحيح");
      return;
    }
    setActionLoading(true);
    try {
      // تأكد من أن userId نص وليس undefined
      const response = await apiService.addDeduction(String(userId), Number(deductionAmount), String(deductionReason));
      console.log('Deduction response:', response);
      toast.success("تمت إضافة الخصمية بنجاح");
      setAddingDeduction(null);
      setDeductionAmount(0);
      setDeductionReason("");
      loadUsers();
    } catch (error: any) {
      console.error('Error adding deduction:', error);
      let errorMessage = "حدث خطأ أثناء إضافة الخصمية";
      if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

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
        <h2 className="text-3xl font-bold text-gray-800">
          👑  إدارة المستخدمين
        </h2>



        <div className="flex gap-2">

          <button
            onClick={() => {
              setResetType('data');
              setShowResetModal(true);
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            🗑️ تصفير البيانات
          </button>
          <button
            onClick={() => {
              setResetType('complete');
              setShowResetModal(true);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            ⚠️ تصفير كامل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {users.length}
          </div>
          <div className="text-sm text-gray-600">إجمالي المستخدمين</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isAdmin).length}
          </div>
          <div className="text-sm text-gray-600">المديرين</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => !u.isAdmin).length}
          </div>
          <div className="text-sm text-gray-600">المستخدمين العاديين</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500">
          <h3 className="text-xl font-semibold text-white">قائمة المستخدمين</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبالغ المدخلة (الشهر الحالي)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الخصميات الشهرية</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السلفيات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإنشاء</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user: UserWithTotal) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {user.isAdmin ? "👑" : "👤"}
                      </span>
                      <div>
                        {editingUser === user._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="اسم المستخدم الجديد"
                            />
                            <button
                              onClick={() => handleUpdateUsername(user._id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setNewUsername("");
                              }}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isAdmin
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {user.isAdmin ? 'مدير' : 'مستخدم'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-green-700 font-bold">
                    {(user.monthlyTotal ?? 0).toLocaleString('ar-EG')} ر.س
                  </td>
                  <td className="px-6 py-4">
                    {editingDeductions === user._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newDeductions}
                          onChange={(e) => setNewDeductions(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleUpdateDeductions(user._id)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeductions(null);
                            setNewDeductions(0);
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-medium">
                          {(user.monthlyDeductions ?? 0).toLocaleString('ar-EG')} ر.س
                        </span>
                        {/* <button
                          onClick={() => {
                            setEditingDeductions(user._id);
                            setNewDeductions(user.monthlyDeductions ?? 0);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          تعديل
                        </button> */}
                        <button
                          onClick={() => {
                            console.log('Setting up deduction for user:', user._id);
                            setAddingDeduction(user._id);
                            setDeductionAmount(0);
                            setDeductionReason("");
                          }}
                          className="text-orange-600 hover:text-orange-800 text-sm"
                        >
                          + إضافة خصمية
                        </button>
                      </div>
                    )}
                    {/* واجهة إضافة خصمية */}
                    {addingDeduction === user._id && (
                      <div className="mt-2 flex flex-col gap-2 bg-orange-50 p-2 rounded-lg border border-orange-200">
                        <input
                          type="number"
                          value={deductionAmount}
                          onChange={e => {
                            const value = Number(e.target.value);
                            console.log('Setting deduction amount:', value);
                            setDeductionAmount(value);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="مبلغ الخصمية"
                          min="0.01"
                          step="0.01"
                        />
                        <input
                          type="text"
                          value={deductionReason}
                          onChange={e => {
                            const value = e.target.value;
                            console.log('Setting deduction reason:', value);
                            setDeductionReason(value);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="سبب الخصمية"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log('Adding deduction for user:', user._id);
                              console.log('Current deduction amount:', deductionAmount);
                              console.log('Current deduction reason:', deductionReason);
                              handleAddDeduction(user._id);
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => {
                              setAddingDeduction(null);
                              setDeductionAmount(0);
                              setDeductionReason("");
                            }}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingAdvances === user._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newAdvances}
                          onChange={(e) => setNewAdvances(Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <button
                          onClick={() => handleUpdateAdvances(user._id)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => {
                            setEditingAdvances(null);
                            setNewAdvances(0);
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-medium">
                          {(user.totalAdvances ?? 0).toLocaleString('ar-EG')} ر.س
                        </span>
                        <button
                          onClick={() => {
                            setEditingAdvances(user._id);
                            setNewAdvances(user.totalAdvances ?? 0);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          تعديل
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                        onClick={() =>
                          setOpenMenu((prev) => (prev === user._id ? null : user._id))
                        }
                      >
                        ⋮
                      </button>
                      {openMenu === user._id && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setEditingUser(user._id);
                                setNewUsername(user.username);
                                setOpenMenu(null);
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                            >
                              تعديل الاسم
                            </button>
                            <button
                              onClick={() => {
                                setEditingEmail(user._id);
                                setNewEmail(user.email);
                                setOpenMenu(null);
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                            >
                              تعديل البريد
                            </button>
                            <button
                              onClick={() => {
                                setEditingPassword(user._id);
                                setNewPassword("");
                                setOpenMenu(null);
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                            >
                              تغيير كلمة المرور
                            </button>
                            {!user.isAdmin && (
                              <button
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      `هل أنت متأكد من حذف جميع المدخلات للمستخدم "${user.username}"؟ سيتم حذف كل البيانات المالية نهائياً.`
                                    )
                                  )
                                    return;
                                  setActionLoading(true);
                                  try {
                                    await apiService.deleteAllEntriesForUser(user._id);
                                    toast.success("تم حذف جميع المدخلات بنجاح");
                                    loadUsers();
                                  } catch (error: any) {
                                    toast.error(error.message || "حدث خطأ أثناء حذف جميع المدخلات");
                                  } finally {
                                    setActionLoading(false);
                                    setOpenMenu(null);
                                  }
                                }}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                              >
                                🗑️ حذف جميع المدخلات
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleDeleteUser(user._id, user.username);
                                setOpenMenu(null);
                              }}
                              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-right"
                            >
                              حذف الحساب
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* واجهة تعديل البريد */}
      {editingEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">تعديل البريد الإلكتروني</h3>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="أدخل البريد الإلكتروني الجديد"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateEmail(editingEmail)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setEditingEmail(null);
                  setNewEmail("");
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* واجهة تعديل كلمة المرور */}
      {editingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">تغيير كلمة المرور</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="أدخل كلمة المرور الجديدة"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdatePassword(editingPassword)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setEditingPassword(null);
                  setNewPassword("");
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ⚠️ تأكيد التصفير

            </h3>
            <p className="text-gray-600 mb-4">
              {resetType === 'complete'
                ? 'سيتم حذف جميع البيانات والمستخدمين نهائياً. هذا الإجراء لا يمكن التراجع عنه.'
                : 'سيتم حذف جميع البيانات المالية فقط. المستخدمين سيظلون موجودين.'
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اكتب "{resetType === 'complete' ? 'تصفير كامل' : 'تصفير البيانات'}" للتأكيد:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="اكتب النص للتأكيد"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${resetType === 'complete'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  } disabled:opacity-50`}
              >
                {resetLoading ? 'جاري التصفير...' : 'تأكيد التصفير'}
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmationText("");
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


















