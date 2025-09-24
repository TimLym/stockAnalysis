// 股票代號對應表（台股）
export const STOCK_INFO = {
    // 台積電產業鏈
    '2330': '台積電',
    '3711': '日月光投控', 
    '2454': '聯發科',
    '3008': '大立光',
    '2317': '鴻海',
    '2382': '廣達',
    '2395': '研華',
    '3034': '聯詠',
    '2308': '台達電',
    '2357': '華碩',

    // 傳統產業
    '2002': '中鋼',
    '1101': '台泥', 
    '1216': '統一',
    '1301': '台塑',
    '1303': '南亞',
    '2105': '正新',
    '2207': '和泰車',

    // 金融股
    '2881': '富邦金',
    '2886': '兆豐金',
    '2880': '華南金',
    '2882': '國泰金',
    '2884': '玉山金',
    '2885': '元大金',
    '2891': '中信金',
    '2892': '第一金',

    // 航運三雄
    '2603': '長榮',
    '2609': '陽明',
    '2615': '萬海',

    // 電信股
    '2412': '中華電',
    '4904': '遠傳',
    '3045': '台灣大',

    // 其他
    '2303': '聯電',
    '0050': '元大台灣50',
    '0056': '元大高股息',
};

// 根據股票代號取得對應的基準價格（用於模擬數據）
const getBasePrice = (stockCode) => {
    const priceMap = {
        // 高價股
        '2330': 580,    // 台積電
        '2454': 1200,   // 聯發科
        '3008': 2800,   // 大立光
        '2395': 450,    // 研華
        
        // 中價股
        '2317': 110,    // 鴻海
        '2382': 95,     // 廣達
        '2412': 120,    // 中華電
        '2303': 48,     // 聯電
        '3711': 130,    // 日月光投控
        '2603': 180,    // 長榮
        '2609': 65,     // 陽明
        '2615': 85,     // 萬海
        '2357': 450,    // 華碩
        '2308': 320,    // 台達電
        
        // 金融股 (普遍較低價)
        '2881': 70,     // 富邦金
        '2886': 40,     // 兆豐金
        '2880': 28,     // 華南金
        '2882': 65,     // 國泰金
        '2884': 32,     // 玉山金
        '2885': 28,     // 元大金
        '2891': 28,     // 中信金
        '2892': 27,     // 第一金
        
        // 傳產股
        '2002': 28,     // 中鋼
        '1101': 45,     // 台泥
        '1216': 75,     // 統一
        '1301': 98,     // 台塑
        '1303': 78,     // 南亞
        '2105': 42,     // 正新
        '2207': 580,    // 和泰車
    };
    
    return priceMap[stockCode] || (30 + Math.random() * 200);
};

// 生成逼真的股票 K 線數據（支援多時間框架）
export const generateRealisticKlineData = (symbol, days = 30, timeframe = 'D') => {
    const stockCode = symbol.replace('.TW', '');
    const stockName = STOCK_INFO[stockCode] || stockCode;
    
    console.log(`生成 ${stockName} (${stockCode}) 的 ${timeframe} 模擬數據，${days} 天`);
    
    const basePrice = getBasePrice(stockCode);
    const data = [];
    let currentPrice = basePrice;
    
    // 根據時間框架計算數據點數
    let periods;
    let intervalMinutes;
    
    switch (timeframe) {
        case '5m':
            periods = days * 24 * 60 / 5; // 每天288個5分鐘K棒
            intervalMinutes = 5;
            break;
        case '30m':
            periods = days * 24 * 60 / 30; // 每天48個30分鐘K棒
            intervalMinutes = 30;
            break;
        case 'D':
        default:
            periods = days; // 每天1個日K棒
            intervalMinutes = 24 * 60;
            break;
    }
    
    // 限制數據點數，避免過多
    periods = Math.min(periods, 1000);
    
    // 使用台灣時區的當前時間
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Taipei"}));
    const startDate = new Date(taiwanTime);
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`Mock數據生成時間範圍: ${startDate.toLocaleDateString('zh-TW')} 到 ${taiwanTime.toLocaleDateString('zh-TW')}`);
    
    for (let i = 0; i < periods; i++) {
        // 計算時間點
        const timestamp = new Date(startDate.getTime() + (i * intervalMinutes * 60 * 1000));
        
        // 確保不超過當前時間
        if (timestamp > taiwanTime) {
            break;
        }
        
        // 跳過週末（僅針對日K和30分K）
        if (timeframe === 'D' || timeframe === '30m') {
            const dayOfWeek = timestamp.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue; // 跳過週末
            }
        }
        
        // 跳過非交易時間（僅針對分鐘K）
        if (timeframe === '5m' || timeframe === '30m') {
            const hour = timestamp.getHours();
            if (hour < 9 || hour > 13) {
                continue; // 跳過非交易時間
            }
        }
        
        // 價格波動邏輯
        const volatility = timeframe === '5m' ? 0.003 : timeframe === '30m' ? 0.008 : 0.025;
        const trendFactor = (Math.random() - 0.5) * volatility;
        const randomFactor = (Math.random() - 0.5) * volatility * 0.5;
        
        currentPrice *= (1 + trendFactor + randomFactor);
        currentPrice = Math.max(currentPrice, 1); // 確保價格不為負
        
        const open = currentPrice;
        const close = open * (1 + (Math.random() - 0.5) * volatility * 2);
        const high = Math.max(open, close) * (1 + Math.random() * volatility);
        const low = Math.min(open, close) * (1 - Math.random() * volatility);
        
        const volume = Math.floor(Math.random() * 1000000 + 100000) * 
                      (timeframe === '5m' ? 0.1 : timeframe === '30m' ? 0.3 : 1); // 調整為真實的成交量範圍
        
        data.push({
            x: timestamp,
            o: parseFloat(open.toFixed(2)),
            h: parseFloat(high.toFixed(2)),
            l: parseFloat(low.toFixed(2)),
            c: parseFloat(close.toFixed(2)),
            v: Math.floor(volume) // 原始成交量數據
        });
        
        currentPrice = close;
    }
    
    console.log(`生成了 ${data.length} 筆 ${timeframe} 模擬數據`);
    if (data.length > 0) {
        console.log(`Mock數據時間範圍: ${data[0].x.toLocaleDateString('zh-TW')} 到 ${data[data.length-1].x.toLocaleDateString('zh-TW')}`);
    }
    return data;
};

