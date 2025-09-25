import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
            <motion.div
                className="stock-card loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="card-header">
                    <div className="loading-content">
                        <div className="loading-text">載入資料中...</div>
                        <motion.div
                            className="loading-spinner"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            ⏳
                        </motion.div>
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
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    className="card-menu"
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(symbol);
                                            setShowMenu(false);
                                        }}
                                    >
                                        <TrashIcon /> 刪除
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </motion.div>
        );
    }

    const price = data.price || data.lastPrice || data.closePrice || parseFloat(data.z) || 0;
    const prevClose = data.previousClose || data.referencePrice || parseFloat(data.y) || 0;
    const change = data.change || (price - prevClose);
    const changePercent = data.changePercent || (prevClose !== 0 ? ((change / prevClose) * 100) : 0);

    // 檢測漲停跌停
    const limitUpPrice = data.limitUpPrice;
    const limitDownPrice = data.limitDownPrice;

    const isLimitUp = limitUpPrice && Math.abs(price - limitUpPrice) < 0.01;
    const isLimitDown = limitDownPrice && Math.abs(price - limitDownPrice) < 0.01;
    
    
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

    // 決定卡片樣式
    let cardClassName = "stock-card";
    if (isLimitUp) {
        cardClassName += " limit-up-glow";
    } else if (isLimitDown) {
        cardClassName += " limit-down-glow";
    }

    return (
        
        <motion.div
            className={cardClassName}
            onClick={() => onSelect(symbol)}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{
                scale: 1.02,
                y: -4,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            layout
        >
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
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                className="card-menu"
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(symbol);
                                        setShowMenu(false);
                                    }}
                                >
                                    <TrashIcon /> 刪除
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="card-body">
                <div className="price-section">
                    <motion.div
                        className="current-price"
                        key={price}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.3 }}
                    >
                        NT$ {price ? price.toFixed(2) : '--'}
                        {isLimitUp && (
                            <motion.span
                                className="limit-indicator limit-up"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                🔥 漲停
                            </motion.span>
                        )}
                        {isLimitDown && (
                            <motion.span
                                className="limit-indicator limit-down"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                ❄️ 跌停
                            </motion.span>
                        )}
                    </motion.div>

                    <motion.div
                        className={`price-change-container ${isUp ? 'up' : isDown ? 'down' : 'unchanged'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="trend-indicator">
                            {isUp ? '📈' : isDown ? '📉' : '➡️'}
                        </div>
                        <div className="change-info">
                            <div className="change-amount">{changeText}</div>
                            <div className="change-percent">{percentText}</div>
                        </div>
                        <div className="change-badge">
                            {isUp ? '漲' : isDown ? '跌' : '平'}
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    className="stock-details"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="detail-item">
                        <span className="label">開盤</span>
                        <span className="value">{openPrice ? openPrice.toFixed(2) : '--'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">成交量</span>
                        <span className="value">{volume ? `${Math.floor(volume / 1000).toLocaleString()}K` : '--'}</span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default StockCard;
