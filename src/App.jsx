import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ChartPage from './pages/ChartPage';
import NewsPage from './pages/NewsPage';
import { stockApi } from './services/api';
import './scss/App.scss';

// 預設觀察名單
const INITIAL_WATCHLIST = ['2330.TW', '2603.TW', '0050.TW'];

// 標準化股票代號
const normalizeSymbols = (symbols) => {
    return symbols.map(s => {
        let symbol = s.toUpperCase().trim();
        symbol = symbol.replace('-TW', '.TW');
        if (/^\d+$/.test(symbol)) {
            symbol = `${symbol}.TW`;
        }
        return symbol;
    }).filter(s => s.endsWith('.TW'));
};

export default function App() {
    const [page, setPage] = useState('home');
    
    // 觀察清單狀態管理
    const [watchlist, setWatchlist] = useState(() => {
        try {
            const saved = localStorage.getItem('stockWatchlist');
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) && parsed.length > 0 
                ? normalizeSymbols(parsed) 
                : normalizeSymbols(INITIAL_WATCHLIST);
        } catch (e) {
            return normalizeSymbols(INITIAL_WATCHLIST);
        }
    });
    
    const [selectedStock, setSelectedStock] = useState(watchlist[0] || null);
    const [chartSymbol, setChartSymbol] = useState(watchlist[0] || null);
    const [stockData, setStockData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 抓取股票資料
    useEffect(() => {
        const fetchData = async () => {
            if (watchlist.length === 0) {
                setLoading(false);
                return;
            }

            try {
                setError(null);
                console.log('開始獲取觀察名單數據:', watchlist);
                
                // 使用 stockApi.getQuotes 批量獲取數據
                const data = await stockApi.getQuotes(watchlist);
                
                if (data && data.msgArray && Array.isArray(data.msgArray)) {
                    const newData = data.msgArray.reduce((acc, stock) => {
                        const symbol = `${stock.c}.TW`;
                        acc[symbol] = stock;
                        return acc;
                    }, {});
                    
                    console.log('成功獲取股票數據:', Object.keys(newData).length, '檔');
                    setStockData(newData);
                } else {
                    console.warn('未獲取到有效的股票數據');
                    setStockData({});
                }
            } catch (err) {
                console.error("獲取股票資料失敗:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        const intervalId = setInterval(fetchData, 15000); // 每30秒更新
        return () => clearInterval(intervalId);
    }, [watchlist]);

    // 保存觀察清單到 localStorage
    useEffect(() => {
        localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
        
        // 更新選中的股票
        if (!watchlist.includes(selectedStock)) {
            const newSelected = watchlist[0] || null;
            setSelectedStock(newSelected);
            if (!chartSymbol || !watchlist.includes(chartSymbol)) {
                setChartSymbol(newSelected);
            }
        }
    }, [watchlist, selectedStock, chartSymbol]);

    // 導航到圖表頁面
    const handleNavigateToChart = useCallback((symbol) => {
        if (symbol) {
            setChartSymbol(symbol);
            setPage('chart');
        }
    }, []);

    // 更新觀察清單
    const handleUpdateWatchlist = useCallback((newWatchlist) => {
        setWatchlist(newWatchlist);
    }, []);

    // 選擇股票
    const handleSelectStock = useCallback((symbol) => {
        setSelectedStock(symbol);
    }, []);

    // 渲染頁面內容
    const renderPage = () => {
        const commonProps = {
            watchlist,
            stockData,
            loading,
            error,
            selectedStock,
            chartSymbol,
            onUpdateWatchlist: handleUpdateWatchlist,
            onSelectStock: handleSelectStock,
            onNavigateToChart: handleNavigateToChart
        };

        switch (page) {
            case 'home':
                return <Home {...commonProps} />;
            case 'chart':
                return <ChartPage {...commonProps} />;
            case 'news':
                return <NewsPage />;
            default:
                return <Home {...commonProps} />;
        }
    };

    return (
        <div className="stock-app-layout">
            <Sidebar currentPage={page} onPageChange={setPage} />
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    );
}