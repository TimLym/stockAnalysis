import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, stagger } from 'framer-motion';
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        }
    };
    
    return (
        <motion.div 
            className="watchlist-section"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div className="section-header" variants={itemVariants}>
                <h2>觀察名單</h2>
                <div className="header-controls">
                    <AnimatePresence>
                        {showAdd && (
                            <motion.div 
                                className="add-stock-form"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.input
                                    type="text"
                                    value={newSymbol}
                                    onChange={(e) => setNewSymbol(e.target.value)}
                                    placeholder="輸入台股代號 (例如 2330)"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
                                    autoFocus
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                />
                                <motion.button 
                                    onClick={handleAddStock}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{ whiteSpace: 'nowrap' }}                                 
                                >
                                    加入
                                </motion.button>
                                <motion.button 
                                    onClick={() => setShowAdd(false)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    取消
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.button 
                        className="add-stock-btn" 
                        onClick={() => setShowAdd(!showAdd)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        variants={itemVariants}
                    >
                        <motion.div
                            animate={{ rotate: showAdd ? 45 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PlusIcon />
                        </motion.div>
                        新增
                    </motion.button>
                </div>
            </motion.div>
            
            <motion.div className="carousel-container" variants={itemVariants}>
                <motion.button 
                    className="scroll-btn left" 
                    onClick={() => scroll(-1)}
                    aria-label="向左捲動"
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronLeft />
                </motion.button>
                
                <motion.div 
                    className="watchlist-carousel" 
                    ref={scrollRef}
                    variants={containerVariants}
                >
                    <AnimatePresence mode="popLayout">
                        {watchlist.length === 0 ? (
                            <motion.div 
                                className="empty-watchlist"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.p
                                    initial={{ y: 10 }}
                                    animate={{ y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    觀察清單是空的，請新增股票
                                </motion.p>
                            </motion.div>
                        ) : (
                            watchlist.map((symbol, index) => (
                                <motion.div
                                    key={symbol}
                                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                    animate={{ 
                                        opacity: 1, 
                                        x: 0, 
                                        scale: 1,
                                        transition: { 
                                            delay: index * 0.05,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 24
                                        }
                                    }}
                                    exit={{ 
                                        opacity: 0, 
                                        x: -20, 
                                        scale: 0.9,
                                        transition: { duration: 0.2 }
                                    }}
                                    layout
                                >
                                    <StockCard 
                                        symbol={symbol} 
                                        data={stockData[symbol]} 
                                        onSelect={onSelect} 
                                        onRemove={handleRemoveStock} 
                                    />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>
                
                <motion.button 
                    className="scroll-btn right" 
                    onClick={() => scroll(1)}
                    aria-label="向右捲動"
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronRight />
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default WatchlistCarousel;