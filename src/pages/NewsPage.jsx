import React, { useState, useEffect } from 'react';
import '../scss/news.scss';
import { gnewsApi } from '../services/api';
import NewsColumn from '../components/NewsColumn';

const NewsPage = () => {
    const [news, setNews] = useState({ business: [], technology: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // 監聽網路狀態
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('開始獲取新聞數據...');
            const [businessRes, techRes] = await Promise.all([
                gnewsApi.getNews('business'),
                gnewsApi.getNews('technology')
            ]);
            
            setNews({
                business: businessRes.articles || [],
                technology: techRes.articles || [],
            });
            
            setRetryCount(0); // 成功後重置重試次數
            console.log('新聞數據載入成功');
        } catch (err) {
            console.error("獲取新聞失敗:", err);
            setError(err.message || "無法載入新聞");
            setRetryCount(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleRetry = () => {
        fetchNews();
    };
    
    if (loading) {
        return (
            <div className="page-container news-page">
                <div className="loading-message" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '60vh' 
                }}>
                    <div className="loading-spinner"></div>
                    <h2>載入新聞中...</h2>
                    {retryCount > 0 && (
                        <p style={{ fontSize: '0.9em', color: '#666' }}>
                            重試次數: {retryCount}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container news-page">
                <div className="error-message" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '60vh',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '3em', marginBottom: '20px' }}>📰❌</div>
                    <h2>無法載入新聞</h2>
                    <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
                    
                    {!isOnline && (
                        <div style={{ 
                            background: '#fff3cd', 
                            border: '1px solid #ffeaa7', 
                            borderRadius: '4px', 
                            padding: '15px', 
                            marginBottom: '20px',
                            fontSize: '0.9em'
                        }}>
                            🔌 網路連線中斷，請檢查網路設定後重試
                        </div>
                    )}
                    
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '0.9em', color: '#777', marginBottom: '10px' }}>
                            可能的原因：
                        </p>
                        <ul style={{ 
                            fontSize: '0.8em', 
                            color: '#666', 
                            textAlign: 'left',
                            display: 'inline-block',
                            margin: '0'
                        }}>
                            <li>網路連線不穩定</li>
                            <li>GNews API 金鑰過期或額度用盡</li>
                            <li>API 服務暫時無法使用</li>
                            <li>CORS 政策限制</li>
                        </ul>
                    </div>
                    
                    <div>
                        <button 
                            onClick={handleRetry}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: isOnline ? '#007bff' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isOnline ? 'pointer' : 'not-allowed',
                                fontSize: '1rem',
                                marginRight: '10px'
                            }}
                            disabled={!isOnline}
                        >
                            🔄 重新載入
                        </button>
                    </div>
                    
                    {retryCount > 3 && (
                        <div style={{ 
                            fontSize: '0.8em', 
                            color: '#888', 
                            marginTop: '20px',
                            padding: '15px',
                            background: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px'
                        }}>
                            <p><strong>⚠️ 多次重試失敗</strong></p>
                            <p>建議檢查：</p>
                            <ul style={{ textAlign: 'left', margin: '10px 0' }}>
                                <li>GNews API 金鑰是否有效</li>
                                <li>API 呼叫配額是否已用完</li>
                                <li>網路連線是否穩定</li>
                            </ul>
                            <p style={{ fontSize: '0.7em', color: '#999', marginTop: '10px' }}>
                                如需協助，請檢查瀏覽器開發者工具的控制台
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 檢查是否有新聞數據
    const hasBusinessNews = news.business && news.business.length > 0;
    const hasTechNews = news.technology && news.technology.length > 0;
    
    if (!hasBusinessNews && !hasTechNews) {
        return (
            <div className="page-container news-page">
                <div className="error-message" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '60vh',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '3em', marginBottom: '20px' }}>📰</div>
                    <h2>目前沒有新聞</h2>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        API 呼叫成功，但沒有返回任何新聞文章
                    </p>
                    <button 
                        onClick={handleRetry}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        🔄 重新載入
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container news-page">
            <div className="news-header" style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <h1>新聞資訊</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: isOnline ? '#28a745' : '#dc3545' 
                    }}></span>
                    <span style={{ fontSize: '0.8em', color: '#666' }}>
                        {isOnline ? '線上' : '離線'}
                    </span>
                    <span style={{ 
                        fontSize: '0.8em', 
                        color: news.business.some(n => n.source?.name === '模擬財經新聞') ? '#ff9800' : '#28a745'
                    }}>
                        • {news.business.some(n => n.source?.name === '模擬財經新聞') ? '模擬數據' : '真實新聞'}
                    </span>
                </div>
            </div>
            <div className="news-grid">
                <NewsColumn title="財經新聞" articles={news.business} />
                <NewsColumn title="科技新聞" articles={news.technology} />
            </div>
        </div>
    );
};

export default NewsPage;