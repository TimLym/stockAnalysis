import React, { useState } from 'react';
import '../scss/Sidebar.scss';
import { HomeIcon, NewsIcon, ChartIcon } from './Icons';

// 折疊/展開圖示組件
const CollapseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const MenuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const Sidebar = ({ currentPage, onPageChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const navItems = [
        { id: 'home', label: '主頁', icon: HomeIcon },
        { id: 'news', label: '新聞', icon: NewsIcon },
        { id: 'chart', label: '圖表', icon: ChartIcon }
    ];

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <nav className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="sidebar-header">
                <h1 className="sidebar-title">
                    {!isCollapsed && 'StockAnalysis'}
                    {isCollapsed && 'SA'}
                </h1>
                <button 
                    className="sidebar-toggle" 
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? '展開側欄' : '收合側欄'}
                >
                    {isCollapsed ? <MenuIcon /> : <CollapseIcon />}
                </button>
            </div>
            <div className="sidebar-nav">
                <ul>
                    {navItems.map(({ id, label, icon: Icon }) => (
                        <li key={id}>
                            <button 
                                className={currentPage === id ? 'active' : ''} 
                                onClick={() => onPageChange(id)}
                                title={isCollapsed ? label : ''}
                            >
                                <Icon />
                                <span className="nav-text">{label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default Sidebar;