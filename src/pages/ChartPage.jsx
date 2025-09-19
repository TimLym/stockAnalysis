import React from 'react';
import '../scss/chart.scss';
import TradingViewAdvancedChart from '../components/TradingViewAdvancedChart';

const ChartPage = ({ chartSymbol }) => {
    if (!chartSymbol) {
        return (
            <div className="page-container chart-page">
                <div className="empty-state">
                    <h1>超級圖表</h1>
                    <p>請先從主頁選擇一檔股票以顯示圖表。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container chart-page">
            <div className="chart-header">
                <h1>超級圖表</h1>
                <p>股票代號: {chartSymbol}</p>
            </div>
            <div className="chart-container">
                <TradingViewAdvancedChart key={chartSymbol} symbol={chartSymbol} />
            </div>
        </div>
    );
};

export default ChartPage;