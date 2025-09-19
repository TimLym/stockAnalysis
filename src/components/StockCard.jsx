import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontalIcon, TrashIcon } from './Icons';

const StockCard = ({ symbol, data, onSelect, onRemove }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 載入中狀態
    if (!data) {
        return (
            <div className="stock-card loading">
                <div className="loading-content">
                    <div className="stock-symbol">{symbol.replace('.TW', '')}</div>
                    <div className="loading-text">載入中...</div>
                </div>
            </div>
        );
    }

    // 計算價格變化
    const price = parseFloat(data.z) || 0;
    const prevClose = parseFloat(data.y) || 0;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? ((change / prevClose) * 100) : 0;

    const isUp = change > 0;
    const isDown = change < 0;
    
    // 漲紅跌綠
    const priceColor = isUp ? '#dc3545' : isDown ? '#28a745' : '#6c757d';
    const changeText = isUp ? `+${change.toFixed(2)}` : change.toFixed(2);
    const percentText = isUp ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;

    return (
        <div className="stock-card" onClick={() => onSelect(symbol)}>
            <div className="card-header">
                <div className="stock-info">
                    <span className="stock-name">{data.n || symbol.replace('.TW', '')}</span>
                    <span className="stock-symbol">{data.c || symbol.replace('.TW', '')}</span>
                </div>
                <div className="menu-container" ref={menuRef}>
                    <button 
                        className="more-button" 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setShowMenu(!showMenu); 
                        }}
                        aria-label="更多選項"
                    >
                        <MoreHorizontalIcon />
                    </button>
                    {showMenu && (
                        <div className="card-menu">
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onRemove(symbol); 
                                    setShowMenu(false); 
                                }}
                            >
                                <TrashIcon /> 刪除
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="card-body">
                <div className="price-info">
                    <p className="current-price">
                        {price ? price.toFixed(2) : '--'}
                    </p>
                    <div className="price-change" style={{ color: priceColor }}>
                        <span className="change-amount">{changeText}</span>
                        <span className="change-percent">{percentText}</span>
                    </div>
                </div>
                <div className="mini-chart" style={{ '--trend-color': priceColor }}>
                    <div className="chart-bar" style={{ 
                        height: `${Math.min(Math.abs(changePercent) * 10 + 20, 100)}%`,
                        backgroundColor: priceColor 
                    }}></div>
                </div>
            </div>
        </div>
    );
};

export default StockCard;