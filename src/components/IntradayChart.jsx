import React, { useEffect, useRef, useState } from 'react';
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
import { getStockData } from '../services/api';

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

const IntradayChart = ({ symbol, height = 400 }) => {
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
                const data = await getStockData(symbol, 30, '5m'); // 30天的5分K線
                
                if (data && data.length > 0) {
                    // 只取今天的數據
                    const today = new Date();
                    const todayStr = today.toISOString().split('T')[0];
                    
                    const todayData = data.filter(item => {
                        const itemDate = new Date(item.x || item.timestamp);
                        const itemDateStr = itemDate.toISOString().split('T')[0];
                        return itemDateStr === todayStr;
                    });
                    
                    // 如果今天沒有數據，取最近一個交易日
                    const finalData = todayData.length > 0 ? todayData : data.slice(-48); // 取最後48個5分K（一個交易日）
                    
                    // 計算前一日收盤價作為基準線
                    const previousClose = finalData.length > 0 ? finalData[0].o : 0;
                    
                    // 準備圖表數據
                    const labels = finalData.map(item => {
                        const date = new Date(item.x || item.timestamp);
                        return date.toLocaleTimeString('zh-TW', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                    });
                    
                    const prices = finalData.map(item => item.c); // 使用收盤價作為分時價格
                    
                    // 計算漲跌幅度來決定顏色
                    const currentPrice = prices[prices.length - 1];
                    const change = currentPrice - previousClose;
                    const isUp = change >= 0;
                    const lineColor = isUp ? '#ef4444' : '#22c55e'; // 台股紅漲綠跌
                    const fillColor = isUp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
                    
                    setChartData({
                        labels,
                        datasets: [
                            {
                                label: '股價',
                                data: prices,
                                borderColor: lineColor,
                                backgroundColor: fillColor,
                                borderWidth: 2,
                                fill: true,
                                tension: 0.1,
                                pointRadius: 0,
                                pointHoverRadius: 4,
                                pointHoverBackgroundColor: lineColor,
                                pointHoverBorderColor: '#ffffff',
                                pointHoverBorderWidth: 2
                            },
                            {
                                label: '前收盤價',
                                data: Array(prices.length).fill(previousClose),
                                borderColor: '#6b7280',
                                borderWidth: 1,
                                borderDash: [5, 5],
                                fill: false,
                                pointRadius: 0,
                                pointHoverRadius: 0
                            }
                        ],
                        previousClose,
                        currentPrice,
                        change,
                        changePercent: previousClose !== 0 ? ((change / previousClose) * 100) : 0
                    });
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
        <div style={{ 
            width: '100%', 
            height: '100%',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            padding: '15px',
            position: 'relative'
        }}>
            {/* 標題和漲跌資訊 */}
            <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                color: '#ffffff'
            }}>
                <h3 style={{ 
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 'bold'
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

            {/* 圖表 */}
            <div style={{ height: height - 70 }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default IntradayChart;