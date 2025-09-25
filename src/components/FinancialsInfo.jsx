import React from 'react';

const FinancialsInfo = ({ data }) => {
    if (!data) {
        return (
            <div className="card-container financials-info">
                <div className="section-header">
                    <h2>當日行情</h2>
                </div>
                <div className="loading-content">
                    <p>載入行情資料中...</p>
                </div>
            </div>
        );
    }

    // 計算價格變化
    const price = parseFloat(data.z) || 0;
    const prevClose = parseFloat(data.y) || 0;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    // 漲紅跌綠
    const changeColor = change > 0 ? '#dc3545' : change < 0 ? '#28a745' : '#6c757d';

    const formatNumber = (value) => {
        if (!value || value === '--') return '--';
        const num = parseFloat(value);
        return isNaN(num) ? '--' : num.toLocaleString();
    };

    const stockData = [
        { label: '股票名稱', value: data.n || '--' },
        { label: '股票代號', value: data.c || '--' },
        { label: '成交價', value: price ? price.toFixed(2) : '--' },
        { 
            label: '漲跌', 
            value: change ? (change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)) : '--',
            color: changeColor 
        },
        { 
            label: '漲跌幅', 
            value: changePercent ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%` : '--',
            color: changeColor 
        },
        { label: '開盤價', value: data.o ? parseFloat(data.o).toFixed(2) : '--' },
        { label: '最高價', value: data.h ? parseFloat(data.h).toFixed(2) : '--' },
        { label: '最低價', value: data.l ? parseFloat(data.l).toFixed(2) : '--' },
        { label: '昨收價', value: data.y ? parseFloat(data.y).toFixed(2) : '--' },
        // { label: '成交量', value: formatNumber(data.v) },
        { label: '累積成交量', value: `${formatNumber(data.tv)} 張` }
    ];
    
    return (
        <div className="card-container financials-info">
            <div className="section-header">
                <h2>當日行情</h2>
            </div>
            <div className="financials-content">
                <ul className="financials-list">
                    {stockData.map(({ label, value, color }, index) => (
                        <li key={index} className="financial-item">
                            <span className="label">{label}</span>
                            <span className="value" style={{ color: color || 'inherit' }}>
                                {value}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default FinancialsInfo;