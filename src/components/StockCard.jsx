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

    const price = data.price || data.lastPrice || parseFloat(data.z) || 0;
    const prevClose = data.previousClose || data.referencePrice || parseFloat(data.y) || 0;
    const change = data.change || (price - prevClose);
    const changePercent = data.changePercent || (prevClose !== 0 ? ((change / prevClose) * 100) : 0);

    const isUp = change > 0;
    const isDown = change < 0;
    
    const changeText = isUp ? `+${change.toFixed(2)}` : change.toFixed(2);
    const percentText = isUp ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;

    const stockName = data.name || data.nameZhTw || data.n || symbol.replace('.TW', '');
    const stockCode = data.symbol || data.symbolId || data.c || symbol.replace('.TW', '');
    const openPrice = data.openPrice || parseFloat(data.o) || 0;
    
    let volume = 0;
    if (data.total && data.total.tradeVolume) {
        volume = data.total.tradeVolume;
    } else if (data.volume) {
        volume = data.volume;
    } else if (data.v) {
        volume = parseFloat(data.v) * 1000;
    } else if (data.tv) {
        volume = parseFloat(data.tv);
    }

    return (
        <div className="stock-card" onClick={() => onSelect(symbol)}>
            <div className="card-header">
                <div className="stock-info">
                    <span className="stock-name">{stockName}</span>
                    <span className="stock-symbol">{stockCode}</span>
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
                <div className="price-section">
                    <div className="current-price">
                        NT$ {price ? price.toFixed(2) : '--'}
                    </div>
                    
                    <div className={`price-change-container ${isUp ? 'up' : isDown ? 'down' : 'unchanged'}`}>
                        <div className="trend-indicator">
                            {isUp ? '' : isDown ? '' : ''}
                        </div>
                        <div className="change-info">
                            <div className="change-amount">{changeText}</div>
                            <div className="change-percent">{percentText}</div>
                        </div>
                        <div className="change-badge">
                            {isUp ? '漲' : isDown ? '跌' : '平'}
                        </div>
                    </div>
                </div>
                
                <div className="stock-details">
                    <div className="detail-item">
                        <span className="label">開盤</span>
                        <span className="value">{openPrice ? openPrice.toFixed(2) : '--'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">成交量</span>
                        <span className="value">{volume ? `${Math.floor(volume/1000).toLocaleString()}K` : '--'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockCard;
