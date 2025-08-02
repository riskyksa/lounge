import { useState, useEffect, useRef } from "react";
import apiService from "../services/api";
import { toast } from "sonner";

interface DayViewProps {
  date: string;
  onBack: () => void;
  userId: string;
  isAdmin: boolean;
}

export function DayView({ date, onBack, userId, isAdmin }: DayViewProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [monthlyAdvances, setMonthlyAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const entry = entries?.find(e => e.date === new Date(date).toISOString().slice(0, 10));
  const yearMonth = date.substring(0, 7);

  const [formData, setFormData] = useState({

    cashAmount: '',
    networkAmount: '',
    purchasesAmount: '',
    advanceAmount: '',
    notes: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const entriesResponse = await apiService.getDailyEntries({ userId });
      if (entriesResponse.entries) setEntries(entriesResponse.entries);

      const userResponse = await apiService.getUser(userId);
      if (userResponse.user) setUserProfile(userResponse.user);

      const advancesResponse = await apiService.getMonthlyAdvances({ yearMonth, userId });
      if (advancesResponse.advances) setMonthlyAdvances(advancesResponse.advances);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, yearMonth]);

  useEffect(() => {
    if (entry) {
      setFormData({
        cashAmount: entry.cashAmount || '',
        networkAmount: entry.networkAmount || '',
        purchasesAmount: entry.purchasesAmount || '',
        advanceAmount: entry.advanceAmount || '',
        notes: entry.notes || '',
      });
    } else {
      setFormData({
        cashAmount: '',
        networkAmount: '',
        purchasesAmount: '',
        advanceAmount: '',
        notes: '',
      });
    }
  }, [entry]);

  useEffect(() => {
    const urls = selectedFiles.map(file =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    );
    setPreviewUrls(urls);

    return () => {
      urls.forEach(url => { if (url) URL.revokeObjectURL(url); });
    };
  }, [selectedFiles]);

  const addFileOrShowError = (file: File) => {
    if (selectedFiles.length >= 5) {
      toast.error("لا يمكنك رفع أكثر من 5 ملفات في نفس اليوم.");
      return;
    }
    setSelectedFiles(prev => [...prev, file]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      let added = 0;
      filesArray.forEach(file => {
        if (selectedFiles.length + added < 5) {
          addFileOrShowError(file);
          added++;
        } else {
          toast.error("لا يمكنك رفع أكثر من 5 ملفات في نفس اليوم.");
        }
      });

      // إعادة تعيين قيمة الـ input حتى يعمل الحدث في كل مرة
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanDate = toYMD(date);
      if (!cleanDate || !userId) {
        toast.error("خطأ في النظام: التاريخ أو المستخدم غير محدد");
        return;
      }

      const dataToSend = {
        date: cleanDate,
        cashAmount: formData.cashAmount ? parseFloat(formData.cashAmount) : 0,
        networkAmount: formData.networkAmount ? parseFloat(formData.networkAmount) : 0,
        purchasesAmount: formData.purchasesAmount ? parseFloat(formData.purchasesAmount) : 0,
        advanceAmount: formData.advanceAmount ? parseFloat(formData.advanceAmount) : 0,
        notes: formData.notes || '',
        targetUserId: userId
      };
      console.log("📦 Final Payload:", dataToSend);
      console.log('Data being sent:', dataToSend);
      console.log('🚀 Entry Date:', date);
      console.log('📅 Transformed:', toYMD(date));

      let response;
      if (entry && isEditing) {
        response = await apiService.updateDailyEntry(entry._id, dataToSend, selectedFiles);
      } else {
        response = await apiService.createDailyEntry(dataToSend, selectedFiles);
      }

      if (response.entry) {
        toast.success(entry && isEditing ? "تم تعديل البيانات بنجاح" : "تم إضافة البيانات بنجاح");
        setSelectedFiles([]);
        setPreviewUrls([]);
        setIsEditing(false);
        await fetchData();
      }
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      toast.error(errorMessage || "حدث خطأ أثناء الحفظ. يرجى التحقق من البيانات والمحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !isAdmin) return;
    if (!confirm("هل أنت متأكد من حذف هذا المدخل؟")) return;

    setLoading(true);
    try {
      const response = await apiService.deleteDailyEntry(entry._id);
      if (response) {
        toast.success("تم حذف المدخل بنجاح");
        onBack();
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف المدخل");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const total = safeNumber(formData.cashAmount) + safeNumber(formData.networkAmount);
  const deductions = userProfile?.deductions || 0;
  const advances = safeNumber(formData.advanceAmount);
  const remaining = total - safeNumber(formData.purchasesAmount);

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
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              📅 {formatDate(date)}
            </h2>
            {userProfile && (
              <p className="text-sm text-gray-600 mt-1">
                👤 {userProfile.username}
                {userProfile.isAdmin && <span className="text-red-600 mr-2">👑</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">

          {entry && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={!isAdmin}
            >
              ✏️ تعديل
            </button>
          )}

          {entry && isAdmin && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              disabled={loading}
            >
              🗑️ حذف
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            💰 البيانات المالية
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💵 مبلغ الكاش
                </label>
                <input
                  type="number"
                  value={formData.cashAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cashAmount: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={entry && !isEditing}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💳 مبلغ الشبكة
                </label>
                <input
                  type="number"
                  value={formData.networkAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, networkAmount: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={entry && !isEditing}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🛒 مبلغ المشتريات
                </label>
                <input
                  type="number"
                  value={formData.purchasesAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchasesAmount: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={entry && !isEditing}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💸 مبلغ السلفيات
                </label>
                <input
                  type="number"
                  value={formData.advanceAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={entry && !isEditing}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📉 الخصميات الثابتة
              </label>
              <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                {deductions.toLocaleString()} ر.س
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * يتم خصم هذا المبلغ من مرتبكم يستطيع تعديله المدير الكريم فقط
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 ملاحظات إضافية
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                disabled={entry && !isEditing}
                placeholder="أضف أي ملاحظات هنا..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📷 إضافة صور الفواتير (اختياري)
              </label>
              <div className="flex gap-3 items-center flex-wrap">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={() => setShowImageOptions(true)}
                  disabled={entry && !isEditing}
                >
                  <span role="img" aria-label="camera">📷</span> إضافة صورة/فاتورة
                </button>

                {/* مدخل رفع الصور من الجهاز */}
                <input
                  id="gallery-input"
                  type="file"
                  name="files"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={entry && !isEditing}
                />

                {/* مدخل خاص بالكاميرا فقط */}
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-blue-600">🖼️ اختر صورة محفوظة من جهازك (جاليري/ملفات)</span>
                <span className="text-xs text-orange-600">📸 التقط صورة مباشرة من الكاميرا</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                يمكنك إضافة صور أو ملفات PDF أو Word أو Excel (حد أقصى 5 ملفات، كل ملف 5MB)
              </p>
              <p className="text-xs text-red-500 mt-1 font-bold">
                ⚠️ يجب أن تكون صورة الفاتورة واضحة ومقروءة بالكامل، استخدم الكاميرا في مكان مضيء وركّز على كامل الفاتورة.
              </p>
              {showImageOptions && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4">
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        document.getElementById('gallery-input')?.click();
                        setShowImageOptions(false);
                      }}
                    >
                      🖼️ اختيار من الجهاز
                    </button>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => {
                        document.getElementById('camera-input')?.click();
                        setShowImageOptions(false);
                      }}
                    >
                      📸 تصوير الفاتورة
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      onClick={() => setShowImageOptions(false)}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">الملفات المختارة:</h4>
                  {selectedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    const previewUrl = previewUrls[index];
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {isImage && previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={file.name}
                              className="w-24 h-24 object-contain rounded border cursor-pointer hover:scale-110 transition-transform bg-white shadow"
                              onClick={() => setPreviewImage(previewUrl)}
                            />
                          ) : null}
                          <span className="text-sm text-gray-600">{file.name}</span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                          disabled={entry && !isEditing}
                        >
                          ❌
                        </button>
                      </div>
                    );
                  })}
                  {previewImage && (
                    <div
                      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                      onClick={() => setPreviewImage(null)}
                      style={{ cursor: "zoom-out" }}
                    >
                      <img
                        src={previewImage}
                        className="max-h-[90vh] max-w-[98vw] rounded-lg shadow-2xl border-4 border-white object-contain"
                        style={{ background: "#fff" }}
                      />
                    </div>
                  )}
                </div>
              )}


/* عرض الصور المرفقة الموجودة */

              {entry?.attachments && entry.attachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">الصور المرفقة:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {entry.attachments.map((attachment: any, idx: number) => {
                      const imageUrl = attachment.url || (attachment.filename ? apiService.getFileUrl(attachment.filename) : null);
                      console.log('🖼️ Image URL:', imageUrl, 'for attachment:', attachment);
                      return (
                        <div key={idx} className="relative">
                          {attachment.mimetype?.startsWith('image/') && imageUrl && attachment.filename && attachment.fileExists !== false ? (
                            <>
                              <div className="relative">
                                <img
                                  src={imageUrl}
                                  alt={attachment.originalName}
                                  className="w-full h-40 object-cover bg-white rounded-lg border cursor-pointer transition-transform hover:scale-110"
                                  onClick={() => setPreviewImage(imageUrl)}
                                  onError={(e) => {
                                    console.error('❌ Failed to load image:', imageUrl);
                                    console.error('❌ Error details:', e);
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                  onLoad={() => {
                                    console.log('✅ Image loaded successfully:', imageUrl);
                                  }}
                                  loading="lazy"
                                />
                                <div className="hidden w-full h-40 bg-red-100 rounded-lg border flex items-center justify-center">
                                  <span className="text-xs text-red-600">❌ فشل في تحميل الصورة</span>
                                </div>
                              </div>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await apiService.deleteAttachment(entry._id, attachment._id);
                                      toast.success("تم حذف الصورة");
                                      fetchData();
                                    } catch (err) {
                                      toast.error("حدث خطأ أثناء حذف الصورة. حاول مرة أخرى.");
                                    }
                                  }}
                                  className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 text-xs"
                                >
                                  🗑️
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-lg border flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                {attachment.fileExists === false ? '❌ الملف غير موجود' : '📄 ' + attachment.originalName}
                              </span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await apiService.deleteAttachment(entry._id, attachment._id);
                                      toast.success("تم حذف الملف");
                                      fetchData();
                                    } catch (err) {
                                      toast.error("حدث خطأ أثناء حذف الملف. حاول مرة أخرى.");
                                    }
                                  }}
                                  className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 text-xs"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {previewImage && (
                    <div
                      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                      onClick={() => setPreviewImage(null)}
                      style={{ cursor: "zoom-out" }}
                    >
                      <img
                        src={previewImage}
                        className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg border-4 border-white"
                        style={{ background: "#fff" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {(isEditing || !entry) && (
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "جاري الحفظ..." : (entry ? "💾 حفظ التعديلات" : "➕ إضافة البيانات")}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    ❌ إلغاء
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* ملخص الحسابات */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              📊 ملخص الحسابات
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-700 text-right align-middle">💰 المجموع الكلي</span>
                <span className="text-xl font-bold text-blue-600 text-right align-middle">
                  {total.toLocaleString()} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-gray-700 text-right align-middle">🛒 المشتريات</span>
                <span className="text-xl font-bold text-orange-600 text-right align-middle">
                  -{(Number(formData.purchasesAmount) || 0).toLocaleString()} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-gray-700 text-right align-middle">💸 السلفيات</span>
                <span className="text-xl font-bold text-purple-600 text-right align-middle">
                  -{(Number(formData.advanceAmount) || 0).toLocaleString()} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-gray-700 text-right align-middle">📉 الخصميات</span>
                <span className="text-xl font-bold text-red-600 text-right align-middle">
                  -{deductions.toLocaleString()} ر.س
                </span>
              </div>

              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-700 text-right align-middle">💵 المتبقي النهائي</span>
                  <span className={`text-xl font-bold text-right align-middle ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {remaining.toLocaleString()} ر.س
                  </span>
                </div>
              </div>


            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
            <h4 className="font-semibold text-gray-800 mb-2">💡 معلومات مفيدة</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• المجموع = الكاش + الشبكة</div>
              <div>• المتبقي = المجموع - المشتريات</div>
              <div>• الخصميات الثابتة يحددها المدير</div>
              <div>• السلفيات تراكمية على مدار الشهر</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 1. دالة safeNumber المحسنة

function safeNumber(val: any): number {
  if (val === '' || val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function toYMD(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toArabicNumber(num: number | string) {
  return num.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}
export function arabicToEnglishNumber(str: string) {
  return str.replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
}
