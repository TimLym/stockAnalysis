import React from 'react';
import '../scss/Sidebar.scss';
import { HomeIcon, NewsIcon, ChartIcon } from './Icons';

const Sidebar = ({ currentPage, onPageChange }) => {
    const navItems = [
        { id: 'home', label: '主頁', icon: HomeIcon },
        { id: 'news', label: '新聞', icon: NewsIcon },
        { id: 'chart', label: '圖表', icon: ChartIcon }
    ];

    return (
        <nav className="sidebar">
            <h1>StockAnalysis</h1>
            <div className="sidebar-nav">
                <ul>
                    {navItems.map(({ id, label, icon: Icon }) => (
                        <li key={id}>
                            <button 
                                className={currentPage === id ? 'active' : ''} 
                                onClick={() => onPageChange(id)}
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