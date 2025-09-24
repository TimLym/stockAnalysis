import React from 'react';

// 時間框架選擇組件 - 台股標準
const TimeframeSelector = ({ selected, onSelect, className }) => {
    const timeframes = [
        { value: '5m', label: '5分' },
        { value: '30m', label: '30分' },
        { value: '1D', label: '日K' },
        { value: '1W', label: '週K' },
        { value: '1M', label: '月K' }
    ];

    return (
        <div className={`timeframe-selector ${className || ''}`}>
            {timeframes.map(({ value, label }) => (
                <button
                    key={value}
                    className={`timeframe-btn ${selected === value ? 'active' : ''}`}
                    onClick={() => onSelect(value)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

export default TimeframeSelector;