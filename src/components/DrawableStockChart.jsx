import React, { useState } from 'react';
import CustomStockChartFixed from './CustomStockChartFixed';
import TimeframeSelector from './TimeframeSelector';

// 帶繪圖工具的K線圖組件
const DrawableStockChart = ({ symbol, data, height = 600 }) => {
    const [timeframe, setTimeframe] = useState('1D');
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawingTool, setDrawingTool] = useState('line');
    const [drawings, setDrawings] = useState([]);

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
    };

    const toggleDrawingMode = () => {
        setIsDrawingMode(!isDrawingMode);
    };

    const handleDrawingToolChange = (tool) => {
        setDrawingTool(tool);
        if (!isDrawingMode) {
            setIsDrawingMode(true);
        }
    };

    const clearDrawings = () => {
        setDrawings([]);
        console.log('清除所有繪圖');
    };

    return (
        <div style={{ width: '100%' }}>
            {/* 工具欄 */}
            <div style={{ 
                marginBottom: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                border: '1px solid #444'
            }}>
                {/* 左側：時間框架選擇 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#ffffff', fontWeight: '600' }}>
                        📊 {symbol}
                    </span>
                    <TimeframeSelector 
                        selected={timeframe}
                        onSelect={handleTimeframeChange}
                    />
                </div>

                {/* 右側：繪圖工具 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#ffffff', fontSize: '14px', marginRight: '8px' }}>
                        繪圖工具:
                    </span>
                    
                    {/* 繪圖模式開關 */}
                    <button
                        onClick={toggleDrawingMode}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: isDrawingMode ? '#3b82f6' : 'transparent',
                            color: isDrawingMode ? 'white' : '#cccccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {isDrawingMode ? '✏️ 繪圖中' : '🖱️ 瀏覽'}
                    </button>

                    {/* 繪圖工具按鈕 */}
                    <button
                        onClick={() => handleDrawingToolChange('line')}
                        style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            backgroundColor: drawingTool === 'line' && isDrawingMode ? '#22c55e' : 'transparent',
                            color: drawingTool === 'line' && isDrawingMode ? 'white' : '#cccccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        title="直線"
                    >
                        📏
                    </button>

                    <button
                        onClick={() => handleDrawingToolChange('rectangle')}
                        style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            backgroundColor: drawingTool === 'rectangle' && isDrawingMode ? '#22c55e' : 'transparent',
                            color: drawingTool === 'rectangle' && isDrawingMode ? 'white' : '#cccccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        title="矩形"
                    >
                        ▭
                    </button>

                    <button
                        onClick={() => handleDrawingToolChange('trend')}
                        style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            backgroundColor: drawingTool === 'trend' && isDrawingMode ? '#22c55e' : 'transparent',
                            color: drawingTool === 'trend' && isDrawingMode ? 'white' : '#cccccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        title="趨勢線"
                    >
                        📈
                    </button>

                    {/* 清除按鈕 */}
                    <button
                        onClick={clearDrawings}
                        style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        title="清除所有繪圖"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* K線圖表 */}
            <div style={{
                width: '100%',
                minHeight: height,
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '10px',
                overflow: 'auto'
            }}>
                <CustomStockChartFixed
                    symbol={symbol}
                    data={data}
                    height={height - 20}
                    timeframe={timeframe}
                    drawingMode={isDrawingMode}
                    drawingTool={drawingTool}
                    drawings={drawings}
                    onDrawingsChange={setDrawings}
                />
            </div>

            {/* 繪圖模式提示 */}
            {isDrawingMode && (
                <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#1e40af',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    🖊️ 繪圖模式已啟用 - 使用 {drawingTool === 'line' ? '直線' : drawingTool === 'rectangle' ? '矩形' : '趨勢線'} 工具
                </div>
            )}
        </div>
    );
};

export default DrawableStockChart;