// 生成模擬新聞數據
export const generateMockNews = (category) => {
    const newsTemplates = {
        business: [
            {
                title: "台股收盤上漲{points}點，成交量{volume}億元",
                description: "今日台股在{sectors}板塊帶動下收高，投資人信心回升。",
                url: "#",
                image: "https://via.placeholder.com/300x200/4CAF50/white?text=Stock+Market"
            },
            {
                title: "央行利率決策會議結果出爐",
                description: "央行宣布維持利率不變，符合市場預期。",
                url: "#",
                image: "https://via.placeholder.com/300x200/2196F3/white?text=Central+Bank"
            },
            {
                title: "外資買超{amount}億元，聚焦科技股",
                description: "外資持續看好台股科技類股表現。",
                url: "#",
                image: "https://via.placeholder.com/300x200/FF9800/white?text=Foreign+Investment"
            }
        ],
        technology: [
            {
                title: "台積電先進製程技術再突破",
                description: "3奈米製程良率持續提升，預期明年產能滿載。",
                url: "#",
                image: "https://via.placeholder.com/300x200/9C27B0/white?text=TSMC"
            },
            {
                title: "聯發科發布新款5G晶片",
                description: "新晶片在效能與功耗方面都有顯著改善。",
                url: "#",
                image: "https://via.placeholder.com/300x200/607D8B/white?text=MediaTek"
            }
        ]
    };
    
    const templates = newsTemplates[category] || newsTemplates.business;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // 隨機替換模板中的變數
    const filledTemplate = {
        ...randomTemplate,
        title: randomTemplate.title
            .replace('{points}', Math.floor(Math.random() * 200 + 50))
            .replace('{volume}', Math.floor(Math.random() * 3000 + 1000))
            .replace('{amount}', Math.floor(Math.random() * 100 + 20))
            .replace('{sectors}', ['電子', '金融', '傳產', '生技'][Math.floor(Math.random() * 4)]),
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        source: {
            id: "mock-source",
            name: "財經新聞"
        }
    };
    
    return Array.from({ length: 10 }, (_, i) => ({
        ...filledTemplate,
        title: filledTemplate.title + (i > 0 ? ` (${i + 1})` : ''),
        publishedAt: new Date(Date.now() - (i * 2 + Math.random()) * 60 * 60 * 1000).toISOString()
    }));
};

// 生成模擬即時報價數據
export const generateMockQuoteData = (symbols) => {
    return symbols.map(symbol => {
        const stockCode = symbol.replace('.TW', '');
        const basePrice = getBasePrice(stockCode);
        const change = (Math.random() - 0.5) * basePrice * 0.05;
        const price = basePrice + change;
        
        return {
            c: stockCode,
            n: STOCK_INFO[stockCode] || stockCode,
            z: price.toFixed(2),
            y: basePrice.toFixed(2),
            tv: Math.floor(Math.random() * 50000000 + 5000000),
            v: Math.floor(Math.random() * 50000 + 5000),
            o: (basePrice + (Math.random() - 0.5) * basePrice * 0.02).toFixed(2),
            h: Math.max(price, basePrice * 1.03).toFixed(2),
            l: Math.min(price, basePrice * 0.97).toFixed(2),
            u: change.toFixed(2),
            w: ((change / basePrice) * 100).toFixed(2)
        };
    });
};