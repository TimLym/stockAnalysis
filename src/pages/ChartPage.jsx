import React, { useState } from 'react';
import '../scss/chart.scss';
import DrawableStockChart from '../components/DrawableStockChart';

const ChartPage = ({ chartSymbol, onNavigateToChart, onUpdateWatchlist, watchlist }) => {
    const [newSymbol, setNewSymbol] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const handleSearchStock = () => {
        let finalSymbol = newSymbol.toUpperCase().trim();
        
        // 標準化股票代號
        finalSymbol = finalSymbol.replace('-TW', '.TW');
        if (/^\d+$/.test(finalSymbol)) {
            finalSymbol = `${finalSymbol}.TW`;
        }
        
        // 檢查格式正確
        if (finalSymbol.endsWith('.TW')) {
            // 直接導航到新股票的圖表
            onNavigateToChart(finalSymbol);
            
            // 如果不在觀察清單中，詢問是否加入
            if (watchlist && !watchlist.includes(finalSymbol)) {
                const shouldAdd = window.confirm(`是否將 ${finalSymbol} 加入觀察清單？`);
                if (shouldAdd && onUpdateWatchlist) {
                    onUpdateWatchlist([finalSymbol, ...watchlist]);
                }
            }
        } else {
            alert('請輸入有效的台股代號（例如：2330）');
        }
        
        setNewSymbol('');
        setShowSearch(false);
    };

    if (!chartSymbol) {
        return (
            <div className="page-container chart-page">
                <div className="empty-state">
                    <h1>超級圖表</h1>
                    <p>請先從主頁選擇一檔股票以顯示圖表。</p>
                    <div className="search-section">
                        <h3>或直接搜尋股票：</h3>
                        <div className="search-form">
                            <input
                                type="text"
                                value={newSymbol}
                                onChange={(e) => setNewSymbol(e.target.value)}
                                placeholder="輸入台股代號 (例如 2330)"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchStock()}
                                autoFocus
                            />
                            <button onClick={handleSearchStock} disabled={!newSymbol.trim()}>
                                搜尋圖表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container chart-page">
            <div className="chart-header">
                <div className="header-left">
                    <h1>超級圖表</h1>
                    <p>股票代號: {chartSymbol}</p>
                </div>
                <div className="header-right">
                    {showSearch ? (
                        <div className="search-form inline">
                            <input
                                type="text"
                                value={newSymbol}
                                onChange={(e) => setNewSymbol(e.target.value)}
                                placeholder="輸入台股代號 (例如 2330)"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchStock()}
                                autoFocus
                            />
                            <button onClick={handleSearchStock} disabled={!newSymbol.trim()}>
                                切換
                            </button>
                            <button onClick={() => setShowSearch(false)}>
                                取消
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="search-btn"
                            onClick={() => setShowSearch(true)}
                        >
                            🔍 搜尋股票
                        </button>
                    )}
                </div>
            </div>
            <div className="chart-container">
                <DrawableStockChart key={chartSymbol} symbol={chartSymbol} height={600} />
            </div>
        </div>
    );
};

export default ChartPage;