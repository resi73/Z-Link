import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codesParam = searchParams.get('codes');

    if (!codesParam) {
      return NextResponse.json({ stats: [] });
    }

    const codes = codesParam
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      return NextResponse.json({ stats: [] });
    }

    // Truy vấn thông tin thống kê của các mã trong danh sách
    const records = await db.shortUrl.findMany({
      where: {
        shortCode: {
          in: codes,
        },
      },
      select: {
        shortCode: true,
        clicks: true,
        title: true,
        originalUrl: true,
      },
    });

    return NextResponse.json({ stats: records });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    return NextResponse.json(
      { error: 'Không thể lấy thông tin thống kê.' },
      { status: 500 }
    );
  }
}
