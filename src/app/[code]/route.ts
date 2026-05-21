import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Bỏ qua các file tĩnh phổ biến để tránh query DB không cần thiết
    const ignoredPaths = ['favicon.ico', 'robots.txt', 'sitemap.xml', 'api'];
    if (ignoredPaths.includes(code)) {
      return new NextResponse(null, { status: 404 });
    }

    // Kiểm tra và truy vấn mã rút gọn từ Database
    const record = await db.shortUrl.findUnique({
      where: { shortCode: code },
    });

    if (!record) {
      // Chuyển hướng về trang chủ kèm cờ báo lỗi để hiển thị thông báo thân thiện cho UX
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'not-found');
      homeUrl.searchParams.set('code', code);
      return NextResponse.redirect(homeUrl);
    }

    // Tăng lượt click bất đồng bộ và chuyển hướng người dùng ngay lập tức
    // Sử dụng prisma update để tăng số click lên 1
    await db.shortUrl.update({
      where: { id: record.id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    // Chuyển hướng 302 Found tới URL gốc
    return NextResponse.redirect(record.originalUrl);
  } catch (error) {
    console.error('Lỗi khi chuyển hướng URL:', error);
    // Nếu có lỗi hệ thống, quay về trang chủ
    return NextResponse.redirect(new URL('/', request.url));
  }
}
