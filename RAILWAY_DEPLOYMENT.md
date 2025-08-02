# 🚀 دليل رفع المشروع على Railway

## 📋 المتطلبات المسبقة

1. **حساب Railway**: https://railway.app/
2. **GitHub Repository**: المشروع يجب أن يكون على GitHub
3. **MongoDB Atlas**: قاعدة بيانات MongoDB في السحابة

---

## 🔧 إعداد المشروع للنشر

### 1. **تحديث ملف server.js**
```javascript
// تأكد من أن الكود يدعم Railway
const PORT = process.env.PORT || 5000;
```

### 2. **إعدادات البيئة المطلوبة**
```env
# Railway Environment Variables
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 🚀 خطوات النشر على Railway

### **الخطوة 1: إنشاء مشروع جديد على Railway**

1. اذهب إلى https://railway.app/
2. اضغط على **"Start a New Project"**
3. اختر **"Deploy from GitHub repo"**
4. اربط حساب GitHub الخاص بك
5. اختر repository المشروع

### **الخطوة 2: إعداد المشروع**

1. **اختر مجلد الباك إند**:
   - في Railway، اختر مجلد `backend` كـ Root Directory
   - أو انشر مجلد `backend` كـ service منفصل

2. **إعداد Environment Variables**:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

### **الخطوة 3: إعداد قاعدة البيانات**

1. **إضافة MongoDB Service**:
   - في Railway، اضغط **"New Service"**
   - اختر **"Database"** → **"MongoDB"**
   - Railway سيقوم بإنشاء MongoDB instance

2. **ربط قاعدة البيانات**:
   - انسخ `MONGODB_URI` من MongoDB service
   - أضفه كـ Environment Variable في Backend service

### **الخطوة 4: النشر**

1. **Deploy Automatically**:
   - Railway سيقوم بالنشر تلقائياً عند push للـ repository
   - أو اضغط **"Deploy Now"** للنشر اليدوي

2. **مراقبة النشر**:
   - اذهب إلى **"Deployments"** tab
   - راقب عملية البناء والنشر

---

## 🔍 اختبار النشر

### **1. فحص Health Check**
```bash
curl https://your-railway-app.railway.app/api/health
```

### **2. اختبار API**
```bash
# Register user
curl -X POST https://your-railway-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","username":"testuser"}'
```

### **3. فحص Logs**
- اذهب إلى **"Logs"** tab في Railway
- تأكد من عدم وجود أخطاء

---

## 🌐 إعداد النطاق المخصص (Custom Domain)

### **1. إضافة Domain**
1. اذهب إلى **"Settings"** → **"Domains"**
2. اضغط **"Generate Domain"** أو أضف domain مخصص
3. Railway سيعطيك URL مثل: `https://your-app-name.railway.app`

### **2. إعداد CORS**
```env
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 📱 ربط الفرونت إند

### **1. تحديث API URL**
```typescript
// في src/services/api.ts
const API_BASE_URL = 'https://your-railway-app.railway.app/api';
```

### **2. إعداد Environment Variables للفرونت إند**
```env
VITE_API_URL=https://your-railway-app.railway.app/api
```

---

## 🔧 إعدادات متقدمة

### **1. إعداد Health Check**
```javascript
// في server.js
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});
```

### **2. إعداد File Upload**
```javascript
// تأكد من أن مجلد uploads موجود
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
```

### **3. إعداد Error Handling**
```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});
```

---

## 🚨 حل المشاكل الشائعة

### **1. مشكلة في الاتصال بقاعدة البيانات**
```bash
# تأكد من صحة MONGODB_URI
# تأكد من أن IP address مسموح في MongoDB Atlas
```

### **2. مشكلة في CORS**
```javascript
// تأكد من إعداد CORS بشكل صحيح
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

### **3. مشكلة في File Upload**
```javascript
// تأكد من وجود مجلد uploads
// تأكد من صلاحيات الكتابة
```

### **4. مشكلة في Environment Variables**
- تأكد من إضافة جميع المتغيرات المطلوبة
- تأكد من عدم وجود مسافات إضافية

---

## 📊 مراقبة الأداء

### **1. Railway Metrics**
- **CPU Usage**: مراقبة استخدام المعالج
- **Memory Usage**: مراقبة استخدام الذاكرة
- **Network**: مراقبة حركة البيانات

### **2. Logs**
- **Application Logs**: سجلات التطبيق
- **Build Logs**: سجلات البناء
- **Deployment Logs**: سجلات النشر

---

## 🔄 التحديثات المستقبلية

### **1. النشر التلقائي**
- Railway يتكامل مع GitHub
- كل push للـ main branch سيؤدي لنشر تلقائي

### **2. Rollback**
- يمكن العودة لإصدار سابق من **"Deployments"** tab

### **3. Environment Variables**
- يمكن تحديث Environment Variables بدون إعادة نشر

---

## ✅ قائمة التحقق النهائية

- [ ] تم إنشاء مشروع على Railway
- [ ] تم ربط GitHub repository
- [ ] تم إضافة MongoDB service
- [ ] تم إعداد Environment Variables
- [ ] تم النشر بنجاح
- [ ] تم اختبار Health Check
- [ ] تم اختبار API endpoints
- [ ] تم إعداد Custom Domain (اختياري)
- [ ] تم ربط الفرونت إند بالباك إند الجديد

---

## 🎉 النتيجة النهائية

بعد اتباع هذه الخطوات، ستحصل على:
- ✅ **Backend API** يعمل على Railway
- ✅ **MongoDB Database** في السحابة
- ✅ **Custom Domain** (اختياري)
- ✅ **Auto-deployment** من GitHub
- ✅ **Monitoring & Logs** متاحة

**URL النهائي**: `https://your-app-name.railway.app` 