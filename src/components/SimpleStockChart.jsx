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
import { stockApi } from '../services/api';

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

const SimpleStockChart = ({ symbol, data, height = 400 }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIntradayData = async () => {
            if (!symbol) return;
            
            setLoading(true);
            setError(null);
            
            try {
                // 獲取5分K線數據作為當日走勢
                const stockData = await stockApi.getHistoricalData(symbol, 30, '5m');
                
                if (stockData && stockData.length > 0) {
                    // 只取今天的數據
                    const today = new Date();
                    const todayStr = today.toISOString().split('T')[0];
                    
                    const todayData = stockData.filter(item => {
                        const itemDate = new Date(item.x || item.timestamp);
                        const itemDateStr = itemDate.toISOString().split('T')[0];
                        return itemDateStr === todayStr;
                    });
                    
                    // 如果今天沒有數據，取最近一個交易日的數據
                    const finalData = todayData.length > 0 ? todayData : stockData.slice(-48); // 取最後48個5分K（一個交易日約8小時）
                    
                    if (finalData.length > 0) {
                        // 計算前一日收盤價作為基準線
                        let previousClose;
                        
                        if (todayData.length > 0) {
                            // 有今天的數據：找到昨天的最後一筆數據作為昨日收盤
                            const yesterdayData = stockData.filter(item => {
                                const itemDate = new Date(item.x || item.timestamp);
                                const itemDateStr = itemDate.toISOString().split('T')[0];
                                const yesterday = new Date(today);
                                yesterday.setDate(yesterday.getDate() - 1);
                                const yesterdayStr = yesterday.toISOString().split('T')[0];
                                return itemDateStr === yesterdayStr;
                            });
                            
                            if (yesterdayData.length > 0) {
                                // 使用昨天的最後一筆收盤價
                                previousClose = yesterdayData[yesterdayData.length - 1].c;
                            } else {
                                // 如果找不到昨天的數據，使用當日開盤價作為替代
                                previousClose = finalData[0].o;
                            }
                        } else {
                            // 沒有今天的數據：使用倒數第二個交易日的最後一筆作為前收盤
                            const allData = stockData;
                            if (allData.length > 48) {
                                // 找到前一個交易日的最後一筆數據
                                const prevSessionData = allData.slice(-96, -48); // 前一個交易日的數據
                                if (prevSessionData.length > 0) {
                                    previousClose = prevSessionData[prevSessionData.length - 1].c;
                                } else {
                                    previousClose = finalData[0].o;
                                }
                            } else {
                                previousClose = finalData[0].o;
                            }
                        }
                        
                        // 準備圖表數據
                        const labels = finalData.map(item => {
                            const date = new Date(item.x || item.timestamp);
                            return date.toLocaleTimeString('zh-TW', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                        });
                        
                        const prices = finalData.map(item => item.c); // 使用收盤價作為分時價格
                        
                        // 計算最終價格的漲跌狀態（用於默認顏色）
                        const currentPrice = prices[prices.length - 1];
                        const change = currentPrice - previousClose;
                        
                        setChartData({
                            labels,
                            datasets: [
                                {
                                    label: '股價',
                                    data: prices,
                                    // 動態線段顏色：根據每個點相對昨收價的漲跌
                                    segment: {
                                        borderColor: (ctx) => {
                                            // 獲取當前點和前一點的價格
                                            const currentValue = ctx.p1.parsed.y;
                                            return currentValue >= previousClose ? '#ef4444' : '#22c55e'; // 高於昨收紅色，低於昨收綠色
                                        }
                                    },
                                    borderColor: '#6b7280', // 默認顏色（備用）
                                    // 動態背景顏色：根據漲跌使用不同顏色
                                    backgroundColor: (ctx) => {
                                        const dataPoints = ctx.dataset.data;
                                        const currentPrice = dataPoints[dataPoints.length - 1];
                                        
                                        if (currentPrice > previousClose) {
                                            // 上漲：紅色填充
                                            const maxDistance = Math.max(...dataPoints.map(p => Math.abs(p - previousClose)));
                                            const intensity = Math.min(0.2, (maxDistance / previousClose) * 7);
                                            return `rgba(239, 68, 68, ${intensity})`;
                                        } else {
                                            // 下跌：綠色填充
                                            const maxDistance = Math.max(...dataPoints.map(p => Math.abs(p - previousClose)));
                                            const intensity = Math.min(0.2, (maxDistance / previousClose) * 7);
                                            return `rgba(34, 197, 94, ${intensity})`;
                                        }
                                    },
                                    borderWidth: 2,
                                    fill: '+1', // 填充到下一個數據集（昨收價基準線）
                                    tension: 0.1,
                                    pointRadius: 0,
                                    pointHoverRadius: 4,
                                    pointHoverBackgroundColor: (ctx) => {
                                        // hover點的顏色也基於昨收價
                                        const value = ctx.parsed.y;
                                        return value >= previousClose ? '#ef4444' : '#22c55e';
                                    },
                                    pointHoverBorderColor: '#ffffff',
                                    pointHoverBorderWidth: 2
                                },
                                {
                                    label: '昨收盤價',
                                    data: Array(prices.length).fill(previousClose),
                                    borderColor: '#6b7280',
                                    borderWidth: 1,
                                    borderDash: [5, 5],
                                    fill: false,
                                    pointRadius: 0,
                                    pointHoverRadius: 0,
                                    order: 1 // 確保昨收價線在走勢線之後渲染
                                }
                            ],
                            previousClose,
                            currentPrice,
                            change,
                            changePercent: previousClose !== 0 ? ((change / previousClose) * 100) : 0
                        });
                    }
                }
                
                setLoading(false);
            } catch (err) {
                console.error('獲取當日走勢數據失敗:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchIntradayData();
    }, [symbol]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false // 隱藏圖例
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 6,
                displayColors: false,
                callbacks: {
                    title: (tooltipItems) => {
                        if (tooltipItems.length > 0) {
                            return `時間: ${tooltipItems[0].label}`;
                        }
                        return '';
                    },
                    label: (context) => {
                        if (context.datasetIndex === 0) { // 只顯示股價線的tooltip
                            const price = context.raw;
                            const change = chartData ? price - chartData.previousClose : 0;
                            const changePercent = chartData && chartData.previousClose !== 0 ? 
                                ((change / chartData.previousClose) * 100) : 0;
                            
                            const changeText = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
                            const percentText = change >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
                            
                            return [
                                `股價: ${price?.toFixed(2)}`,
                                `漲跌: ${changeText} (${percentText})`
                            ];
                        }
                        return '';
                    }
                }
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
                    maxTicksLimit: 8,
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                display: true,
                position: 'right',
                grid: {
                    display: true,
                    color: 'rgba(107, 114, 128, 0.2)'
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11
                    },
                    callback: function(value) {
                        return value.toFixed(2);
                    }
                }
            }
        },
        elements: {
            point: {
                radius: 0
            }
        },
        animation: {
            duration: 0
        }
    };

    if (loading) {
        return (
            <div style={{ 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#1e1e1e',
                color: '#ffffff',
                borderRadius: '8px'
            }}>
                載入中...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#1e1e1e',
                color: '#ef4444',
                borderRadius: '8px'
            }}>
                載入失敗: {error}
            </div>
        );
    }

    if (!chartData) {
        return (
            <div style={{ 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#1e1e1e',
                color: '#6b7280',
                borderRadius: '8px'
            }}>
                無數據
            </div>
        );
    }

    const isUp = chartData.change >= 0;
    const changeColor = isUp ? '#ef4444' : '#22c55e';
    const changeText = isUp ? `+${chartData.change.toFixed(2)}` : chartData.change.toFixed(2);
    const percentText = isUp ? `+${chartData.changePercent.toFixed(2)}%` : `${chartData.changePercent.toFixed(2)}%`;

    return (
        <div style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
            {/* 標題和漲跌資訊 */}
            <div style={{ 
                marginBottom: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ 
                    margin: 0, 
                    color: '#ffffff',
                    fontSize: '16px'
                }}>
                    {symbol?.replace('.TW', '')} 當日走勢
                </h3>
                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ 
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        fontFamily: 'SF Mono, Monaco, Inconsolata, monospace'
                    }}>
                        {chartData.currentPrice?.toFixed(2)}
                    </span>
                    <span style={{ 
                        color: changeColor,
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>
                        {changeText} ({percentText})
                    </span>
                </div>
            </div>

            {/* 走勢圖表容器 */}
            <div style={{
                width: '100%',
                maxWidth: '100%',
                height: height - 50, // 減去標題區域的高度
                border: '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#1e1e1e',
                padding: '10px'
            }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default SimpleStockChart;