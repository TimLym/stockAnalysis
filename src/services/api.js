// API 服務模組

// 使用多個 CORS 代理，提高成功率
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://corsproxy.io/?'
];

let currentProxyIndex = 0;

// 重試機制
const fetchWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        } catch (error) {
            console.warn(`第 ${i + 1} 次嘗試失敗:`, error.message);
            if (i === retries - 1) throw error;
            
            // 嘗試下一個代理
            currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

// TWSE API 服務
export const twseApi = {
    getQuotes: async (symbols) => {
        // 篩選出台股代號
        const twSymbols = symbols.filter(s => s.endsWith('.TW'));
        if (twSymbols.length === 0) {
            return { msgArray: [] };
        }
        
        // 組合 TWSE API 查詢字串
        const query = twSymbols.map(s => `tse_${s.replace('.TW', '')}.tw`).join('|');
        const timestamp = new Date().getTime();
        
        const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${query}&json=1&delay=0&_=${timestamp}`;
        
        // 嘗試使用當前代理
        const proxyUrl = `${CORS_PROXIES[currentProxyIndex]}${encodeURIComponent(targetUrl)}`;
        
        try {
            const response = await fetchWithRetry(proxyUrl);
            const data = await response.json();
            
            // 檢查回傳的資料格式
            if (!data.msgArray || data.msgArray.length === 0) {
                throw new Error('沒有收到股票資料');
            }
            
            return data;
        } catch (error) {
            console.error('TWSE API 錯誤:', error);
            throw new Error(`無法獲取股票資料: ${error.message}`);
        }
    }
};

// GNews API 服務
export const gnewsApi = {
    getNews: async (category) => {
        const API_KEY = '675e97b70e60602a50d9dfb83d3b5851';         
        try {
            const response = await fetch(
                `https://gnews.io/api/v4/top-headlines?category=${category}&lang=zh&country=tw&max=10&apikey=${API_KEY}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('GNews API 錯誤:', error);
            throw error;
        }
    }
};

// 格式化股票代號給 TradingView 使用
export const formatSymbolForTradingView = (symbol) => {
    if (!symbol) return null;
    
    // 台股處理
    if (symbol.includes('.TW')) {
      const code = symbol.replace('.TW', '');
      return `TWSE:${code}`;
    }
    
    // 美股處理
    if (symbol.match(/^[A-Z]+$/)) {
      return `NASDAQ:${symbol}`;
    }
    
    // 其他交易所
    return symbol;
  };