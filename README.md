# Z-Link | Ứng Dụng Rút Gọn URL Thông Minh & Cao Cấp

Z-Link là một ứng dụng rút gọn URL chất lượng cao, có hiệu năng tốt, giao diện hiện đại (UX/UI cao cấp), hỗ trợ các tính năng thiết thực và hệ thống kiểm thử tự động (Unit Test). Dự án được tối ưu hóa toàn diện cho việc triển khai trên hạ tầng Serverless (Vercel + Supabase).

---

## 🌟 Tính Năng Nổi Bật

- **Rút Gọn URL Siêu Tốc**: Chuyển đổi các đường link cồng kềnh thành liên kết ngắn gọn ngẫu nhiên chỉ gồm 6 ký tự.
- **Tùy Chọn Mã Rút Gọn (Custom Alias)**: Cho phép người dùng tự đặt tên đuôi cho URL rút gọn (ví dụ: `z-link.vn/my-project`).
- **Tự Động Lấy Tiêu Đề Website (Auto Title Fetching)**: Hệ thống tự động fetch và làm sạch tiêu đề HTML của link gốc trên backend để hiển thị trực quan trong lịch sử.
- **Tạo Mã QR Code Động**: Tự động sinh mã QR Code hoàn toàn ở Client-side (sử dụng thư viện `qrcode` offline, không phụ thuộc API bên thứ 3) với tính năng tải xuống trực tiếp.
- **Đồng Bộ Lượt Click Real-time**: Lịch sử liên kết được lưu trữ riêng tư ở `localStorage` của người dùng và tự động đồng bộ số lượt click mới nhất từ server thông qua một API thống kê tổng hợp hiệu năng cao.
- **Dashboard & Biểu Đồ Trực Quan**: Biểu đồ cột SVG hiển thị danh sách 5 liên kết được click nhiều nhất.
- **Dark/Light Mode Cao Cấp**: Hỗ trợ chuyển đổi giao diện sáng/tối mượt mà (sử dụng CSS Variables) và không bị nhấp nháy trắng khi tải trang (nhờ inline blocking script).
- **Thiết Kế Glassmorphism**: UX/UI hiện đại với hiệu ứng kính mờ, gradient sinh động, micro-animations và hoàn toàn responsive trên di động/máy tính.
- **Hệ Thống Unit Test Đầy Đủ**: Đã viết sẵn các kịch bản kiểm thử tự động bằng Vitest để xác minh tính ổn định của mã nguồn.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Framework**: Next.js 14+ (App Router) & TypeScript.
- **Styling**: Vanilla CSS & CSS Modules (Tối ưu hóa hiệu năng render, không dùng Tailwind CSS theo cấu hình chuẩn).
- **ORM**: Prisma ORM.
- **Database**: SQLite (dùng cho môi trường Local Development) và PostgreSQL (dùng cho môi trường Production).
- **Testing**: Vitest.
- **QR Code**: `qrcode` (Client-side PNG Generator).

---

## 📁 Cấu Trúc Dự Án

