import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, PlusIcon } from './Icons';
import StockCard from './StockCard';

const WatchlistCarousel = ({ watchlist, stockData, onSelect, onUpdateWatchlist }) => {
    const scrollRef = useRef(null);
    const [newSymbol, setNewSymbol] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const handleAddStock = () => {
        let finalSymbol = newSymbol.toUpperCase().trim();
        
        // 標準化股票代號
        finalSymbol = finalSymbol.replace('-TW', '.TW');
        if (/^\d+$/.test(finalSymbol)) {
            finalSymbol = `${finalSymbol}.TW`;
        }
        
        // 檢查格式正確且不重複
        if (finalSymbol.endsWith('.TW') && !watchlist.includes(finalSymbol)) {
            onUpdateWatchlist([finalSymbol, ...watchlist]);
        } else if (watchlist.includes(finalSymbol)) {
            alert('此股票已在觀察清單中');
        } else {
            alert('請輸入有效的台股代號（例如：2330）');
        }
        
        setNewSymbol('');
        setShowAdd(false);
    };

    const handleRemoveStock = (symbolToRemove) => {
        onUpdateWatchlist(watchlist.filter(symbol => symbol !== symbolToRemove));
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.offsetWidth * 0.8;
            scrollRef.current.scrollBy({ 
                left: direction * scrollAmount, 
                behavior: 'smooth' 
            });
        }
    };
    
    return (
        <div className="watchlist-section">
            <div className="section-header">
                <h2>觀察名單</h2>
                <div className="header-controls">
                    {showAdd && (
                        <div className="add-stock-form">
                            <input
                                type="text"
                                value={newSymbol}
                                onChange={(e) => setNewSymbol(e.target.value)}
                                placeholder="輸入台股代號 (例如 2330)"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
                                autoFocus
                            />
                            <button onClick={handleAddStock}>加入</button>
                            <button onClick={() => setShowAdd(false)}>取消</button>
                        </div>
                    )}
                    <button className="add-stock-btn" onClick={() => setShowAdd(!showAdd)}>
                        <PlusIcon /> 新增
                    </button>
                </div>
            </div>
            
            <div className="carousel-container">
                <button 
                    className="scroll-btn left" 
                    onClick={() => scroll(-1)}
                    aria-label="向左捲動"
                >
                    <ChevronLeft />
                </button>
                
                <div className="watchlist-carousel" ref={scrollRef}>
                    {watchlist.length === 0 ? (
                        <div className="empty-watchlist">
                            <p>觀察清單是空的，請新增股票</p>
                        </div>
                    ) : (
                        watchlist.map(symbol => (
                            <StockCard 
                                key={symbol} 
                                symbol={symbol} 
                                data={stockData[symbol]} 
                                onSelect={onSelect} 
                                onRemove={handleRemoveStock} 
                            />
                        ))
                    )}
                </div>
                
                <button 
                    className="scroll-btn right" 
                    onClick={() => scroll(1)}
                    aria-label="向右捲動"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
};

export default WatchlistCarousel;