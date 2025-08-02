# 🚀 Freelance Daily Entries App

تطبيق إدارة المدخلات اليومية للمستقلين مع واجهة مستخدم حديثة ونظام إدارة متكامل.

## 🌐 الروابط المباشرة

- **الفرونت إند**: [Vercel](https://your-vercel-app.vercel.app) (سيتم تحديثه بعد Deploy)
- **الباك إند**: [Railway](https://web-production-0f21.up.railway.app)
- **API Documentation**: [API_TESTING.md](./API_TESTING.md)

## ✨ الميزات

### 🔐 نظام المصادقة
- تسجيل مستخدمين جدد
- تسجيل الدخول
- تغيير كلمة المرور
- إدارة الملف الشخصي

### 📊 إدارة المدخلات اليومية
- إضافة مدخلات يومية
- تتبع النقد والتحويلات البنكية
- حساب المشتريات والسلفيات
- عرض الإحصائيات الشهرية

### 👑 لوحة الإدارة
- إدارة المستخدمين
- تعديل الخصميات
- إحصائيات النظام
- إعادة تعيين النظام

### 📱 واجهة مستخدم حديثة
- تصميم متجاوب
- واجهة عربية
- تجربة مستخدم سلسة
- إشعارات فورية

## 🛠️ التقنيات المستخدمة

### الفرونت إند
- **React 18** + **TypeScript**
- **Vite** للبناء السريع
- **Tailwind CSS** للتصميم
- **React Router** للتنقل

### الباك إند
- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** للمصادقة
- **bcrypt** لتشفير كلمات المرور

### النشر
- **Vercel** للفرونت إند
- **Railway** للباك إند
- **MongoDB Atlas** لقاعدة البيانات

## 🚀 التثبيت والتشغيل

### المتطلبات المسبقة
- Node.js 18+
- npm أو yarn
- حساب MongoDB Atlas
- حساب Vercel
- حساب Railway

### التثبيت المحلي

```bash
# استنساخ المشروع
git clone <repository-url>
cd freelance

# تثبيت dependencies
npm install

# إعداد متغيرات البيئة
cp env.example .env
# عدّل .env بروابطك

# تشغيل الفرونت إند
npm run dev

# تشغيل الباك إند (في مجلد منفصل)
cd backend
npm install
npm start
```

## 🌐 النشر

### نشر الباك إند على Railway

1. **انشئ مشروع جديد على Railway**
2. **اربط Repository**
3. **أضف متغيرات البيئة** (انظر [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md))
4. **انشر المشروع**

### نشر الفرونت إند على Vercel

1. **انشئ مشروع جديد على Vercel**
2. **اربط Repository**
3. **أضف متغيرات البيئة:**
   ```
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```
4. **انشر المشروع**

انظر [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) للتفاصيل الكاملة.

## 🧪 الاختبار

### اختبار الباك إند
```bash
# اختبار شامل
node test-api.js

# اختبار سريع
quick-test.bat

# اختبار PowerShell
.\test-api.ps1
```

### اختبار الفرونت إند
```bash
# بعد النشر على Vercel
node test-frontend.js
```

### اختبار تفاعلي
افتح [api-test.html](./api-test.html) في المتصفح لاختبار API.

## 📁 هيكل المشروع

```
freelance/
├── src/                    # الفرونت إند
│   ├── components/         # مكونات React
│   ├── services/          # خدمات API
│   └── lib/               # أدوات مساعدة
├── backend/               # الباك إند
│   ├── controllers/       # وحدات التحكم
│   ├── models/           # نماذج البيانات
│   ├── routes/           # مسارات API
│   └── middleware/       # وسائط البرمجية
├── docs/                 # التوثيق
└── tests/                # ملفات الاختبار
```

## 🔧 التكوين

### متغيرات البيئة

#### الفرونت إند (.env)
```bash
VITE_API_URL=https://your-railway-app.railway.app/api
VITE_APP_NAME=Freelance Daily Entries
```

#### الباك إند
```bash
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=*
```

## 📊 API Endpoints

### المصادقة
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/profile` - جلب الملف الشخصي
- `PUT /api/auth/change-password` - تغيير كلمة المرور

### المدخلات اليومية
- `GET /api/daily-entries` - جلب المدخلات
- `POST /api/daily-entries` - إنشاء مدخل جديد
- `PUT /api/daily-entries/:id` - تحديث مدخل
- `DELETE /api/daily-entries/:id` - حذف مدخل

### الإدارة
- `GET /api/admin/users` - جلب جميع المستخدمين
- `PUT /api/admin/users/deductions` - تحديث الخصميات
- `GET /api/admin/stats` - إحصائيات النظام

انظر [API_TESTING.md](./API_TESTING.md) للتفاصيل الكاملة.

## 🤝 المساهمة

1. **Fork المشروع**
2. **انشئ branch جديد** (`git checkout -b feature/AmazingFeature`)
3. **Commit التغييرات** (`git commit -m 'Add some AmazingFeature'`)
4. **Push إلى Branch** (`git push origin feature/AmazingFeature`)
5. **افتح Pull Request**

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT. انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

إذا واجهت أي مشاكل:

1. **تحقق من [المشاكل الشائعة](./docs/TROUBLESHOOTING.md)**
2. **راجع [التوثيق](./docs/)**
3. **افتح Issue جديد**

## 🎯 الطريق المستقبلي

- [ ] إضافة إشعارات push
- [ ] دعم الملفات المتعددة
- [ ] تقارير PDF
- [ ] تطبيق موبايل
- [ ] دعم متعدد اللغات

---

**🎉 شكراً لاستخدام Freelance Daily Entries App!**
