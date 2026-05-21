import { describe, it, expect } from 'vitest';
import { isValidUrl, generateShortCode } from './shortener';

describe('Kiểm thử module xử lý URL (shortener.ts)', () => {
  
  describe('Hàm isValidUrl - Kiểm tra URL hợp lệ', () => {
    it('Nên trả về true cho các URL https hợp lệ', () => {
      expect(isValidUrl('https://google.com')).toBe(true);
      expect(isValidUrl('https://github.com/google/deepmind')).toBe(true);
      expect(isValidUrl('https://vnexpress.net/tin-tuc-24h?page=1')).toBe(true);
    });

    it('Nên trả về true cho các URL http hợp lệ', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000/api')).toBe(true);
    });

    it('Nên trả về false cho URL thiếu protocol', () => {
      expect(isValidUrl('google.com')).toBe(false);
      expect(isValidUrl('www.facebook.com')).toBe(false);
    });

    it('Nên trả về false cho các giao thức không hỗ trợ (ftp, mailto, etc.)', () => {
      expect(isValidUrl('ftp://ftp.example.com')).toBe(false);
      expect(isValidUrl('mailto:admin@domain.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('Nên trả về false cho chuỗi rỗng hoặc định dạng sai lệch', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('random_string')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('https://')).toBe(false);
    });
  });

  describe('Hàm generateShortCode - Sinh mã rút gọn', () => {
    it('Nên sinh ra mã dài đúng 6 ký tự theo mặc định', () => {
      const code = generateShortCode();
      expect(code).toBeTypeOf('string');
      expect(code.length).toBe(6);
    });

    it('Nên sinh ra mã có độ dài tùy biến khi truyền tham số', () => {
      expect(generateShortCode(8).length).toBe(8);
      expect(generateShortCode(12).length).toBe(12);
      expect(generateShortCode(3).length).toBe(3);
    });

    it('Nên chứa các ký tự hợp lệ thuộc bảng base62 (chữ, số)', () => {
      const code = generateShortCode(100);
      const base62Regex = /^[a-zA-Z0-9]+$/;
      expect(base62Regex.test(code)).toBe(true);
    });

    it('Mỗi lần sinh mã nên trả về kết quả khác nhau (ngẫu nhiên)', () => {
      const code1 = generateShortCode();
      const code2 = generateShortCode();
      expect(code1).not.toBe(code2);
    });
  });
});
