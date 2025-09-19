import React, { useRef, useEffect } from 'react';
import { formatSymbolForTradingView } from '../services/api';

const TradingViewAdvancedChart = ({ symbol }) => {
    const containerRef = useRef();

    useEffect(() => {
        const container = containerRef.current;
        if (!symbol || !container) return;
        
        const formattedSymbol = formatSymbolForTradingView(symbol);
        
        // 清理容器，確保舊的 widget 被移除
        container.innerHTML = "";

        const scriptId = 'tradingview-advanced-widget-script';
        
        // 移除舊的 script，避免重複載入
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://s3.tradingview.com/tv.js";
        script.type = "text/javascript";
        script.async = true;
        
        script.onload = () => {
            if (containerRef.current && window.TradingView) {
                try {
                    new window.TradingView.widget({
                        "autosize": true,
                        "symbol": formattedSymbol,
                        "interval": "D",
                        "timezone": "Asia/Taipei",
                        "theme": "light",
                        "style": "1",
                        "locale": "zh_TW",
                        "toolbar_bg": "#f1f3f6",
                        "enable_publishing": false,
                        "hide_side_toolbar": false,
                        "allow_symbol_change": true,
                        "container_id": "tradingview_advanced_chart_container",
                        "studies": [
                            "Volume@tv-basicstudies"
                        ],
                        "show_popup_button": true,
                        "popup_width": "1000",
                        "popup_height": "650"
                    });
                } catch (error) {
                    console.error("TradingView widget 初始化失敗:", error);
                    if (containerRef.current) {
                        containerRef.current.innerHTML = '<div class="error-message">圖表載入失敗，請稍後再試</div>';
                    }
                }
            }
        };
        
        script.onerror = () => {
            console.error("TradingView script 載入失敗");
            if (containerRef.current) {
                containerRef.current.innerHTML = '<div class="error-message">圖表載入失敗，請檢查網路連線</div>';
            }
        };
        
        document.body.appendChild(script);

        // 清理函數
        return () => { 
            const scriptToRemove = document.getElementById(scriptId);
            if (scriptToRemove) {
                scriptToRemove.remove();
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = ""; 
            }
        }
    }, [symbol]);

    return (
        <div 
            ref={containerRef} 
            id="tradingview_advanced_chart_container" 
            style={{ 
                height: 'calc(100vh - 120px)', 
                width: '100%',
                minHeight: '600px'
            }} 
        />
    );
};

export default TradingViewAdvancedChart;