```text
├── prisma/
│   ├── schema.prisma       # Định nghĩa Schema Database (Prisma)
│   └── dev.db              # Database SQLite cục bộ (chỉ có ở local)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── shorten/
│   │   │   │   └── route.ts  # API nhận URL gốc và tạo mã rút gọn
│   │   │   └── stats/
│   │   │       └── route.ts  # API cập nhật thống kê lượt click số lượng lớn
│   │   ├── [code]/
│   │   │   └── route.ts      # Server Route xử lý chuyển hướng (Redirect 302) và đếm click
│   │   ├── globals.css       # CSS Variables, reset, font và các animation toàn cục
│   │   ├── layout.tsx        # Cấu hình Layout gốc & script chống nháy theme
│   │   ├── page.tsx          # Giao diện chính của trang chủ (Client Component)
│   │   └── page.module.css   # CSS Module cho trang chủ
│   ├── lib/
│   │   ├── db.ts             # Prisma Client Singleton kết nối Database
│   │   ├── shortener.ts      # Logic core: sinh code base62, check trùng, validate URL
│   │   └── shortener.test.ts # Bộ Unit Test cho logic rút gọn URL
├── package.json              # Khai báo các scripts và dependencies
├── tsconfig.json             # Cấu hình TypeScript
└── next.config.ts            # Cấu hình Next.js
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ (Local)

### 1. Chuẩn bị

Máy tính của bạn cần được cài đặt sẵn:

- **Node.js**: Phiên bản 18.x trở lên (khuyên dùng v20.x).
- **npm** (đi kèm Node.js).

### 2. Cài đặt các gói thư viện

Tại thư mục gốc của dự án, chạy lệnh:

```bash
npm install
```

### 3. Tạo file cấu hình môi trường `.env`

Nhân bản file `.env` hoặc tạo mới file `.env` ở thư mục gốc với nội dung:

```env
DATABASE_URL="file:./dev.db"
```

### 4. Khởi tạo database và đồng bộ Schema

Chạy lệnh Prisma để khởi tạo file DB SQLite (`dev.db`) và sinh Client:

```bash
npx prisma migrate dev --name init
```

### 5. Khởi động Server Phát Triển (Dev Mode)

Chạy server local:

```bash
npm run dev
```

Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000).

---

## 🧪 Hướng Dẫn Chạy Unit Tests

Để xác thực độ chính xác của logic sinh mã rút gọn và kiểm tra định dạng URL, bạn có thể chạy bộ test suite tự động bằng lệnh:

```bash
npm run test
```

Vitest sẽ chạy kiểm thử và xuất ra báo cáo kết quả ngay trên Terminal.

---

## 🌐 Hướng Dẫn Deploy Dự Án Lên Internet

Để ứng dụng hoạt động công khai, phương án tối ưu và miễn phí 100% là kết hợp **Vercel** (hosting frontend/API) và **Supabase/Neon** (hỗ trợ database PostgreSQL).

### Bước 1: Đẩy mã nguồn lên GitHub cá nhân

1. Tạo một repository trống trên trang GitHub của bạn (ví dụ đặt tên là `zlink-url-shortener`).
2. Mở terminal tại thư mục dự án và thực hiện các lệnh sau:
   ```bash
   git init
   git add .
   git commit -m "feat: init URL shortener project"
   git branch -M main
   git remote add origin https://github.com/<tên-user-của-bạn>/<tên-repo-của-bạn>.git
   git push -u origin main
   ```

### Bước 2: Tạo Cơ Sở Dữ Liệu PostgreSQL miễn phí

1. Truy cập **[Supabase](https://supabase.com)** hoặc **[Neon](https://neon.tech)** và đăng ký một tài khoản miễn phí.
2. Tạo một Project mới. Sau khi project được tạo thành công, bạn sẽ nhận được một đường dẫn kết nối Database (Database Connection String).
3. Lấy chuỗi kết nối dạng URL có định dạng tương tự như sau:
   `postgresql://postgres:<password>@<host-name>.supabase.co:5432/postgres?sslmode=require`

### Bước 3: Deploy lên Vercel

1. Đăng nhập vào **[Vercel](https://vercel.com)** bằng tài khoản GitHub của bạn.
2. Bấm nút **Add New** -> **Project**.
3. Chọn repository chứa mã nguồn Z-Link bạn vừa đẩy lên ở Bước 1 và bấm **Import**.
4. Tại phần **Environment Variables**, thêm biến môi trường sau:
   - **Key**: `DATABASE_URL`
   - **Value**: _Dán chuỗi kết nối PostgreSQL thu được ở Bước 2 vào đây._
5. Tại phần **Build & Development Settings**, cài đặt mặc định của dự án đã tự động cấu hình chạy:
   - Build Command: `prisma generate && next build` (điều này đảm bảo Prisma Client được build lại tương thích với môi trường serverless).
6. Bấm nút **Deploy** và chờ khoảng 1-2 phút để hoàn tất.
7. Vercel sẽ cung cấp cho bạn một link test công khai có đuôi `.vercel.app`.

### Bước 4: Đồng bộ cấu hình Database lên Server

Sau khi cấu hình biến môi trường trên Vercel, để khởi tạo các bảng vật lý trên Postgres của Supabase/Neon, bạn chỉ cần mở terminal ở máy local (nơi đã khai báo Database URL production) hoặc cấu hình Vercel build command chạy:

```bash
npx prisma db push
```

Lệnh này sẽ tự động đẩy toàn bộ cấu trúc Schema (`ShortUrl` model) lên cloud database mà không cần tạo lịch sử migration phức tạp.

---

## 📊 Mô Hình Schema Database

Ứng dụng sử dụng một bảng duy nhất mang tên `ShortUrl` để lưu trữ dữ liệu với hiệu năng cực cao nhờ đánh chỉ mục (Index) trên các cột truy vấn thường xuyên:

```prisma
model ShortUrl {
  id          String   @id @default(cuid())
  originalUrl String   // Đường dẫn URL gốc cần chuyển hướng
  shortCode   String   @unique // Mã rút gọn duy nhất (nhận diện trên path)
  title       String?  // Tiêu đề của trang web phục vụ UX
  clicks      Int      @default(0) // Số lượt click chuyển hướng
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([shortCode])   // Đánh index tăng tốc độ redirect
  @@index([originalUrl]) // Đánh index tăng tốc độ tìm kiếm trùng lặp
}
```
