import db from './db';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Kiểm tra xem một chuỗi có phải là URL hợp lệ hay không.
 * Chỉ hỗ trợ giao thức http và https.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Đảm bảo có protocol http/https và có hostname hợp lệ
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Sinh mã rút gọn ngẫu nhiên với độ dài chỉ định (mặc định là 6 ký tự).
 */
export function generateShortCode(length: number = 6): string {
  let result = '';
  const alphabetLength = ALPHABET.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphabetLength);
    result += ALPHABET[randomIndex];
  }
  return result;
}

/**
 * Sinh mã rút gọn duy nhất bằng cách đối chiếu với database.
 * Thử lại tối đa 10 lần nếu phát hiện trùng lặp trước khi báo lỗi.
 */
export async function generateUniqueShortCode(length: number = 6): Promise<string> {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode(length);
    const existing = await db.shortUrl.findUnique({
      where: { shortCode: code },
      select: { id: true }, // Chỉ select id để tối ưu hiệu năng
    });
    if (!existing) {
      return code;
    }
  }
  throw new Error('Không thể sinh mã rút gọn duy nhất sau 10 lần thử.');
}
