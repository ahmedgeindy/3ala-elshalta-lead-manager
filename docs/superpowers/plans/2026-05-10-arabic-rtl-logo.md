# Arabic Support & Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full Arabic RTL support with helpful input hints, and integrate the provided logo/icon into the UI.

**Architecture:** Update `index.html` to `dir="rtl"`. Translate UI text to Arabic and add placeholders. Copy the provided logo to `public/` for use in the app header and favicon.

**Tech Stack:** React, Vanilla CSS.

---

### Task 1: Setup HTML & Assets

**Files:**
- Modify: `index.html`
- Create (via copy): `public/logo.jpeg`

- [ ] **Step 1: Copy the logo file**
```bash
Copy-Item -Path "C:\Users\AG-Dev\Downloads\WhatsApp Image 2026-05-09 at 9.42.00 PM.jpeg" -Destination "public\logo.jpeg" -Force
```

- [ ] **Step 2: Update index.html for RTL and Arabic**
```html
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/jpeg" href="/logo.jpeg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#050507" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <title>على الشلته — Lead Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Commit**
```bash
git add public/logo.jpeg index.html
git commit -m "feat: add logo and configure HTML for RTL Arabic"
```

---

### Task 2: Translate Header & Core Layout

**Files:**
- Modify: `src/components/OperatorApp.tsx`

- [ ] **Step 1: Add Logo and Translate Header in OperatorApp.tsx**
Find the `<div className="app-brand">` and `<div className="app-stats">` sections. Update them to:
```tsx
        <div className="app-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.jpeg" alt="Logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5, color: 'var(--text-primary)' }}>
              على الشلته
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              لوحة تحكم التشغيل
            </span>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="app-stats">
            <span>الحملة: <strong style={{ color: 'var(--text-primary)' }}>{campaign.name || '—'}</strong></span>
            <span className="tabular-nums">
              الإجمالي: <strong style={{ color: 'var(--text-primary)' }}>{stats.total}</strong>
            </span>
            <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              تم الإرسال {stats.sent}
            </span>
            <span style={{ color: 'var(--pending)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              قيد الانتظار {stats.pending}
            </span>
          </div>
        )}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/OperatorApp.tsx
git commit -m "feat: translate operator app header and add logo"
```

---

### Task 3: Translate UploadZone & CampaignPanel

**Files:**
- Modify: `src/components/UploadZone.tsx`
- Modify: `src/components/CampaignPanel.tsx`

- [ ] **Step 1: Translate UploadZone.tsx**
Update text strings to Arabic:
- "Contact File" -> "ملف جهات الاتصال"
- "Reset History" -> "إعادة ضبط السجل"
- "Processing contacts..." -> "جاري معالجة جهات الاتصال..."
- "Reading rows and normalizing phones" -> "جاري قراءة الصفوف وتنظيم الأرقام"
- "click to replace" -> "انقر للاستبدال"
- "Drop CSV or Excel here" -> "اسحب ملف CSV أو Excel هنا"
- `{stats.total} contacts · {stats.pending} pending` -> `{stats.total} جهة اتصال · {stats.pending} قيد الانتظار`

- [ ] **Step 2: Translate CampaignPanel.tsx**
Update fields array:
```tsx
const fields: { key: keyof Campaign; label: string; placeholder: string }[] = [
  { key: 'name',     label: 'اسم الحملة',  placeholder: 'مثال: عرض الصيف ٢٥٪' },
  { key: 'discount', label: '{{discount}}',   placeholder: 'مثال: ٢٥٪' },
  { key: 'duration', label: '{{duration}}',   placeholder: 'مثال: أسبوع' },
  { key: 'url',      label: '{{url}} — رابط القائمة', placeholder: 'https://...' },
];
```
Update section title:
- "Campaign Settings" -> "إعدادات الحملة"
- "Smart Link" -> "رابط ذكي"

- [ ] **Step 3: Commit**
```bash
git add src/components/UploadZone.tsx src/components/CampaignPanel.tsx
git commit -m "feat: translate upload zone and campaign panel"
```

---

### Task 4: Translate SmartMenuEditor & MessageBuilder

**Files:**
- Modify: `src/components/SmartMenuEditor.tsx`
- Modify: `src/components/MessageBuilder.tsx`

- [ ] **Step 1: Translate SmartMenuEditor.tsx**
Replace English labels and placeholders with:
- "Smart Menu Editor" -> "محرر القائمة الذكية"
- "Campaign Name" -> "اسم الحملة" (placeholder: "مثال: عرض الصيف")
- "Slug" -> "الرابط المختصر"
- "Page Title" -> "عنوان الصفحة" (placeholder: "مثال: قائمة عروض خاصة")
- "Offer Headline" -> "عنوان العرض" (placeholder: "مثال: خصم ٢٥٪ على جميع الوجبات")
- "Offer Description" -> "وصف العرض" (placeholder: "تفاصيل العرض...")
- "Order Phone Number" -> "رقم هاتف الطلبات"
- "WhatsApp CTA Message" -> "رسالة زر الواتساب" (placeholder: "الرسالة المجهزة عند الضغط على الطلب عبر الواتساب...")
- "Active" / "Inactive" -> "نشط" / "غير نشط"

- [ ] **Step 2: Translate MessageBuilder.tsx**
Update text:
- "Message Template" -> "قالب الرسالة"
- "WhatsApp Preview —" -> "معاينة واتساب —"
Change the formatting labels in the array:
- 'Bold *text*' -> 'عريض *نص*'
- 'Italic _text_' -> 'مائل _نص_'
- 'Strikethrough ~text~' -> 'مشطوب ~نص~'
- 'Monospace ```text```' -> 'أحادي المسافة ```نص```'

- [ ] **Step 3: Commit**
```bash
git add src/components/SmartMenuEditor.tsx src/components/MessageBuilder.tsx
git commit -m "feat: translate smart menu editor and message builder"
```

---

### Task 5: Translate LeadTable

**Files:**
- Modify: `src/components/LeadTable.tsx`

- [ ] **Step 1: Translate LeadTable.tsx**
Update text strings:
- "Client" -> "العميل"
- "Phone" -> "رقم الهاتف"
- "Status" -> "الحالة"
- "All" -> "الكل"
- "Pending" -> "قيد الانتظار"
- "Sent" -> "تم الإرسال"
- "Search name or phone..." -> "ابحث عن اسم أو رقم..."
- "Export" -> "تصدير"
- "Upload a CSV file to see your leads" -> "قم برفع ملف CSV لرؤية جهات الاتصال"
- "Drag and drop your contact file into the sidebar" -> "اسحب وأفلت ملف جهات الاتصال في الشريط الجانبي"
- "Send to X via WhatsApp" -> "إرسال إلى X عبر واتساب"
- "Clear" -> "مسح"
- "leads selected" -> "جهات اتصال محددة"

- [ ] **Step 2: Commit**
```bash
git add src/components/LeadTable.tsx
git commit -m "feat: translate lead table and adjust text"
```
