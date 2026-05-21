import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { isValidUrl, generateUniqueShortCode } from '@/lib/shortener';

// Hàm lấy tiêu đề trang web một cách an toàn
async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout 2s

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    
    if (match && match[1]) {
      // Decode một số ký tự thực thể HTML cơ bản và dọn dẹp khoảng trắng
      let title = match[1].trim();
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
      return title.length > 100 ? title.substring(0, 97) + '...' : title;
    }
    return null;
  } catch {
    return null; // Bỏ qua lỗi nếu không fetch được title
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, customCode } = body;

    // 1. Kiểm tra tính hợp lệ của URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL không được để trống.' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json(
        { error: 'Định dạng URL không hợp lệ. Vui lòng nhập đầy đủ http:// hoặc https://' },
        { status: 400 }
      );
    }

    let shortCode = '';

    // 2. Xử lý Custom Code nếu người dùng nhập
    if (customCode && typeof customCode === 'string') {
      const trimmedCustom = customCode.trim();
      
      // Validate định dạng mã tự chọn (chỉ chữ, số, gạch ngang, gạch dưới, từ 3-20 ký tự)
      const codeRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!codeRegex.test(trimmedCustom)) {
        return NextResponse.json(
          { error: 'Mã rút gọn tự chọn chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-), gạch dưới (_) và dài từ 3-20 ký tự.' },
          { status: 400 }
        );
      }

      // Check xem mã tự chọn đã được sử dụng chưa
      const existing = await db.shortUrl.findUnique({
        where: { shortCode: trimmedCustom },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Mã rút gọn tự chọn này đã được sử dụng. Vui lòng chọn mã khác.' },
          { status: 400 }
        );
      }

      shortCode = trimmedCustom;
    } else {
      // 3. Nếu không có custom code, kiểm tra xem URL này đã từng được rút gọn chưa để tái sử dụng (chỉ áp dụng mã sinh ngẫu nhiên)
      const existingUrl = await db.shortUrl.findFirst({
        where: { originalUrl: trimmedUrl, shortCode: { not: { contains: '_' } } }, // Tránh trùng với custom code nếu có chứa ký tự đặc biệt
      });

      if (existingUrl) {
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const shortUrl = `${protocol}://${host}/${existingUrl.shortCode}`;
        
        return NextResponse.json({
          ...existingUrl,
          shortUrl,
        });
      }

      // Sinh mã ngẫu nhiên duy nhất
      shortCode = await generateUniqueShortCode();
    }

    // 4. Lấy tiêu đề trang web gốc (chạy bất đồng bộ nhanh)
    const title = await fetchPageTitle(trimmedUrl);

    // 5. Lưu vào Database
    const newShortUrl = await db.shortUrl.create({
      data: {
        originalUrl: trimmedUrl,
        shortCode,
        title: title || 'Liên kết rút gọn',
      },
    });

    // 6. Tạo đường dẫn rút gọn đầy đủ
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const shortUrl = `${protocol}://${host}/${shortCode}`;

    return NextResponse.json(
      {
        ...newShortUrl,
        shortUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi khi rút gọn URL:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
