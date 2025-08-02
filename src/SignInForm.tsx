import { useState } from "react";
import apiService, { User } from "./services/api";

export function SignInForm({ onAuthSuccess }: { onAuthSuccess: (userData: User) => void }) {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let response;
      if (flow === "signUp") {
        // تحقق من اسم المستخدم
        if (!username.trim()) {
          setError("اسم المستخدم مطلوب");
          setSubmitting(false);
          return;
        }
const usernameRegex = /^[\u0600-\u06FFa-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username.trim())) {
          setError("اسم المستخدم يمكن أن يحتوي على أحرف وأرقام وشرطة سفلية فقط");
          setSubmitting(false);
          return;
        }
        if (username.trim().length < 3 || username.trim().length > 30) {
          setError("اسم المستخدم يجب أن يكون بين 3 و 30 حرف");
          setSubmitting(false);
          return;
        }
        response = await apiService.register({
          email,
          password,
          username: username.trim(),
        });
      } else {
        response = await apiService.login({ email, password });
      }

      localStorage.setItem("user", JSON.stringify(response.user));
      window.location.reload();
    } catch (error: any) {
      setError(
        error.message ||
          (flow === "signUp"
            ? "فشل في إنشاء الحساب"
            : "فشل في تسجيل الدخول")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        className="flex flex-col gap-4 bg-white p-8 rounded-xl shadow-lg border border-orange-200"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold text-center mb-2">
          {flow === "signIn" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </h2>
        {flow === "signUp" && (
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-bold text-gray-700 mb-1"
            >
              اسم المستخدم
            </label>
            <input
              className="auth-input-field"
              id="username"
              name="username"
              type="text"
              placeholder="مثال: user123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={flow === "signUp"}
              autoComplete="username"
            />
            <div className="text-xs text-gray-500 mt-1 px-1">
              اسم المستخدم يجب أن يكون بين 3 و 30 حرف، ويمكن أن يحتوي على أحرف وأرقام وشرطة سفلية (_) فقط
            </div>
          </div>
        )}
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="كلمة المرور (6 أحرف على الأقل)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={flow === "signUp" ? "new-password" : "current-password"}
        />
        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}
        <button
          className="auth-button"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? flow === "signIn"
              ? "جاري تسجيل الدخول..."
              : "جاري إنشاء الحساب..."
            : flow === "signIn"
            ? "تسجيل الدخول"
            : "إنشاء حساب"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "ليس لديك حساب؟ "
              : "لديك حساب بالفعل؟ "}
          </span>
          <button
            type="button"
            className="text-indigo-600 hover:underline font-medium cursor-pointer"
            onClick={() => {
              setFlow(flow === "signIn" ? "signUp" : "signIn");
              setError("");
              setUsername("");
              setEmail("");
              setPassword("");
            }}
          >
            {flow === "signIn" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </button>
        </div>
      </form>
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-700">
          <div className="font-medium mb-1">💡 تعليمات التسجيل:</div>
          <div>• كلمة المرور: 6 أحرف على الأقل</div>
          <div>• اسم المستخدم: 3-30 حرف، أحرف وأرقام وشرطة سفلية فقط</div>
          <div>• مثال: test@example.com / 123456</div>
        </div>
      </div>
    </div>
  );
}

export default SignInForm;