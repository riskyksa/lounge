import { useState } from "react";
import { toast } from "sonner";
import apiService from "../services/api";

export function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const validate = () => {
    const errs: { username?: string; email?: string; password?: string } = {};
    const usernameRegex = /^[\u0600-\u06FFa-zA-Z0-9_]+$/;
    if (!username.trim()) {
      errs.username = "اسم المستخدم مطلوب";
    } else if (!usernameRegex.test(username.trim())) {
      errs.username = "اسم المستخدم يمكن أن يحتوي على أحرف وأرقام وشرطة سفلية فقط";
    } else if (username.trim().length < 3 || username.trim().length > 30) {
      errs.username = "اسم المستخدم يجب أن يكون بين 3 و 30 حرف";
    }
    if (!email.trim()) {
      errs.email = "البريد الإلكتروني مطلوب";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = "صيغة البريد الإلكتروني غير صحيحة";
    }
    if (!password.trim()) {
      errs.password = "كلمة المرور مطلوبة";
    } else if (password.length < 6) {
      errs.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await apiService.register({ 
        username: username.trim(),
        email: email.trim(),
        password: password
      });
      if (response.user) {
        toast.success("تم إنشاء ملف المستخدم بنجاح!");
      } else {
        toast.error(response.message || "حدث خطأ أثناء إنشاء ملف المستخدم");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء إنشاء ملف المستخدم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-lg border border-orange-200">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            إعداد ملف المستخدم
          </h2>
          <p className="text-gray-600">
            يرجى إدخال بيانات المستخدم لإكمال إعداد حسابك
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="أدخل اسم المستخدم"
              disabled={loading}
              required
            />
            {errors.username && <div className="text-red-600 text-xs mt-1">{errors.username}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="أدخل البريد الإلكتروني"
              disabled={loading}
              required
            />
            {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="أدخل كلمة المرور"
              disabled={loading}
              required
            />
            {errors.password && <div className="text-red-600 text-xs mt-1">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "جاري الإنشاء..." : "إنشاء ملف المستخدم"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <span>💡</span>
            <span>
              المستخدم الأول سيحصل على صلاحيات المدير تلقائياً
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
