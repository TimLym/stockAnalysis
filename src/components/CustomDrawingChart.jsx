import React, { useState, useRef, useEffect } from 'react';
import CandlestickChart from './CandlestickChart';

const DrawingTools = ({ onSelectTool, selectedTool }) => {
    const tools = [
        { id: 'select', name: '選擇', icon: '🖱️' },
        { id: 'trendline', name: '趨勢線', icon: '📈' },
        { id: 'horizontal', name: '水平線', icon: '━' },
        { id: 'vertical', name: '垂直線', icon: '┃' },
        { id: 'rectangle', name: '矩形', icon: '▭' },
        { id: 'text', name: '文字', icon: '🔤' },
        { id: 'clear', name: '清除', icon: '🗑️' }
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '8px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
            flexWrap: 'wrap'
        }}>
            <span style={{ 
                fontSize: '0.9em', 
                fontWeight: '600', 
                color: '#475569',
                alignSelf: 'center',
                marginRight: '8px'
            }}>
                繪圖工具：
            </span>
            {tools.map(tool => (
                <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    style={{
                        padding: '8px 12px',
                        fontSize: '0.8em',
                        backgroundColor: selectedTool === tool.id ? '#3b82f6' : 'white',
                        color: selectedTool === tool.id ? 'white' : '#475569',
                        border: '1px solid',
                        borderColor: selectedTool === tool.id ? '#3b82f6' : '#d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        minWidth: '70px',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        if (selectedTool !== tool.id) {
                            e.target.style.backgroundColor = '#f1f5f9';
                            e.target.style.borderColor = '#3b82f6';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedTool !== tool.id) {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#d1d5db';
                        }
                    }}
                >
                    <span>{tool.icon}</span>
                    <span>{tool.name}</span>
                </button>
            ))}
        </div>
    );
};

const CustomDrawingChart = ({ data, symbol, height = 400 }) => {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const [selectedTool, setSelectedTool] = useState('select');
    const [drawings, setDrawings] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentDrawing, setCurrentDrawing] = useState(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0, left: 0, top: 0 });

    // 監聽圖表尺寸變化
    useEffect(() => {
        const updateDimensions = () => {
            if (overlayRef.current) {
                const rect = overlayRef.current.getBoundingClientRect();
                setChartDimensions({
                    width: rect.width,
                    height: rect.height,
                    left: rect.left,
                    top: rect.top
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [data]);

    const handleToolSelect = (toolId) => {
        if (toolId === 'clear') {
            setDrawings([]);
            return;
        }
        setSelectedTool(toolId);
    };

    const getMousePosition = (e) => {
        const rect = overlayRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e) => {
        if (selectedTool === 'select') return;
        
        const pos = getMousePosition(e);
        setIsDrawing(true);
        
        const newDrawing = {
            id: Date.now(),
            type: selectedTool,
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y,
            color: '#3b82f6',
            width: 2
        };
        
        setCurrentDrawing(newDrawing);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !currentDrawing) return;
        
        const pos = getMousePosition(e);
        setCurrentDrawing(prev => ({
            ...prev,
            endX: pos.x,
            endY: pos.y
        }));
    };

    const handleMouseUp = () => {
        if (isDrawing && currentDrawing) {
            setDrawings(prev => [...prev, currentDrawing]);
            setCurrentDrawing(null);
        }
        setIsDrawing(false);
    };

    const renderDrawing = (drawing) => {
        const { type, startX, startY, endX, endY, color, width } = drawing;
        
        switch (type) {
            case 'trendline':
                return (
                    <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={color}
                        strokeWidth={width}
                    />
                );
            
            case 'horizontal':
                return (
                    <line
                        x1={0}
                        y1={startY}
                        x2={chartDimensions.width}
                        y2={startY}
                        stroke={color}
                        strokeWidth={width}
                        strokeDasharray="5,5"
                    />
                );
            
            case 'vertical':
                return (
                    <line
                        x1={startX}
                        y1={0}
                        x2={startX}
                        y2={chartDimensions.height}
                        stroke={color}
                        strokeWidth={width}
                        strokeDasharray="5,5"
                    />
                );
            
            case 'rectangle':
                return (
                    <rect
                        x={Math.min(startX, endX)}
                        y={Math.min(startY, endY)}
                        width={Math.abs(endX - startX)}
                        height={Math.abs(endY - startY)}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={width}
                    />
                );
            
            default:
                return null;
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <DrawingTools 
                onSelectTool={handleToolSelect} 
                selectedTool={selectedTool}
            />
            
            <div style={{ position: 'relative' }}>
                {/* K 線圖 */}
                <CandlestickChart 
                    data={data} 
                    symbol={symbol} 
                    height={height}
                />
                
                {/* 繪圖覆蓋層 */}
                <div
                    ref={overlayRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        cursor: selectedTool === 'select' ? 'default' : 'crosshair',
                        pointerEvents: 'all'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <svg
                        width="100%"
                        height="100%"
                        style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0,
                            pointerEvents: 'none'
                        }}
                    >
                        {/* 渲染已完成的繪圖 */}
                        {drawings.map(drawing => (
                            <g key={drawing.id}>
                                {renderDrawing(drawing)}
                            </g>
                        ))}
                        
                        {/* 渲染正在繪製的圖形 */}
                        {currentDrawing && (
                            <g>
                                {renderDrawing(currentDrawing)}
                            </g>
                        )}
                    </svg>
                </div>
            </div>
            
            {/* 繪圖資訊 */}
            {drawings.length > 0 && (
                <div style={{ 
                    marginTop: '12px', 
                    padding: '8px 12px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '6px',
                    fontSize: '0.8em',
                    color: '#64748b'
                }}>
                    已繪製 {drawings.length} 個圖形 • 選擇「清除」可移除所有繪圖
                </div>
            )}
        </div>
    );
};

export default CustomDrawingChart;