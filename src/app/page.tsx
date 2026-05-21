'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import styles from './page.module.css';

interface ShortUrlItem {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title: string | null;
  clicks: number;
  createdAt: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function Home() {
  // --- States ---
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [result, setResult] = useState<ShortUrlItem | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [modalQrItem, setModalQrItem] = useState<ShortUrlItem | null>(null);
  const [modalQrDataUrl, setModalQrDataUrl] = useState('');

  const [history, setHistory] = useState<ShortUrlItem[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- Refs ---
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Hook: Load theme & history on Mount ---
  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Load history
    const savedHistory = localStorage.getItem('zlink_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory) as ShortUrlItem[];
        setHistory(parsedHistory);
        // Đồng bộ số click mới nhất từ server cho các link cũ
        syncClickStats(parsedHistory);
      } catch (e) {
        console.error('Lỗi khi đọc lịch sử từ localStorage:', e);
      }
    }
  }, []);

  // --- Functions ---
  
  // Hiển thị thông báo Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Đồng bộ số lượt click của các liên kết
  const syncClickStats = async (currentHistory: ShortUrlItem[]) => {
    if (currentHistory.length === 0) return;
    
    const codes = currentHistory.map(item => item.shortCode).join(',');
    try {
      const response = await fetch(`/api/stats?codes=${codes}`);
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.stats && Array.isArray(data.stats)) {
        const statsMap = new Map<string, { clicks: number; title: string | null }>();
        data.stats.forEach((s: any) => {
          statsMap.set(s.shortCode, { clicks: s.clicks, title: s.title });
        });

        // Cập nhật lại lịch sử
        const updatedHistory = currentHistory.map(item => {
          const serverStat = statsMap.get(item.shortCode);
          if (serverStat) {
            return {
              ...item,
              clicks: serverStat.clicks,
              title: serverStat.title || item.title
            };
          }
          return item;
        });

        setHistory(updatedHistory);
        localStorage.setItem('zlink_history', JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Lỗi khi đồng bộ thống kê clicks:', error);
    }
  };

  // Bật tắt Light/Dark Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Rút gọn URL
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    if (!url.trim()) {
      setFormError('Vui lòng nhập đường dẫn URL cần rút gọn.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          customCode: customCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        showToast(data.error || 'Có lỗi xảy ra!', 'error');
        setIsLoading(false);
        return;
      }

      setResult(data);

      // Tạo QR Code
      const qrCodeUrl = await QRCode.toDataURL(data.shortUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0f172a', // Đậm màu slate để quét tốt nhất
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(qrCodeUrl);

      // Lưu vào Lịch sử
      const updatedHistory = [data, ...history.filter(item => item.shortCode !== data.shortCode)];
      setHistory(updatedHistory);
      localStorage.setItem('zlink_history', JSON.stringify(updatedHistory));
      
      showToast('Đã rút gọn URL thành công!');
      setUrl('');
      setCustomCode('');
    } catch (err) {
      console.error(err);
      setFormError('Lỗi kết nối server. Vui lòng thử lại sau.');
      showToast('Lỗi kết nối server!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sao chép Link rút gọn vào Clipboard
  const handleCopyLink = async (textUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(textUrl);
      setCopiedId(id);
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Lỗi khi copy:', err);
      showToast('Không thể sao chép liên kết.', 'error');
    }
  };

  // Mở popup QR Code của link trong lịch sử
  const handleOpenQrModal = async (item: ShortUrlItem) => {
    try {
      const qrUrl = await QRCode.toDataURL(item.shortUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setModalQrItem(item);
      setModalQrDataUrl(qrUrl);
    } catch (err) {
      console.error(err);
      showToast('Không thể tạo mã QR cho liên kết này.', 'error');
    }
  };

  // Xóa một dòng lịch sử
  const handleDeleteHistoryItem = (shortCode: string) => {
    const updated = history.filter(item => item.shortCode !== shortCode);
    setHistory(updated);
    localStorage.setItem('zlink_history', JSON.stringify(updated));
    showToast('Đã xóa liên kết khỏi lịch sử.');
  };

  // Xóa toàn bộ lịch sử
  const handleClearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử rút gọn không?')) {
      setHistory([]);
      localStorage.removeItem('zlink_history');
      showToast('Đã xóa sạch lịch sử.');
    }
  };

  // reset form quay lại màn hình nhập
  const handleReset = () => {
    setResult(null);
    setQrCodeDataUrl('');
  };

  // Phân tích biểu đồ: Lấy top 5 URL click nhiều nhất để vẽ Chart
  const topClickedLinks = [...history]
    .sort((a, b) => b.clicks - a.clicks)
    .filter(item => item.clicks > 0)
    .slice(0, 5);

  const maxClicks = topClickedLinks.length > 0 ? Math.max(...topClickedLinks.map(i => i.clicks)) : 0;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        
        {/* --- Header --- */}
        <header className={styles.header}>
          <div className={styles.logo}>
            Z-Link <span className={styles.logoDot}></span>
          </div>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            aria-label="Toggle Theme"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        {/* --- Hero Section --- */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Rút gọn URL của bạn, <br />
            <span className={styles.gradientText}>Mở rộng khả năng tiếp cận</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Z-Link giúp bạn thu gọn các liên kết dài thành liên kết ngắn, dễ nhớ, dễ chia sẻ, hỗ trợ tạo mã QR Code động và cập nhật thống kê clicks tức thì.
          </p>
        </section>

        {/* --- Main Card: Form / Result --- */}
        <section className={styles.card}>
          {!result ? (
            /* --- Form nhập liệu URL --- */
            <form onSubmit={handleShorten} className={styles.form} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="url" className={styles.inputLabel}>
                  <span>Nhập URL gốc cần rút gọn</span>
                  <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <input
                    type="url"
                    id="url"
                    className={`${styles.input} ${formError ? styles.inputError : ''}`}
                    placeholder="https://example.com/very/long/url/path..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {formError && (
                  <span className={styles.errorMessage}>
                    ⚠️ {formError}
                  </span>
                )}
              </div>

              {/* --- Custom Code Accordion --- */}
              <button
                type="button"
                className={styles.accordionToggle}
                onClick={() => setIsCustomOpen(!isCustomOpen)}
              >
                <span>⚙️ Tùy biến mã liên kết (Tùy chọn)</span>
                <span>{isCustomOpen ? '▲' : '▼'}</span>
              </button>

              <div className={`${styles.accordionContent} ${isCustomOpen ? styles.open : ''}`}>
                <div className={styles.inputGroup}>
                  <label htmlFor="customCode" className={styles.inputLabel}>
                    Đuôi URL tùy chọn (ví dụ: my-link)
                  </label>
                  <div className={styles.customCodeInputWrapper}>
                    <span className={styles.prefix}>z-link.vn/</span>
                    <input
                      type="text"
                      id="customCode"
                      className={styles.customInput}
                      placeholder="ma-tuy-chon"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Đang rút gọn...
                  </>
                ) : (
                  <>Rút Gọn Liên Kết</>
                )}
              </button>
            </form>
          ) : (
            /* --- Result Panel --- */
            <div className={styles.resultSection}>
              <div className={styles.resultTitle}>
                🎉 Rút gọn link thành công!
              </div>

              <div className={styles.resultGroup}>
                <span className={styles.resultLabel}>Liên kết rút gọn của bạn</span>
                <div className={styles.resultValueWrapper}>
                  <a href={result.shortUrl} target="_blank" rel="noopener noreferrer" className={styles.shortLink}>
                    {result.shortUrl}
                  </a>
                  <button
                    onClick={() => handleCopyLink(result.shortUrl, 'result')}
                    className={`${styles.copyBtn} ${copiedId === 'result' ? styles.copied : ''}`}
                    title="Sao chép"
                  >
                    {copiedId === 'result' ? '✓' : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className={styles.linkMeta}>
                  <div className={styles.metaTitle}>{result.title || 'Liên kết rút gọn'}</div>
                  <div className={styles.metaUrl} title={result.originalUrl}>
                    {result.originalUrl}
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              {qrCodeDataUrl && (
                <div className={styles.qrContainer}>
                  <span className={styles.resultLabel}>Mã QR Code cho link này</span>
                  <div className={styles.qrCodeWrapper}>
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code" 
                      className={styles.qrCodeImg} 
                      width="160" 
                      height="160"
                    />
                  </div>
                  <a 
                    href={qrCodeDataUrl} 
                    download={`zlink-${result.shortCode}.png`} 
                    className={styles.downloadQrBtn}
                  >
                    📥 Tải mã QR xuống
                  </a>
                </div>
              )}

              <button onClick={handleReset} className={styles.resetBtn}>
                Rút gọn link khác
              </button>
            </div>
          )}
        </section>

        {/* --- Click Stats Chart (Top 5) --- */}
        {topClickedLinks.length > 0 && (
          <section className={`${styles.card} ${styles.statsCard}`}>
            <h2 className={styles.historyTitle}>📊 Thống kê lượt clicks hàng đầu</h2>
            <div className={styles.chartContainer}>
              <div className={styles.chart}>
                {topClickedLinks.map((item) => {
                  const widthPercentage = maxClicks > 0 ? (item.clicks / maxClicks) * 100 : 0;
                  return (
                    <div key={item.id} className={styles.chartBarWrapper}>
                      <div className={styles.chartBarLabel}>
                        <span className={styles.chartBarTitle} title={item.title || item.originalUrl}>
                          {item.title || `/${item.shortCode}`}
                        </span>
                        <span className={styles.chartBarClicks}>{item.clicks} clicks</span>
                      </div>
                      <div className={styles.chartBarContainer}>
                        <div 
                          className={styles.chartBarFill} 
                          style={{ width: `${widthPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* --- History Section --- */}
        <section className={`${styles.card} ${styles.historyCard}`}>
          <div className={styles.historyHeader}>
            <h2 className={styles.historyTitle}>⏱️ Lịch sử rút gọn link</h2>
            {history.length > 0 && (
              <button onClick={handleClearHistory} className={styles.clearHistoryBtn}>
                🗑️ Xóa toàn bộ
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔗</div>
              <p>Bạn chưa tạo liên kết rút gọn nào.</p>
              <p style={{ fontSize: '0.85rem' }}>Các liên kết bạn rút gọn sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map((item) => (
                <div key={item.id} className={styles.historyItem}>
                  <div className={styles.historyDetails}>
                    <div className={styles.historyLinkTitle}>
                      {item.title || 'Liên kết rút gọn'}
                    </div>
                    <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className={styles.historyShortUrl}>
                      {item.shortUrl}
                    </a>
                    <div className={styles.historyOriginalUrl} title={item.originalUrl}>
                      {item.originalUrl}
                    </div>
                    <div className={styles.historyMeta}>
                      <span className={styles.clicksBadge}>{item.clicks} clicks</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className={styles.historyActions}>
                    <button
                      onClick={() => handleCopyLink(item.shortUrl, item.id)}
                      className={styles.actionBtn}
                      title="Sao chép"
                    >
                      {copiedId === item.id ? '✓' : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenQrModal(item)}
                      className={styles.actionBtn}
                      title="Xem mã QR"
                    >
                      📱
                    </button>
                    <button
                      onClick={() => handleDeleteHistoryItem(item.shortCode)}
                      className={`${styles.actionBtn} ${styles.delete}`}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- Footer --- */}
        <footer className={styles.footer}>
          <div>Z-Link URL Shortener © 2026. Made with ❤️ for Global Developer Team.</div>
          <div className={styles.footerLinks}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub Project</a>
            <span>•</span>
            <a href="#">Tài liệu API</a>
          </div>
        </footer>
      </div>

      {/* --- QR Code Modal --- */}
      {modalQrItem && modalQrDataUrl && (
        <div className={styles.modalOverlay} onClick={() => setModalQrItem(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Mã QR Code</h3>
              <button className={styles.closeModalBtn} onClick={() => setModalQrItem(null)}>
                &times;
              </button>
            </div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem', wordBreak: 'break-all', color: 'var(--accent)' }}>
              {modalQrItem.shortUrl}
            </div>
            <div className={styles.qrCodeWrapper} style={{ alignSelf: 'center' }}>
              <img 
                src={modalQrDataUrl} 
                alt="Modal QR Code" 
                width="240" 
                height="240"
              />
            </div>
            <a 
              href={modalQrDataUrl} 
              download={`zlink-${modalQrItem.shortCode}.png`} 
              className={styles.downloadQrBtn}
              style={{ textAlign: 'center', display: 'block' }}
            >
              📥 Tải mã QR xuống
            </a>
          </div>
        </div>
      )}

      {/* --- Toast Alert --- */}
      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}
