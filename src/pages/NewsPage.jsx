import React, { useState, useEffect } from 'react';
import '../scss/news.scss';
import { gnewsApi } from '../services/api';
import NewsColumn from '../components/NewsColumn';

const NewsPage = () => {
    const [news, setNews] = useState({ business: [], technology: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            setError(null);
            
            try {                
                const [businessRes, techRes] = await Promise.all([
                    gnewsApi.getNews('business'),
                    gnewsApi.getNews('technology')
                ]);
                
                setNews({
                    business: businessRes.articles || [],
                    technology: techRes.articles || [],
                });
            } catch (err) {
                console.error("獲取新聞失敗:", err);
                setError(err.message || "無法載入新聞");
            } finally {
                setLoading(false);
            }
        };
        
        fetchNews();
    }, []);
    
    if (loading) {
        return (
            <div className="page-container news-page">
                <div className="loading-message">
                    <h2>載入新聞中...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container news-page">
                <div className="error-message">
                    <h2>無法載入新聞</h2>
                    <p>{error}</p>
                    <p>請檢查您的 GNews API 金鑰設定。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container news-page">
            <div className="news-grid">
                <NewsColumn title="財經新聞" articles={news.business} />
                <NewsColumn title="科技新聞" articles={news.technology} />
            </div>
        </div>
    );
};

export default NewsPage;