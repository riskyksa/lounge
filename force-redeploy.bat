@echo off
echo ========================================
echo   إجبار إعادة النشر على Vercel
echo ========================================
echo.

echo 1. بناء التطبيق...
call npm run build

echo.
echo 2. إضافة commit فارغ لإجبار إعادة النشر...
git add .
git commit -m "Force redeploy to fix Convex issue - $(date /t)"
git push

echo.
echo ========================================
echo   تم إرسال التحديث إلى GitHub
echo ========================================
echo.
echo الخطوات التالية:
echo 1. انتظر حتى يكتمل النشر في Vercel
echo 2. اذهب إلى Vercel Dashboard
echo 3. تأكد من حذف متغيرات Convex
echo 4. أضف VITE_API_URL الصحيح
echo 5. اختبر التطبيق
echo.
pause 