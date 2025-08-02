@echo off
echo ========================================
echo   إصلاح سريع لمشكلة Convex
echo ========================================
echo.

echo 1. حذف مجلد dist القديم...
if exist dist rmdir /s /q dist

echo.
echo 2. إعادة بناء التطبيق...
call npm run build

echo.
echo 3. إضافة commit لإجبار إعادة النشر...
git add .
git commit -m "Fix Convex issue - rebuild project"
git push

echo.
echo ========================================
echo   تم إرسال التحديث!
echo ========================================
echo.
echo الخطوات التالية في Vercel:
echo 1. اذهب إلى Vercel Dashboard
echo 2. احذف جميع متغيرات Convex
echo 3. أضف VITE_API_URL = https://web-production-0f21.up.railway.app/api
echo 4. اضغط "Clear Cache and Deploy"
echo.
pause 