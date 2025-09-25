import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fugleApi } from '../services/fugleApi';

// 註冊 Chart.js 組件
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const SimpleStockChartFixed = ({ symbol, height = 500 }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIntradayData = async () => {
            if (!symbol) return;
            
            setLoading(true);
            setError(null);
            
            try {
                console.log(`使用富果API獲取 ${symbol} 的1分K線數據（固定時間軸）...`);
                
                // 使用富果API獲取當日1分K線數據和昨收價
                const [stockData, quoteData] = await Promise.all([
                    fugleApi.getIntradayCandles(symbol, '1'), // 1分K線
                    fugleApi.getQuotes([symbol]) // 獲取昨收價
                ]);
                
                console.log(`獲取到 ${stockData.length} 筆1分K數據`);
                
                // 創建固定時間軸（09:00-13:30，包含12:00-13:00的空檔）
                const createTimeAxis = () => {
                    const labels = [];
                    const timePoints = [];
                    const today = new Date();
                    
                    // 09:00 - 12:00 (上午盤，包含12:00)
                    for (let hour = 9; hour <= 12; hour++) {
                        const endMinute = (hour === 12) ? 0 : 59; // 12點只到12:00
                        for (let minute = 0; minute <= endMinute; minute++) {
                            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            labels.push(timeStr);
                            
                            const timePoint = new Date(today);
                            timePoint.setHours(hour, minute, 0, 0);
                            timePoints.push(timePoint);
                        }
                    }
                    
                    // 12:01 - 12:59 (休市時段，但保留時間軸用於顯示)
                    for (let minute = 1; minute < 60; minute++) {
                        const timeStr = `12:${minute.toString().padStart(2, '0')}`;
                        labels.push(timeStr);
                        
                        const timePoint = new Date(today);
                        timePoint.setHours(12, minute, 0, 0);
                        timePoints.push(timePoint);
                    }
                    
                    // 13:00 - 13:30 (下午盤)
                    for (let minute = 0; minute <= 30; minute++) {
                        const timeStr = `13:${minute.toString().padStart(2, '0')}`;
                        labels.push(timeStr);
                        
                        const timePoint = new Date(today);
                        timePoint.setHours(13, minute, 0, 0);
                        timePoints.push(timePoint);
                    }
                    
                    return { labels, timePoints };
                };
                
                const { labels, timePoints } = createTimeAxis();
                
                // 獲取昨收價和股票資訊
                let previousClose = null;
                let stockInfo = null;
                
                if (quoteData && quoteData.msgArray && quoteData.msgArray.length > 0) {
                    stockInfo = quoteData.msgArray[0];
                    previousClose = parseFloat(stockInfo.y) || null; // y 是昨收價
                    console.log(`獲取股票資訊: ${stockInfo.n || stockInfo.c}, 昨收: ${previousClose}`);
                }
                
                // 如果無法從報價獲取昨收價，使用第一根K線的開盤價作為參考
                if (!previousClose && stockData.length > 0) {
                    previousClose = stockData[0].o || stockData[0].open;
                    console.log(`使用開盤價作為昨收參考: ${previousClose}`);
                }
                
                // 將數據映射到固定時間軸（只取當日數據）
                const priceData = new Array(labels.length).fill(null);
                const now = new Date();
                const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
                
                console.log(`當前時間: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} (${currentTimeInMinutes} 分鐘)`);
                
                // 創建時間映射
                const timeMap = new Map();
                stockData.forEach(item => {
                    const itemTime = new Date(item.x || item.timestamp);
                    const timeKey = `${itemTime.getHours().toString().padStart(2, '0')}:${itemTime.getMinutes().toString().padStart(2, '0')}`;
                    const price = parseFloat(item.c || item.close);
                    timeMap.set(timeKey, price);
                    // console.log(`數據時間: ${timeKey}, 價格: ${price}`);
                });
                
                console.log(`從API獲取的時間點數量: ${timeMap.size}`);
                
                // 判斷時間是否在交易時段內
                const isInTradingSession = (hour, minute) => {
                    const timeInMinutes = hour * 60 + minute;
                    
                    // 上午盤: 09:00-12:00 (540-720分鐘，包含12:00)
                    if (timeInMinutes >= 540 && timeInMinutes <= 720) return true;
                    
                    // 下午盤: 13:00-13:30 (780-810分鐘)
                    if (timeInMinutes >= 780 && timeInMinutes <= 810) return true;
                    
                    return false;
                };
                
                // 判斷是否為休市時段但應該延續價格
                const shouldKeepLastPrice = (hour, minute) => {
                    const timeInMinutes = hour * 60 + minute;
                    
                    // 12:01-12:59 休市時段，延續12:00的價格
                    if (timeInMinutes > 720 && timeInMinutes < 780) return true;
                    
                    return false;
                };
                
                // 填充價格數據
                let lastValidPrice = null;
                // 填充價格數據
                let lastTradingPrice = null; // 最後一個交易價格（12:00的價格）
                for (let i = 0; i < labels.length; i++) {
                    const timeLabel = labels[i];
                    const [hour, minute] = timeLabel.split(':').map(Number);
                    const timeInMinutes = hour * 60 + minute;
                    
                    if (timeMap.has(timeLabel)) {
                        // 有實際數據
                        const price = timeMap.get(timeLabel);
                        priceData[i] = price;
                        
                        if (isInTradingSession(hour, minute)) {
                            lastTradingPrice = price; // 更新最後交易價格
                        }
                        console.log(`${timeLabel}: 實際數據 ${price}`);
                        
                    } else if (timeInMinutes <= currentTimeInMinutes) {
                        // 已過去的時間，需要填補數據
                        
                        if (isInTradingSession(hour, minute) && lastTradingPrice !== null) {
                            // 交易時段內，使用最後交易價格
                            priceData[i] = lastTradingPrice;
                            
                        } else if (shouldKeepLastPrice(hour, minute) && lastTradingPrice !== null) {
                            // 休市時段（12:01-12:59），延續12:00的價格
                            priceData[i] = lastTradingPrice;
                            console.log(`${timeLabel}: 休市延續價格 ${lastTradingPrice}`);
                        }
                        // 其他情況（未來時間或無數據時段）保持 null
                    }
                    // 未來時間保持 null
                }
                
                console.log(`映射後的價格數據: ${priceData.filter(p => p !== null).length} 個有效點`);
                
                // 獲取最新價格
                const validPrices = priceData.filter(p => p !== null);
                const currentPrice = validPrices.length > 0 ? validPrices[validPrices.length - 1] : previousClose;
                
                // 計算漲跌
                const change = currentPrice && previousClose ? currentPrice - previousClose : 0;
                const changePercent = previousClose && previousClose !== 0 ? (change / previousClose) * 100 : 0;
                
                console.log(`昨收: ${previousClose}, 當前: ${currentPrice}, 漲跌: ${change.toFixed(2)}`);
                
                setChartData({
                    labels,
                    datasets: [
                        {
                            label: `股價 (${symbol?.replace('.TW', '')})`,
                            data: priceData,
                            // 動態線段顏色：根據每個點相對昨收價的高低設定顏色
                            segment: {
                                borderColor: (ctx) => {
                                    // 獲取當前點的價格
                                    const currentValue = ctx.p1.parsed?.y;
                                    if (currentValue === null || currentValue === undefined) return '#6b7280';
                                    
                                    // 與昨收價比較
                                    return currentValue >= previousClose ? '#ef4444' : '#22c55e'; // 紅漲綠跌
                                }
                            },
                            borderColor: '#6b7280', // 預設顏色（當segment無法使用時）
                            backgroundColor: (ctx) => {
                                // 根據當前整體趨勢設定背景色
                                if (!previousClose || !currentPrice) return 'rgba(107, 114, 128, 0.1)';
                                return currentPrice >= previousClose ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
                            },
                            borderWidth: 2,
                            fill: '+1',
                            tension: 0.1,
                            // 改善懸停檢測
                            pointRadius: 0, // 正常狀態不顯示點
                            pointHitRadius: 15, // 增加懸停檢測範圍
                            pointHoverRadius: 6, // 懸停時顯示較大的點
                            pointHoverBackgroundColor: (ctx) => {
                                // hover 點的顏色也基於昨收價
                                const value = ctx.parsed?.y;
                                if (!value || !previousClose) return '#6b7280';
                                return value >= previousClose ? '#ef4444' : '#22c55e';
                            },
                            pointHoverBorderColor: '#ffffff',
                            pointHoverBorderWidth: 2,
                            spanGaps: true
                        },
                        {
                            label: '昨收盤價',
                            data: Array(labels.length).fill(previousClose),
                            borderColor: '#6b7280',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            order: 1
                        }
                    ],
                    // 額外的資訊供tooltip使用
                    stockInfo: {
                        symbol: symbol?.replace('.TW', ''),
                        name: stockInfo?.n || stockInfo?.c || symbol?.replace('.TW', ''),
                        currentPrice,
                        previousClose,
                        change,
                        changePercent,
                        openPrice: stockInfo?.o || null,
                        highPrice: stockInfo?.h || null,
                        lowPrice: stockInfo?.l || null,
                        volume: stockInfo?.tv || null
                    },
                    previousClose,
                    currentPrice,
                    change,
                    changePercent: previousClose !== 0 ? ((change / previousClose) * 100) : 0
                });
                
                setLoading(false);
                
            } catch (err) {
                console.error('走勢圖數據獲取失敗:', err);
                setError('無法獲取數據');
                setLoading(false);
            }
        };

        fetchIntradayData();
        
        // 定時更新
        const interval = setInterval(fetchIntradayData, 15000); // 15秒更新
        
        return () => clearInterval(interval);
        
    }, [symbol]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        // 改善懸停交互體驗
        interaction: {
            mode: 'index', // 按 X 軸索引檢測
            intersect: false, // 不需要精確懸停在點上
            axis: 'x' // 主要基於 X 軸位置
        },
        layout: {
            padding: {
                top: 20,
                bottom: 20,
                left: 10,
                right: 10
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: true,
                    color: 'rgba(107, 114, 128, 0.2)'
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 },
                    callback: function(value, index) {
                        const label = this.getLabelForValue(value);
                        // 只顯示整點和半點
                        if (label && (label.includes(':00') || label.includes(':30'))) {
                            return label;
                        }
                        return '';
                    }
                }
            },
            y: {
                display: true,
                position: 'right',
                beginAtZero: false, // 不從0開始，讓價格範圍更合適
                grace: '5%', // 在數據範圍基礎上額外添加5%的空間
                grid: {
                    display: true,
                    color: 'rgba(107, 114, 128, 0.2)'
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 },
                    callback: function(value) {
                        return value.toFixed(2);
                    },
                    maxTicksLimit: 8 // 限制Y軸標籤數量，避免過度擁擠
                }
            }
        },
        plugins: {            
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    color: 'white',
                    font: {
                        size: 12
                    },
                    usePointStyle: true,
                    padding: 15,
                    filter: function(legendItem, chartData) {
                        // 只顯示股價線的圖例，隱藏昨收線
                        return legendItem.datasetIndex === 0;
                    },
                    generateLabels: function(chart) {
                        const info = chart.data.stockInfo;
                        if (info && info.currentPrice !== undefined && info.change !== undefined) {
                            return [{
                                text: `即時股價 NT$ ${info.currentPrice.toFixed(2)}`,
                                fillStyle: info.change >= 0 ? '#ef4444' : '#22c55e',
                                strokeStyle: info.change >= 0 ? '#ef4444' : '#22c55e',
                                pointStyle: 'line',
                                datasetIndex: 0
                            }];
                        }
                        return [{
                            text: '股價走勢',
                            fillStyle: '#6b7280',
                            strokeStyle: '#6b7280',
                            pointStyle: 'line',
                            datasetIndex: 0
                        }];
                    }
                }
            },
            tooltip: {
                enabled: true, // 確保 tooltip 啟用
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                // 改善觸發靈敏度
                caretPadding: 6,
                caretSize: 8,
                position: 'nearest', // 使用最近點定位
                filter: function(tooltipItem) {
                    // 只顯示股價線的 tooltip，過濾掉昨收線和 null 值
                    return tooltipItem.datasetIndex === 0 && tooltipItem.parsed.y !== null;
                },
                callbacks: {
                    title: (tooltipItems) => {
                        if (tooltipItems.length > 0) {
                            const stockInfo = tooltipItems[0].chart.data.stockInfo;
                            
                            if (stockInfo && stockInfo.name && stockInfo.symbol) {
                                return [
                                    `${stockInfo.name} (${stockInfo.symbol})`,
                                    `時間: ${tooltipItems[0].label}`
                                ];
                            } else {
                                return `時間: ${tooltipItems[0].label}`;
                            }
                        }
                        return '';
                    },
                    label: function(context) {
                        if (context.datasetIndex === 0 && context.parsed.y !== null) {
                            const price = context.parsed.y;
                            const stockInfo = context.chart.data.stockInfo;
                            
                            // 檢查 stockInfo 是否存在
                            if (!stockInfo || stockInfo.previousClose === undefined) {
                                return `股價: NT$ ${price.toFixed(2)}`;
                            }
                            
                            const change = price - stockInfo.previousClose;
                            const changePercent = ((change / stockInfo.previousClose) * 100);
                            
                            const result = [
                                `即時股價: NT$ ${price.toFixed(2)}`,
                                `漲跌: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`,
                                `昨收: NT$ ${stockInfo.previousClose.toFixed(2)}`
                            ];
                            
                            // 添加可選資訊，但確保它們存在且有效
                            if (stockInfo.openPrice && parseFloat(stockInfo.openPrice) > 0) {
                                result.push(`開盤: NT$ ${parseFloat(stockInfo.openPrice).toFixed(2)}`);
                            }
                            if (stockInfo.highPrice && parseFloat(stockInfo.highPrice) > 0) {
                                result.push(`最高: NT$ ${parseFloat(stockInfo.highPrice).toFixed(2)}`);
                            }
                            if (stockInfo.lowPrice && parseFloat(stockInfo.lowPrice) > 0) {
                                result.push(`最低: NT$ ${parseFloat(stockInfo.lowPrice).toFixed(2)}`);
                            }
                            if (stockInfo.volume && parseFloat(stockInfo.volume) > 0) {
                                const volumeInLots = Math.floor(parseFloat(stockInfo.volume) / 1000);
                                if (volumeInLots > 0) {
                                    result.push(`成交量: ${volumeInLots.toLocaleString()} 張`);
                                }
                            }
                            
                            console.log('Tooltip data:', {
                                price,
                                stockInfo,
                                result
                            });
                            
                            return result;
                        }
                        return '';
                    }
                }
            }
        },
        elements: {
            point: { 
                radius: 0, // 正常狀態不顯示點
                hitRadius: 15, // 增加全局懸停檢測範圍
                hoverRadius: 6 // 懸停時顯示的點大小
            },
            line: {
                borderWidth: 2,
                tension: 0.1
            }
        },
        animation: { 
            duration: 0 // 禁用動畫以提高性能和響應速度
        }
    };

    if (loading) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>載入中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#ef4444' }}>{error}</div>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>今日尚無交易數據</div>
            </div>
        );
    }

    return (
        <div style={{ 
            width: '100%',
            minHeight: height,
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'visible' // 允許內容超出容器
        }}>
            {/* 股票資訊面板 */}
            {chartData?.stockInfo && (
                <div style={{ 
                    padding: '15px 20px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div>
                            <h3 style={{ 
                                margin: 0, 
                                color: 'white', 
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>
                                {chartData.stockInfo.name} ({chartData.stockInfo.symbol})
                            </h3>
                            <div style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold', 
                                color: 'white',
                                fontFamily: 'SF Mono, Monaco, Inconsolata, monospace',
                                marginTop: '5px'
                            }}>
                                NT$ {chartData.stockInfo.currentPrice.toFixed(2)}
                            </div>
                        </div>
                        <div style={{ 
                            color: chartData.stockInfo.change >= 0 ? '#ef4444' : '#22c55e',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            {chartData.stockInfo.change >= 0 ? '+' : ''}{chartData.stockInfo.change.toFixed(2)}
                            <br />
                            ({chartData.stockInfo.changePercent >= 0 ? '+' : ''}{chartData.stockInfo.changePercent.toFixed(2)}%)
                        </div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        color: '#9ca3af', 
                        fontSize: '14px',
                        flexWrap: 'wrap'
                    }}>
                        <div>昨收: <span style={{ color: 'white' }}>NT$ {chartData.stockInfo.previousClose.toFixed(2)}</span></div>
                        {chartData.stockInfo.openPrice && (
                            <div>開盤: <span style={{ color: 'white' }}>NT$ {parseFloat(chartData.stockInfo.openPrice).toFixed(2)}</span></div>
                        )}
                        {chartData.stockInfo.highPrice && (
                            <div>最高: <span style={{ color: '#ef4444' }}>NT$ {parseFloat(chartData.stockInfo.highPrice).toFixed(2)}</span></div>
                        )}
                        {chartData.stockInfo.lowPrice && (
                            <div>最低: <span style={{ color: '#22c55e' }}>NT$ {parseFloat(chartData.stockInfo.lowPrice).toFixed(2)}</span></div>
                        )}
                        {chartData.stockInfo.volume && (
                            <div>成交量: <span style={{ color: 'white' }}>{chartData.stockInfo.volume} 張</span></div>
                        )}
                    </div>
                </div>
            )}
            
            {/* 走勢圖 */}
            <div style={{ 
                width: '100%',
                minHeight: '400px',
                height: 'auto', // 自動高度
                overflow: 'visible', // 允許圖表完整顯示
                position: 'relative'
            }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default SimpleStockChartFixed;