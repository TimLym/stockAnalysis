import React from 'react';
import { ChartIcon } from './Icons';
import TradingViewSymbolInfo from './TradingViewSymbolInfo';
import FinancialsInfo from './FinancialsInfo';

const StockInfo = ({ symbol, data, onNavigateToChart }) => {
    if (!symbol) {
        return (
            <div className="stock-info-container">
                <div className="card-container">
                    <div className="empty-state">
                        <h3>請選擇股票</h3>
                        <p>從觀察名單中選擇一檔股票來查看詳細資訊。</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="stock-info-container">
            <div className="stock-info-grid">
                <div className="card-container chart-container">
                    <div className="section-header">
                        <h2>個股資訊</h2>
                        <button 
                            className="chart-button" 
                            onClick={() => onNavigateToChart(symbol)}
                        >
                            <ChartIcon /> 切換至全螢幕圖表
                        </button>
                    </div>
                    <div className="chart-wrapper">
                        <TradingViewSymbolInfo key={symbol} symbol={symbol} />
                    </div>
                </div>
                
                <FinancialsInfo data={data} />
            </div>
        </div>
    );
};

export default StockInfo;