import React, { useEffect, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    TimeSeriesScale,
    Tooltip,
    Legend,
    BarElement,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { zhTW } from 'date-fns/locale';

// 註冊 Chart.js 組件
ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    TimeSeriesScale,
    Tooltip,
    Legend,
    BarElement,
    CandlestickController,
    CandlestickElement,
    annotationPlugin
);

// 根據時間框架計算時間間隔（毫秒）
const getTimeInterval = (timeframe) => {
    switch (timeframe) {
        case '5m':
            return 5 * 60 * 1000; // 5分鐘
        case '30m':
            return 30 * 60 * 1000; // 30分鐘
        case '1D':
        case 'D':
            return 24 * 60 * 60 * 1000; // 1天
        case '1W':
            return 7 * 24 * 60 * 60 * 1000; // 1週
        case '1M':
            return 30 * 24 * 60 * 60 * 1000; // 1個月（近似）
        default:
            return 24 * 60 * 60 * 1000; // 默認1天
    }
};

const CandlestickChart = ({ 
    data, 
    symbol, 
    height = 400, 
    timeframe = 'D',
    drawingMode = false,
    drawingTool = 'line',
    drawings = [],
    onDrawingsChange = () => {}
}) => {
    const chartRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [previewPoint, setPreviewPoint] = useState(null); // 用於追蹤滑鼠位置的預覽點

    // 清理Chart實例，防止Canvas重用錯誤
    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, []);
    
    // 當數據更新時，自動滾動到最右邊
    useEffect(() => {
        if (containerRef.current && data && data.length > 0) {
            const timer = setTimeout(() => {
                containerRef.current.scrollLeft = containerRef.current.scrollWidth;
            }, 100); // 延遲一點時間確保圖表已渲染
            return () => clearTimeout(timer);
        }
    }, [data, timeframe]);
    
    // 當繪圖模式或工具變化時，清理繪圖狀態
    useEffect(() => {
        if (!drawingMode) {
            setIsDrawing(false);
            setStartPoint(null);
            setPreviewPoint(null);
        }
    }, [drawingMode, drawingTool]);
    
    if (!data || data.length === 0) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>沒有數據</div>
            </div>
        );
    }

    // 過濾有效交易數據，去除休市日期和無效數據
    const filteredData = data.filter(item => {
        if (!item) return false;
        
        // 檢查是否為有效的交易數據
        const hasValidPrice = (item.o > 0 && item.h > 0 && item.l > 0 && item.c > 0);
        const hasValidVolume = item.v > 0; // 成交量必須大於0
        
        // 檢查日期是否為工作日（針對日K線）
        if (timeframe === '1D' || timeframe === 'D') {
            const date = new Date(item.x || item.timestamp);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0=週日, 6=週六
            
            return hasValidPrice && hasValidVolume && !isWeekend;
        }
        
        return hasValidPrice && hasValidVolume;
    });

    console.log(`過濾前: ${data.length} 筆，過濾後: ${filteredData.length} 筆`);
    
    if (filteredData.length > 0) {
        console.log(`圖表數據時間範圍: ${filteredData[0].x.toLocaleDateString('zh-TW')} 到 ${filteredData[filteredData.length-1].x.toLocaleDateString('zh-TW')}`);
        console.log('最後幾筆數據:', filteredData.slice(-3).map(item => ({
            date: item.x.toLocaleDateString('zh-TW'),
            close: item.c
        })));
    }
    
    // 根據時間框架和數據量動態調整K棒寬度
    const dataCount = filteredData.length;
    let barPercentage = 0.9;
    let categoryPercentage = 1.0;
    let maxBarThickness = 20;
    
    // 計算價格範圍，用於優化Y軸顯示（讓K棒看起來更長）
    let priceMin = Math.min(...filteredData.map(item => item.l));
    let priceMax = Math.max(...filteredData.map(item => item.h));
    let priceRange = priceMax - priceMin;
    
    // 根據時間框架調整Y軸範圍的緊湊程度
    let yAxisPadding = 0.1; // 預設10%的padding
    if (timeframe === '5m') {
        yAxisPadding = 0.01; // 5分K：5% padding，讓K棒更長
        // 5分K：K棒較大，適合查看短期波動
        if (dataCount > 300) {
            barPercentage = 0.8;
            categoryPercentage = 0.9;
            maxBarThickness = 8;
        } else if (dataCount > 150) {
            barPercentage = 0.85;
            categoryPercentage = 0.95;
            maxBarThickness = 12;
        } else {
            barPercentage = 0.9;
            categoryPercentage = 1.0;
            maxBarThickness = 18;
        }
    } else if (timeframe === '30m') {
        yAxisPadding = 0.03; // 30分K：6% padding，讓K棒更長
        // 30分K：K棒更大，清楚顯示價格變化
        if (dataCount > 200) {
            barPercentage = 0.8;
            categoryPercentage = 0.9;
            maxBarThickness = 10;
        } else if (dataCount > 100) {
            barPercentage = 0.85;
            categoryPercentage = 0.95;
            maxBarThickness = 15;
        } else {
            barPercentage = 0.9;
            categoryPercentage = 1.0;
            maxBarThickness = 22;
        }
    } else if (timeframe === '1D' || timeframe === 'D') {
        yAxisPadding = 0.05; // 日K：8% padding，讓K棒更長
        // 日K：K棒較大，便於分析每日走勢
        if (dataCount > 250) {
            barPercentage = 0.7;
            categoryPercentage = 0.85;
            maxBarThickness = 8;
        } else if (dataCount > 120) {
            barPercentage = 0.8;
            categoryPercentage = 0.9;
            maxBarThickness = 12;
        } else if (dataCount > 60) {
            barPercentage = 0.85;
            categoryPercentage = 0.95;
            maxBarThickness = 16;
        } else {
            barPercentage = 0.9;
            categoryPercentage = 1.0;
            maxBarThickness = 25;
        }
    } else {
        // 週K、月K：保持原有邏輯，正常padding
        yAxisPadding = 0.1;
        if (dataCount > 200) {
            barPercentage = 0.6;
            categoryPercentage = 0.8;
            maxBarThickness = 6;
        } else if (dataCount > 100) {
            barPercentage = 0.7;
            categoryPercentage = 0.9;
            maxBarThickness = 10;
        } else if (dataCount < 30) {
            barPercentage = 0.9;
            categoryPercentage = 1.0;
            maxBarThickness = 25;
        }
    }
    
    // 計算優化後的Y軸範圍
    const yAxisMin = priceMin - (priceRange * yAxisPadding);
    const yAxisMax = priceMax + (priceRange * yAxisPadding);

    // 為右側預留空間（約10個K棒的寬度）
    const rightPadding = 10;
    const paddedLabels = [...filteredData.map((item, index) => {
        const date = new Date(item.x || item.timestamp);
        if (timeframe === '5m') {
            return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        } else if (timeframe === '30m') {
            return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) + ' ' +
                   date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
        }
    }), ...Array(rightPadding).fill('')]; // 添加空標籤作為右側空間

    const chartData = {
        labels: paddedLabels,
        datasets: [
            {
                label: `${symbol} K線圖`,
                data: filteredData.map((item, index) => ({
                    x: index, // 使用索引作為x座標，不包含右側填充
                    o: item.o,
                    h: item.h,
                    l: item.l,
                    c: item.c,
                    v: item.v
                })),
                // chartjs-chart-financial 的正確配置方式（根據官方範例）
                backgroundColors: {
                    up: '#ef4444',      // 上漲K棒：紅色（台股習慣）
                    down: '#22c55e',    // 下跌K棒：綠色（台股習慣）
                    unchanged: '#6b7280' // 平盤K棒：灰色
                },
                borderColors: {
                    up: '#ef4444',      // 上漲K棒邊框：紅色
                    down: '#22c55e',    // 下跌K棒邊框：綠色
                    unchanged: '#6b7280' // 平盤K棒邊框：灰色
                },
                borderWidth: 1.5,
                barPercentage: barPercentage,
                categoryPercentage: categoryPercentage,
                maxBarThickness: maxBarThickness,
                minBarLength: 1,
                
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        layout: {
            padding: {
                left: 15,
                right: 15,
                top: 15,
                bottom: 15
            }
        },
        elements: {
            point: {
                radius: 0 // 隱藏數據點
            }
        },
        scales: {
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: timeframe === '5m' ? '時間(5分)' : timeframe === '30m' ? '時間(30分)' : '日期',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)',
                    lineWidth: 0.5
                },
                ticks: {
                    maxTicksLimit: Math.min(filteredData.length + rightPadding, 15),
                    autoSkip: true,
                    maxRotation: 45,
                    font: {
                        size: 10
                    },
                    // 過濾掉空的標籤，避免在右側空間顯示刻度
                    callback: function(value, index) {
                        return paddedLabels[index] || '';
                    }
                }
            },
            y: {
                type: 'linear',
                position: 'right',
                min: yAxisMin,  // 使用計算出的最小值，讓K棒看起來更長
                max: yAxisMax,  // 使用計算出的最大值，讓K棒看起來更長
                title: {
                    display: true,
                    text: '股價 (NT$)',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)',
                    lineWidth: 0.5
                },
                ticks: {
                    callback: function(value) {
                        if (timeframe === '5m' || timeframe === '30m' || timeframe === '1D' || timeframe === 'D') {
                            // 短期時間框架：顯示更多小數位，讓價格間格更密集
                            return value.toFixed(2);
                        } else {
                            // 長期時間框架：保持原有精確度
                            return value.toFixed(1);
                        }
                    },
                    font: {
                        size: 11
                    }
                }
            }
        },
        plugins: {
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
                            const index = tooltipItems[0].dataIndex;
                            const item = filteredData[index];
                            const date = new Date(item.x || item.timestamp);
                            
                            // 30分K和5分K顯示日期 + 時間
                            if (timeframe === '30m' || timeframe === '5m') {
                                const dateStr = date.toLocaleDateString('zh-TW', {
                                    year: 'numeric',
                                    month: '2-digit', 
                                    day: '2-digit',
                                    weekday: 'short'
                                });
                                const timeStr = date.toLocaleTimeString('zh-TW', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                });
                                return [dateStr, timeStr];
                            } else {
                                // 其他時間框架保持原有顯示
                                return date.toLocaleDateString('zh-TW', {
                                    year: 'numeric',
                                    month: '2-digit', 
                                    day: '2-digit',
                                    weekday: 'short'
                                });
                            }
                        }
                        return '';
                    },
                    label: (context) => {
                        const data = context.raw;
                        if (data) {
                            const change = data.c - data.o;
                            const changePercent = ((change / data.o) * 100).toFixed(2);
                            const changeText = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
                            const changePercentText = change >= 0 ? `+${changePercent}%` : `${changePercent}%`;
                            
                            // 智能處理成交量顯示
                            // 如果數值很大(>100000)，自動轉為成交張量顯示
                            // 如果數值較小，直接顯示為成交量
                            const rawVolume = data.v || 0;
                            let volumeDisplay, volumeUnit;
                            
                            if (rawVolume > 100000) {
                                // 大數值：轉換為成交張量（除以1000）
                                volumeDisplay = Math.round(rawVolume / 1000);
                                volumeUnit = '成交張量';
                            } else {
                                // 小數值：可能已經是成交張量，直接顯示
                                volumeDisplay = rawVolume;
                                volumeUnit = '成交張量';
                            }
                            
                            return [
                                `開盤: ${data.o?.toFixed(2)}`,
                                `最高: ${data.h?.toFixed(2)}`,
                                `最低: ${data.l?.toFixed(2)}`,
                                `收盤: ${data.c?.toFixed(2)}`,
                                `漲跌: ${changeText} (${changePercentText})`,
                                `${volumeUnit}: ${volumeDisplay?.toLocaleString()}`
                            ];
                        }
                        return [];
                    }
                }
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 12
                    }
                }
            },
            annotation: {
                annotations: (() => {
                    // 先添加已完成的繪圖
                    const finalAnnotations = drawings.reduce((annotations, drawing) => {
                        console.log('Adding annotation:', drawing);
                        
                        // 計算擴展後的最大索引範圍
                        const maxIndexRange = filteredData.length + rightPadding - 1;
                        
                        if (drawing.type === 'line') {
                            annotations[`line_${drawing.id}`] = {
                                type: 'line',
                                xMin: drawing.start.index !== undefined ? drawing.start.index : 0,
                                xMax: drawing.end.index !== undefined ? drawing.end.index : maxIndexRange,
                                yMin: drawing.start.y,
                                yMax: drawing.end.y,
                                borderColor: 'rgba(255, 99, 132, 1)',
                                borderWidth: 3,
                                display: true,
                                drawTime: 'afterDraw'
                            };
                        } else if (drawing.type === 'rectangle') {
                            annotations[`box_${drawing.id}`] = {
                                type: 'box',
                                xMin: drawing.start.index !== undefined ? drawing.start.index : 0,
                                xMax: drawing.end.index !== undefined ? drawing.end.index : maxIndexRange,
                                yMin: Math.min(drawing.start.y, drawing.end.y),
                                yMax: Math.max(drawing.start.y, drawing.end.y),
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 2,
                                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                                display: true
                            };
                        } else if (drawing.type === 'trend') {
                            annotations[`trend_${drawing.id}`] = {
                                type: 'line',
                                xMin: drawing.start.index !== undefined ? drawing.start.index : 0,
                                xMax: drawing.end.index !== undefined ? drawing.end.index : maxIndexRange,
                                yMin: drawing.start.y,
                                yMax: drawing.end.y,
                                borderColor: 'rgba(255, 205, 86, 1)',
                                borderWidth: 3,
                                borderDash: [8, 8],
                                display: true,
                                drawTime: 'afterDraw'
                            };
                        }
                        return annotations;
                    }, {});

                    // 添加預覽線條（如果正在繪圖中）
                    if (isDrawing && startPoint && previewPoint) {
                        if (drawingTool === 'line') {
                            finalAnnotations['preview_line'] = {
                                type: 'line',
                                xMin: startPoint.index,
                                xMax: previewPoint.index,
                                yMin: startPoint.y,
                                yMax: previewPoint.y,
                                borderColor: 'rgba(255, 99, 132, 0.6)', // 半透明預覽
                                borderWidth: 2,
                                borderDash: [4, 4], // 虛線表示預覽
                                display: true,
                                drawTime: 'afterDraw'
                            };
                        } else if (drawingTool === 'rectangle') {
                            finalAnnotations['preview_box'] = {
                                type: 'box',
                                xMin: startPoint.index,
                                xMax: previewPoint.index,
                                yMin: Math.min(startPoint.y, previewPoint.y),
                                yMax: Math.max(startPoint.y, previewPoint.y),
                                borderColor: 'rgba(54, 162, 235, 0.6)', // 半透明預覽
                                borderWidth: 1,
                                borderDash: [4, 4], // 虛線邊框
                                backgroundColor: 'rgba(54, 162, 235, 0.05)', // 很淡的背景
                                display: true
                            };
                        } else if (drawingTool === 'trend') {
                            finalAnnotations['preview_trend'] = {
                                type: 'line',
                                xMin: startPoint.index,
                                xMax: previewPoint.index,
                                yMin: startPoint.y,
                                yMax: previewPoint.y,
                                borderColor: 'rgba(255, 205, 86, 0.6)', // 半透明預覽
                                borderWidth: 2,
                                borderDash: [6, 6], // 虛線表示預覽
                                display: true,
                                drawTime: 'afterDraw'
                            };
                        }
                    }

                    return finalAnnotations;
                })()
            }
        },
        animation: {
            duration: 0
        }
    };

    // 處理圖表點擊事件
    const handleChartClick = (event) => {
        if (!drawingMode || !chartRef.current) return;
        
        const chart = chartRef.current;
        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const canvasPosition = { x, y };
        const dataXIndex = Math.round(chart.scales.x.getValueForPixel(canvasPosition.x));
        const dataY = chart.scales.y.getValueForPixel(canvasPosition.y);
        
        // 允許繪圖延伸到右側空間（包含 rightPadding 區域）
        const maxIndex = filteredData.length + rightPadding - 1;
        const validIndex = Math.max(0, Math.min(dataXIndex, maxIndex));
        
        // 對於超出實際數據範圍的索引，創建虛擬的時間戳
        let actualDate;
        if (validIndex < filteredData.length) {
            actualDate = filteredData[validIndex]?.x || filteredData[validIndex]?.timestamp;
        } else {
            // 為右側空間創建未來時間戳
            const lastDataPoint = filteredData[filteredData.length - 1];
            const lastDate = new Date(lastDataPoint.x || lastDataPoint.timestamp);
            const timeInterval = getTimeInterval(timeframe);
            const futureSteps = validIndex - filteredData.length + 1;
            actualDate = new Date(lastDate.getTime() + (timeInterval * futureSteps)).getTime();
        }
        
        if (!isDrawing) {
            // 第一次點擊：設定開始點，進入預覽模式
            setIsDrawing(true);
            setStartPoint({ x: actualDate, y: dataY, index: validIndex });
            setPreviewPoint({ x: actualDate, y: dataY, index: validIndex });
            console.log('開始繪圖:', { date: new Date(actualDate), y: dataY, index: validIndex });
        } else {
            // 第二次點擊：完成繪圖
            setIsDrawing(false);
            const newDrawing = {
                id: Date.now(),
                type: drawingTool,
                start: startPoint,
                end: { x: actualDate, y: dataY, index: validIndex }
            };
            onDrawingsChange([...drawings, newDrawing]);
            setStartPoint(null);
            setPreviewPoint(null);
            console.log('完成繪圖:', newDrawing);
        }
    };

    // 處理滑鼠移動事件（用於預覽繪圖）
    const handleChartMouseMove = (event) => {
        if (!drawingMode || !chartRef.current || !isDrawing) return;
        
        const chart = chartRef.current;
        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const canvasPosition = { x, y };
        const dataXIndex = Math.round(chart.scales.x.getValueForPixel(canvasPosition.x));
        const dataY = chart.scales.y.getValueForPixel(canvasPosition.y);
        
        const maxIndex = filteredData.length + rightPadding - 1;
        const validIndex = Math.max(0, Math.min(dataXIndex, maxIndex));
        
        let actualDate;
        if (validIndex < filteredData.length) {
            actualDate = filteredData[validIndex]?.x || filteredData[validIndex]?.timestamp;
        } else {
            const lastDataPoint = filteredData[filteredData.length - 1];
            const lastDate = new Date(lastDataPoint.x || lastDataPoint.timestamp);
            const timeInterval = getTimeInterval(timeframe);
            const futureSteps = validIndex - filteredData.length + 1;
            actualDate = new Date(lastDate.getTime() + (timeInterval * futureSteps)).getTime();
        }
        
        // 更新預覽點，這會觸發重新渲染
        setPreviewPoint({ x: actualDate, y: dataY, index: validIndex });
    };

    return (
        <div style={{ height, width: '100%', position: 'relative' }}>
            <div 
                ref={containerRef}
                onClick={drawingMode ? handleChartClick : undefined}
                onMouseMove={drawingMode && isDrawing ? handleChartMouseMove : undefined}
                style={{ 
                    width: '100%', 
                    height: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    maxWidth: '100%',
                    scrollBehavior: 'smooth' // 添加平滑滾動
                }}
            >
                <div style={{ 
                    width: Math.max(filteredData.length * (timeframe === '5m' ? 18 : timeframe === '30m' ? 20 : timeframe === '1D' || timeframe === 'D' ? 22 : 15), 800),
                    height: '100%',
                    minHeight: height - 20
                }}>
                    <Chart
                        ref={chartRef}
                        type="candlestick"
                        data={chartData}
                        options={{
                            ...options,
                            maintainAspectRatio: false,
                            responsive: true,
                            layout: {
                                padding: {
                                    left: 0,
                                    right: 60,
                                    top: 30,
                                    bottom: 30
                                }
                            },
                            scales: {
                                ...options.scales,
                                x: {
                                    ...options.scales.x,
                                    position: 'bottom',
                                },
                                y: {
                                    ...options.scales.y,
                                    position: 'right',
                                }
                            },
                            // 使用 interaction 配置
                            interaction: {
                                intersect: false,
                                mode: 'index'
                            }
                        }}
                        style={{ cursor: drawingMode ? 'crosshair' : 'default' }}
                    />
                </div>
            </div>
            
            {drawingMode && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none'
                }}>
                    {isDrawing ? `🎯 移動滑鼠選擇結束點，再點擊完成 ${drawingTool === 'line' ? '直線' : drawingTool === 'rectangle' ? '矩形' : '趨勢線'}` : `🖊️ 繪圖模式: ${drawingTool === 'line' ? '直線' : drawingTool === 'rectangle' ? '矩形' : '趨勢線'} - 點擊開始繪圖`}
                </div>
            )}
            
            {drawings.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(34, 197, 94, 0.9)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none'
                }}>
                     已繪製: {drawings.length}
                </div>
            )}
        </div>
    );
};

export default CandlestickChart;
