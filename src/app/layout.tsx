import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Z-Link | Rút Gọn URL Thông Minh & Nhanh Chóng',
  description: 'Ứng dụng rút gọn link miễn phí, nhanh chóng và an toàn. Hỗ trợ tùy chỉnh mã rút gọn, theo dõi thống kê lượt click real-time và tạo mã QR Code động.',
  keywords: ['url shortener', 'rut gon url', 'rut gon link', 'short link', 'qrcode url', 'rut gon link mien phi'],
  authors: [{ name: 'Antigravity Developer' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Inline script ngăn chặn hiện tượng nháy trắng khi chuyển theme ở phía client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
