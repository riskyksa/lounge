# دليل التحويل من Convex إلى Node.js + Express

هذا الدليل يشرح كيفية تحويل مشروعك من Convex إلى Node.js + Express + MongoDB.

## 📋 المحتويات

1. [نظرة عامة على التحويل](#نظرة-عامة-على-التحويل)
2. [إعداد الباك إند الجديد](#إعداد-الباك-إند-الجديد)
3. [تحويل النماذج والوظائف](#تحويل-النماذج-والوظائف)
4. [ربط الفرونت إند](#ربط-الفرونت-إند)
5. [نقاط مهمة](#نقاط-مهمة)

## 🔄 نظرة عامة على التحويل

### ما تم تحويله:

| Convex Function | Node.js Equivalent | Status |
|----------------|-------------------|---------|
| `createUserProfile` | `POST /api/auth/register` | ✅ |
| `checkUserProfile` | `GET /api/auth/profile` | ✅ |
| `getUserProfile` | `GET /api/users/:userId` | ✅ |
| `getDailyEntries` | `GET /api/daily-entries` | ✅ |
| `upsertDailyEntry` | `POST/PUT /api/daily-entries` | ✅ |
| `deleteDailyEntry` | `DELETE /api/daily-entries/:id` | ✅ |
| `getMonthlyAdvances` | `GET /api/daily-entries/monthly-advances` | ✅ |
| `getAllUsers` | `GET /api/admin/users` | ✅ |
| `updateUserDeductions` | `PUT /api/admin/users/deductions` | ✅ |
| `updateUsername` | `PUT /api/admin/users/username` | ✅ |
| `deleteUser` | `DELETE /api/admin/users/:id` | ✅ |
| `completeSystemReset` | `POST /api/admin/system-reset` | ✅ |

## 🚀 إعداد الباك إند الجديد

### 1. تثبيت التبعيات

```bash
cd backend
npm install
```

### 2. إعداد المتغيرات البيئية

```bash
cp config.env.example .env
```

ثم قم بتعديل ملف `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/freelance_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. تشغيل الخادم

```bash
# للتطوير
npm run dev

# للإنتاج
npm start
```

## 🔧 تحويل النماذج والوظائف

### تحويل Schema إلى Mongoose Models

#### Convex Schema:
```typescript
// convex/schema.ts
userProfiles: defineTable({
  userId: v.id("users"),
  username: v.string(),
  isAdmin: v.boolean(),
  deductions: v.optional(v.number()),
  createdAt: v.number(),
})
```

#### Mongoose Model:
```javascript
// backend/models/User.js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false },
  deductions: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### تحويل Mutations إلى REST API

#### Convex Mutation:
```typescript
// convex/userProfiles.ts
export const createUserProfile = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    // ... logic
  },
});
```

#### Express Controller:
```javascript
// backend/controllers/authController.js
const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    // ... logic
    const user = new User({ email, password, username });
    await user.save();
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', user });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};
```

### تحويل Queries إلى GET Endpoints

#### Convex Query:
```typescript
// convex/dailyEntries.ts
export const getDailyEntries = query({
  args: { targetUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // ... logic
  },
});
```

#### Express Controller:
```javascript
// backend/controllers/dailyEntriesController.js
const getDailyEntries = async (req, res) => {
  try {
    const { targetUserId, year, month } = req.query;
    // ... logic
    const entries = await DailyEntry.find(query).populate('userId');
    res.json({ entries, count: entries.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get daily entries' });
  }
};
```

## 🔗 ربط الفرونت إند

### 1. إنشاء خدمة API

تم إنشاء `src/services/api.ts` للربط مع الباك إند الجديد.

### 2. تحديث المكونات

#### مثال: تحديث نموذج تسجيل الدخول

```typescript
// قبل (Convex)
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const login = useMutation(api.auth.login);

// بعد (Node.js)
import apiService from "../services/api";

const handleLogin = async (credentials) => {
  try {
    const response = await apiService.login(credentials);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### 3. إضافة متغيرات البيئة للفرونت إند

```bash
# .env
VITE_API_URL=http://localhost:5000/api
```

## 📝 نقاط مهمة

### 1. الاختلافات الرئيسية

| Aspect | Convex | Node.js |
|--------|--------|---------|
| **Authentication** | Built-in auth system | JWT tokens |
| **Real-time** | Automatic subscriptions | WebSocket needed |
| **Database** | Convex database | MongoDB |
| **File Upload** | Built-in file storage | Multer middleware |
| **Validation** | Convex validators | Express-validator |

### 2. التحويلات المطلوبة في الفرونت إند

#### إزالة Convex imports:
```typescript
// إزالة هذه الأسطر
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
```

#### استبدال بـ API service:
```typescript
// إضافة هذا
import apiService from "../services/api";
```

#### تحديث استدعاءات API:
```typescript
// قبل
const entries = useQuery(api.dailyEntries.getDailyEntries, { year: 2024 });

// بعد
const [entries, setEntries] = useState([]);
useEffect(() => {
  apiService.getDailyEntries({ year: 2024 }).then(setEntries);
}, []);
```

### 3. إدارة الحالة (State Management)

#### قبل (Convex):
```typescript
const user = useQuery(api.userProfiles.checkUserProfile);
```

#### بعد (Node.js):
```typescript
const [user, setUser] = useState(null);

useEffect(() => {
  if (apiService.isAuthenticated()) {
    apiService.getProfile().then(response => setUser(response.user));
  }
}, []);
```

### 4. معالجة الأخطاء

#### Convex:
```typescript
try {
  await mutation();
} catch (error) {
  // Convex handles errors automatically
}
```

#### Node.js:
```typescript
try {
  await apiService.createDailyEntry(data);
} catch (error) {
  setError(error.message);
}
```

## 🔒 الأمان

### 1. JWT Authentication
- جميع الـ endpoints محمية بـ JWT
- Token يتم تخزينه في localStorage
- Middleware للتحقق من الصلاحيات

### 2. Input Validation
- استخدام express-validator
- التحقق من صحة البيانات
- رسائل خطأ بالعربية

### 3. File Upload Security
- فحص أنواع الملفات
- تحديد حجم الملفات
- حماية من الملفات الضارة

## 📁 هيكل المشروع الجديد

```
project/
├── backend/                 # Node.js Backend
│   ├── controllers/         # API Controllers
│   ├── middleware/          # Auth & Upload Middleware
│   ├── models/             # Mongoose Models
│   ├── routes/             # API Routes
│   ├── uploads/            # Uploaded Files
│   ├── server.js           # Main Server File
│   └── package.json
├── src/                    # React Frontend
│   ├── services/           # API Service
│   ├── components/         # React Components
│   └── ...
└── README.md
```

## 🚀 خطوات التشغيل

### 1. تشغيل الباك إند
```bash
cd backend
npm install
cp config.env.example .env
# تعديل .env
npm run dev
```

### 2. تشغيل الفرونت إند
```bash
npm install
# إضافة VITE_API_URL في .env
npm run dev
```

### 3. اختبار النظام
- تسجيل مستخدم جديد
- تسجيل الدخول
- إنشاء مدخل يومي
- رفع ملفات
- اختبار صلاحيات المدير

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:

1. **CORS Error**: تأكد من إعداد `CORS_ORIGIN` في `.env`
2. **MongoDB Connection**: تأكد من تشغيل MongoDB
3. **JWT Error**: تأكد من إعداد `JWT_SECRET`
4. **File Upload**: تأكد من وجود مجلد `uploads`

### Debug Tips:
- تحقق من console في المتصفح
- تحقق من logs في terminal الباك إند
- استخدم Postman لاختبار API endpoints

## 📞 الدعم

لأي استفسارات أو مشاكل:
1. تحقق من logs
2. راجع هذا الدليل
3. تحقق من ملفات README
4. تواصل مع فريق التطوير

---

**ملاحظة**: هذا التحويل يحافظ على جميع الوظائف الموجودة مع إضافة مميزات جديدة مثل رفع الملفات وتحسين الأمان. 