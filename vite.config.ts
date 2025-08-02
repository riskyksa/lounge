import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // تحميل المتغيرات البيئية
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // تأكد من أن المتغيرات البيئية متاحة
      'process.env': env
    },
    server: {
      // إعدادات الخادم المحلي
      port: 5173,
      host: true,
      cors: true
    }
  };
});
