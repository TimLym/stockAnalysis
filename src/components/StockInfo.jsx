import React from 'react';
import { ChartIcon } from './Icons';
import SimpleStockChart from './SimpleStockChart';
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
                    <div 
                        className="chart-wrapper"
                        style={{
                            minHeight: '450px',
                            height: '450px', // 固定高度
                            overflow: 'hidden', // 防止溢出
                            padding: '10px',
                            position: 'relative',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            backgroundColor: '#1e1e1e',
                            width: '100%', // 確保寬度填滿父容器
                            maxWidth: '100%', // 防止超出父容器
                            boxSizing: 'border-box' // 包含padding和border在內的寬度計算
                        }}
                    >
                        <SimpleStockChart 
                            symbol={symbol}
                            data={data}
                            height={400}
                        />
                    </div>
                </div>
                
                <FinancialsInfo data={data} />
            </div>
        </div>
    );
};

export default StockInfo;