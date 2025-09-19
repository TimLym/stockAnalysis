import React from 'react';
import WatchlistCarousel from '../components/WatchListCarousel';
import StockInfo from '../components/StockInfo';
import '../scss/Home.scss';

const Home = ({ 
    watchlist, 
    stockData, 
    loading, 
    error, 
    selectedStock, 
    onUpdateWatchlist, 
    onSelectStock, 
    onNavigateToChart 
}) => {
    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-message">載入股票資料中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="error-message">
                    <h3>無法載入股票資料</h3>
                    <p>{error}</p>
                    <p>請檢查網路連線或稍後再試。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            <WatchlistCarousel
                watchlist={watchlist}
                stockData={stockData}
                onSelect={onSelectStock}
                onUpdateWatchlist={onUpdateWatchlist}
            />
            <StockInfo
                symbol={selectedStock}
                data={stockData[selectedStock]}
                onNavigateToChart={onNavigateToChart}
            />
        </div>
    );
};

export default Home;