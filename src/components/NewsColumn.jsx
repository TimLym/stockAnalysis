import React from 'react';

const NewsColumn = ({ title, articles }) => {
    return (
        <div className="news-column">
            <h2>{title}</h2>
            <div className="news-list">
                {articles.length > 0 ? (
                    articles.map((article, index) => (
                        <NewsCard key={index} article={article} />
                    ))
                ) : (
                    <div className="empty-news">
                        <p>目前沒有相關新聞。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const NewsCard = ({ article }) => {
    const handleImageError = (e) => {
        e.target.style.display = 'none';
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return '日期未知';
        }
    };

    return (
        <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="news-card"
        >
            {article.image && (
                <img 
                    src={article.image} 
                    alt={article.title} 
                    onError={handleImageError}
                    loading="lazy"
                />
            )}
            <div className="news-content">
                <h3>{article.title}</h3>
                {article.description && (
                    <p>{article.description}</p>
                )}
                <div className="news-meta">
                    <span className="source">{article.source?.name || '未知來源'}</span>
                    <span className="date">{formatDate(article.publishedAt)}</span>
                </div>
            </div>
        </a>
    );
};

export default NewsColumn;