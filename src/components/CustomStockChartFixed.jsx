import React, { useState, useEffect } from 'react';
import CandlestickChart from './CandlestickChart';
import { stockApi } from '../services/api';

// 輔助函數：獲取時間框架的分鐘間隔
const getTimeFrameInterval = (timeframe) => {
    const intervals = {
        '5m': 5,
        '15m': 15,
        '30m': 30,
        'H': 60,
        'D': 24 * 60,
        'W': 7 * 24 * 60,
        'M': 30 * 24 * 60
    };
    return intervals[timeframe] || 5;
};

// 輔助函數：判斷是否需要創建新K棒
const shouldCreateNewKBar = (lastKBarTime, currentTime, intervalMinutes) => {
    const timeDiff = (currentTime - lastKBarTime) / (1000 * 60); // 分鐘差
    return timeDiff >= intervalMinutes;
};

// 輔助函數：創建新K棒
const createNewKBar = (currentTime, price, timeframe) => {
    return {
        x: currentTime,
        timestamp: currentTime.getTime(),
        o: price, // 開盤價為當前價
        h: price, // 最高價為當前價
        l: price, // 最低價為當前價
        c: price, // 收盤價為當前價
        v: 0 // 成交量暫設為0
    };
};

const CustomStockChart = ({ 
    symbol, 
    height = 400, 
    timeframe: externalTimeframe,
    drawingMode = false,
    drawingTool = 'line',
    drawings = [],
    onDrawingsChange = () => {}
}) => {
    // 根據 timeframe 計算對應的時間範圍
    const getInitialTimeRange = (tf) => {
        switch (tf) {
            case '5m':
                return 7; // 5分K：7天數據（包含歷史+當日）
            case '30m':
                return 14; // 30分K：14天數據（包含歷史+當日）
            case '1D':
                return 90; // 日K：90天數據（約3個月）
            case '1W':
                return 280; // 週K：280天數據（約40週）
            case '1M':
                return 330; // 月K：330天數據（約11個月）
            default:
                return 90; // 默認使用日K的範圍
        }
    };
    
    const [klineData, setKlineData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState(externalTimeframe || '1D'); // 使用外部傳入的 timeframe
    const [timeRange, setTimeRange] = useState(() => {
        const initialRange = getInitialTimeRange(externalTimeframe || '1D');
        console.log(`初始化 CustomStockChart: timeframe=${externalTimeframe || '1D'}, timeRange=${initialRange}`);
        return initialRange;
    });
    const [retryCount, setRetryCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // 監聽外部 timeframe 變化
    useEffect(() => {
        if (externalTimeframe && externalTimeframe !== timeframe) {
            setTimeframe(externalTimeframe);
            // 同時更新對應的 timeRange
            setTimeRange(getInitialTimeRange(externalTimeframe));
        }
    }, [externalTimeframe, timeframe]);

    // 監聽網路狀態變化
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (error) {
                // 網路恢復時自動重試
                handleRetry();
            }
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            setError('網路連線中斷，請檢查網路設定');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [error]);

    // 根據台股標準設定時間範圍
    useEffect(() => {
        let newTimeRange;
        switch (timeframe) {
            case '5m':
                newTimeRange = 1; // 5分K：當日數據（富果API實際會回傳近30日可用數據）
                break;
            case '30m':
                newTimeRange = 7; // 30分K：7天數據（富果API實際會回傳近30日可用數據）
                break;
            case '1D':
                newTimeRange = 90; // 日K：90天數據（約3個月），確保有足夠的交易日
                break;
            case '1W':
                newTimeRange = 280; // 週K：280天數據（約40週，不超過一年限制）
                break;
            case '1M':
                newTimeRange = 330; // 月K：330天數據（約11個月，不超過一年限制）
                break;
            default:
                newTimeRange = 90; // 默認使用日K的90天數據
                break;
        }
        
        if (newTimeRange !== timeRange) {
            setTimeRange(newTimeRange);
        }
    }, [timeframe]);

    useEffect(() => {
        const fetchKlineData = async () => {
            if (!symbol) return;

            setLoading(true);
            setError(null);
            
            try {
                console.log(`開始獲取 ${symbol} 的 ${timeframe} K 線數據，時間範圍: ${timeRange} 天...`);
                
                // 同時獲取K線數據和交易明細
                const [data, tradeData] = await Promise.all([
                    stockApi.getHistoricalData(symbol, timeRange, timeframe),
                    stockApi.getIntradayTrades(symbol, 100) // 獲取最新交易明細
                ]);
                
                if (data && data.length > 0) {
                    let finalData = [...data];
                    
                    // 如果有交易數據，更新當前K棒
                    if (tradeData && tradeData.length > 0) {
                        const latestTrade = tradeData[0];
                        const now = new Date();
                        const today = now.toISOString().split('T')[0];
                        
                        // 獲取最後一根K棒
                        const lastKBar = finalData[finalData.length - 1];
                        const lastKBarDate = new Date(lastKBar.x || lastKBar.timestamp);
                        const lastKBarDateStr = lastKBarDate.toISOString().split('T')[0];
                        
                        if (lastKBarDateStr === today) {
                            // 更新今日最後一根K棒
                            finalData[finalData.length - 1] = {
                                ...lastKBar,
                                c: latestTrade.price, // 更新收盤價為最新成交價
                                h: Math.max(lastKBar.h, latestTrade.price), // 更新最高價
                                l: Math.min(lastKBar.l, latestTrade.price), // 更新最低價
                                v: lastKBar.v // 保持原成交量
                            };
                            console.log(`更新當日K棒: 最新價格=${latestTrade.price}`);
                        } else if (timeframe === '5m' || timeframe === '15m' || timeframe === '30m' || timeframe === 'H') {
                            // 對於分鐘級K線，如果最後一根K棒不是當前時間段，創建新K棒
                            const currentTimeFrame = getTimeFrameInterval(timeframe);
                            const shouldCreateNew = shouldCreateNewKBar(lastKBarDate, now, currentTimeFrame);
                            
                            if (shouldCreateNew) {
                                const newKBar = createNewKBar(now, latestTrade.price, timeframe);
                                finalData.push(newKBar);
                                console.log(`創建新的${timeframe}K棒: 價格=${latestTrade.price}`);
                            }
                        }
                    }
                    
                    setKlineData(finalData);
                    setRetryCount(0);
                    console.log(`成功獲取並更新 ${finalData.length} 筆 ${timeframe} 數據`);
                } else {
                    throw new Error('沒有收到有效數據');
                }
            } catch (err) {
                console.error('獲取 K 線數據失敗:', err);
                setError(err.message || '獲取數據時發生未知錯誤');
                setKlineData(null);
                setRetryCount(prev => prev + 1);
            } finally {
                setLoading(false);
            }
        };

        fetchKlineData();
        
        // 設定定時更新 - 盤中時間更頻繁更新，盤後較少更新
        const now = new Date();
        const hour = now.getHours();
        const isMarketHours = (hour >= 9 && hour < 14); // 09:00-13:30 為盤中時間

        // 盤中時間：15秒更新一次，盤後：5分鐘更新一次
        const updateInterval = isMarketHours ? 15000 : 300000;
        
        const intervalId = setInterval(() => {
            console.log(`定時更新 ${symbol} 的圖表數據...`);
            fetchKlineData();
        }, updateInterval);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [symbol, timeRange, timeframe]);

    const handleTimeRangeChange = (days) => {
        if (days !== timeRange) {
            setTimeRange(days);
            setRetryCount(0); // 重置重試計數
        }
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setLoading(true);
        
        // 觸發重新獲取數據
        const fetchData = async () => {
            try {
                const data = await stockApi.getHistoricalData(symbol, timeRange, timeframe);
                if (data && data.length > 0) {
                    setKlineData(data);
                    setRetryCount(0);
                } else {
                    throw new Error('沒有收到有效數據');
                }
            } catch (err) {
                setError(err.message || '重試失敗');
                setKlineData(null);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    };

    if (loading) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>載入 K 線圖中...</p>
                    {retryCount > 0 && <p style={{ fontSize: '0.9em', color: '#666' }}>重試次數: {retryCount}</p>}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="error-message" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '2em', marginBottom: '10px' }}>📈❌</div>
                    <p><strong>無法載入 K 線圖</strong></p>
                    <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>{error}</p>
                    
                    {!isOnline && (
                        <div style={{ 
                            background: '#fff3cd', 
                            border: '1px solid #ffeaa7', 
                            borderRadius: '4px', 
                            padding: '10px', 
                            marginBottom: '15px',
                            fontSize: '0.9em'
                        }}>
                            🔌 網路連線中斷，請檢查網路設定後重試
                        </div>
                    )}
                    
                    {error.includes('富果 API') && (
                        <div style={{ 
                            background: '#e3f2fd', 
                            border: '1px solid #2196f3', 
                            borderRadius: '4px', 
                            padding: '10px', 
                            marginBottom: '15px',
                            fontSize: '0.9em'
                        }}>
                            💡 <strong>富果 API 免費版限制</strong><br/>
                            • 僅支援當日盤中數據<br/>
                            • 歷史數據需要付費版本<br/>
                            • 系統將自動使用備用數據源
                        </div>
                    )}
                    
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '0.9em', color: '#777' }}>
                            可能的原因：
                        </p>
                        <ul style={{ 
                            fontSize: '0.8em', 
                            color: '#666', 
                            textAlign: 'left',
                            display: 'inline-block',
                            margin: '10px 0'
                        }}>
                            <li>API 免費額度限制</li>
                            <li>網路連線不穩定</li>
                            <li>股票代號不存在或已下市</li>
                            <li>CORS 政策限制</li>
                        </ul>
                    </div>
                    
                    <button 
                        onClick={handleRetry}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: isOnline ? '#007bff' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isOnline ? 'pointer' : 'not-allowed',
                            fontSize: '0.9em',
                            marginRight: '10px'
                        }}
                        disabled={!isOnline}
                    >
                        🔄 重新載入
                    </button>
                    
                    {retryCount > 3 && (
                        <p style={{ fontSize: '0.8em', color: '#888', marginTop: '15px' }}>
                            ⚠️ 多次重試失敗，建議：<br/>
                            1. 檢查網路連線<br/>
                            2. 嘗試其他股票代號<br/>
                            3. 稍後再試<br/>
                            4. 考慮升級到付費 API
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // 如果沒有數據，顯示空狀態
    if (!klineData || klineData.length === 0) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="error-message" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '2em', marginBottom: '10px' }}>📊</div>
                    <p><strong>沒有可用的 K 線數據</strong></p>
                    <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                        {symbol} 在選定的時間範圍內沒有交易數據
                    </p>
                    <button 
                        onClick={handleRetry}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9em'
                        }}
                    >
                        🔄 重新載入
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* 只保留狀態資訊，移除重複的時間選擇器 */}
            <div style={{ 
                marginBottom: '10px', 
                display: 'flex', 
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: isOnline ? '#28a745' : '#dc3545' 
                }}></span>
                <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {isOnline ? '線上' : '離線'}
                </span>
                {klineData && (
                    <>
                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                            • {klineData.length} 筆數據
                        </span>
                        <span style={{ fontSize: '0.8em', color: klineData.some(d => d.isSimulated) ? '#ff9800' : '#28a745' }}>
                            • {klineData.some(d => d.isSimulated) ? '模擬數據' : '真實數據'}
                        </span>
                    </>
                )}
            </div>
            <CandlestickChart 
                data={klineData}
                symbol={symbol}
                height={height}
                timeframe={timeframe}
                drawingMode={drawingMode}
                drawingTool={drawingTool}
                drawings={drawings}
                onDrawingsChange={onDrawingsChange}
            />
        </div>
    );
};

export default CustomStockChart;