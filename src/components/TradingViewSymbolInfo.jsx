import React, { useRef, useEffect } from 'react';
import { formatSymbolForTradingView } from '../services/api';

const TradingViewSymbolInfo = ({ symbol }) => {
    const containerRef = useRef(null);
    
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !symbol) return;

        // 清理容器
        container.innerHTML = "";
        
        const formattedSymbol = formatSymbolForTradingView(symbol);
        if (!formattedSymbol) return;
        
        try {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = JSON.stringify({
                "symbol": formattedSymbol,
                "width": "100%",
                "locale": "zh_TW",
                "colorTheme": "light",
                "isTransparent": true
            });
            
            container.appendChild(script);
        } catch (error) {
            console.error('TradingView 元件載入失敗:', error);
            container.innerHTML = '<div class="error-message">圖表載入失敗</div>';
        }

        // 清理函數
        return () => {
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [symbol]);
    
    return (
        <div 
            className="tradingview-widget-container" 
            ref={containerRef} 
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
        />
    );
};

export default TradingViewSymbolInfo;