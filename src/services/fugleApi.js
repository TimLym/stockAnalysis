// 富果 API 服務
const FUGLE_API_TOKEN = 'OGY1ZDMyMjQtYzRjOC00M2I3LTgwMTAtMTYzNmM3YzdiMzAxIDIzNmM3NWNhLTQ4NjQtNGMwZS1hOTNmLTM0OWUwNDU2YjYxOQ==';
const FUGLE_API_TOKEN_SEC = 'YWQ4YjY3NTEtZjg5Ny00ODUwLTg5ZGEtY2JiZmRiY2UwOWRmIDIwYjQ4YjQzLThhYTQtNGI1YS1hNzVhLWYxMmJlY2U3MDU2ZQ==';
const FUGLE_BASE_URL = 'https://api.fugle.tw/marketdata/v1.0/stock';

// 富果 API 客戶端
class FugleApiClient {
    constructor() {
        this.apiToken = FUGLE_API_TOKEN;
        this.baseUrl = FUGLE_BASE_URL;
    }

    async makeRequest(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        
        // 添加其他參數
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            console.log(`富果 API 請求: ${url.toString()}`);
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-KEY': this.apiToken,
                    'User-Agent': 'StockAnalysisApp/1.0'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`富果 API 錯誤 ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('富果 API 回應成功:', data);
            return data;

        } catch (error) {
            console.error('富果 API 請求失敗:', error);
            throw error;
        }
    }

    // 獲取即時報價
    async getQuote(symbol) {
        const stockCode = symbol.replace('.TW', '');
        return await this.makeRequest(`/intraday/quote/${stockCode}`, {});
    }

    // 獲取當日分K線數據（盤中行情）
    async getIntradayCandles(symbol, timeframe = '1') {
        const stockCode = symbol.replace('.TW', '');
        
        const params = {
            timeframe: timeframe,  // 富果API: 1, 3, 5, 10, 15, 30, 60
            sort: 'asc'           // 升序排列
        };
        
        return await this.makeRequest(`/intraday/candles/${stockCode}`, params);
    }

    // 獲取歷史K線數據
    async getHistoricalCandles(symbol, days = 30, timeframe = '1D') {
        const stockCode = symbol.replace('.TW', '');
        
        // 富果API時間框架映射
        const timeframeMap = {
            '1m': '1',      // 1分K
            '3m': '3',      // 3分K
            '5m': '5',      // 5分K
            '10m': '10',    // 10分K
            '15m': '15',    // 15分K
            '30m': '30',    // 30分K
            '60m': '60',    // 60分K (1小時)
            '1D': 'D',      // 日K
            '1W': 'W',      // 週K
            '1M': 'M'       // 月K
        };
        
        const fugleTimeframe = timeframeMap[timeframe] || 'D';
        
        const params = {
            timeframe: fugleTimeframe,
            fields: 'open,high,low,close,volume',
            sort: 'asc'  // 設定為升序排列
        };
        
        // 只有日K、週K、月K可以指定日期範圍，分K固定回傳近30日
        if (fugleTimeframe === 'D' || fugleTimeframe === 'W' || fugleTimeframe === 'M') {
            const endDate = new Date();
            const startDate = new Date();
            
            // 根據時間框架調整日期範圍，確保不超過富果API的一年限制
            if (fugleTimeframe === 'W') {
                // 週K：限制在350天內（約50週），確保不超過一年
                const maxDays = Math.min(days * 7, 350);
                startDate.setDate(endDate.getDate() - maxDays);
            } else if (fugleTimeframe === 'M') {
                // 月K：限制在11個月內，確保不超過一年
                const maxMonths = Math.min(Math.max(days / 30, 12), 11);
                startDate.setMonth(endDate.getMonth() - maxMonths);
            } else {
                // 日K：直接使用天數，但限制在365天內
                const maxDays = Math.min(days, 365);
                startDate.setDate(endDate.getDate() - maxDays);
            }
            
            console.log(`富果API請求時間範圍 (${fugleTimeframe}): ${startDate.toLocaleDateString('zh-TW')} 到 ${endDate.toLocaleDateString('zh-TW')}`);
            
            params.from = startDate.toISOString().split('T')[0];
            params.to = endDate.toISOString().split('T')[0];
        }
        
        return await this.makeRequest(`/historical/candles/${stockCode}`, params);
    }
}

// 富果 API 服務實例
const fugleClient = new FugleApiClient();

// 富果 API 第二個客戶端（使用第二個 token）
class FugleApiClientSecondary extends FugleApiClient {
    constructor() {
        super();
        this.apiToken = FUGLE_API_TOKEN_SEC;
    }
}

const fugleClientSecondary = new FugleApiClientSecondary();

// 導出富果 API 服務
export const fugleApi = {
    // 獲取即時報價
    getQuotes: async (symbols) => {
        try {
            const twSymbols = symbols.filter(s => s.endsWith('.TW'));
            if (twSymbols.length === 0) {
                return { msgArray: [] };
            }

            console.log('使用富果 API 獲取即時報價...');
            const quotes = [];

            // 批量獲取報價
            for (const symbol of twSymbols) {
                try {
                    const stockCode = symbol.replace('.TW', '');
                    const quoteData = await fugleClient.getQuote(symbol);
                    
                    // 富果 API v1.0 直接返回數據，無需 .data 嵌套
                    if (quoteData && (quoteData.symbol || quoteData.closePrice !== undefined)) {
                        const quote = quoteData;
                        
                        quotes.push({
                            c: quote.symbol || stockCode,
                            n: quote.name || stockCode,
                            z: (quote.closePrice || quote.lastPrice || 0).toFixed(2),
                            tv: quote.total?.tradeVolume || 0,
                            v: Math.floor((quote.total?.tradeVolume || 0) / 1000),
                            o: (quote.openPrice || 0).toFixed(2),
                            h: (quote.highPrice || 0).toFixed(2),
                            l: (quote.lowPrice || 0).toFixed(2),
                            y: (quote.previousClose || 0).toFixed(2),
                            u: quote.change || 0,
                            w: quote.changePercent || 0
                        });
                    }
                } catch (quoteError) {
                    console.warn(`獲取 ${symbol} 報價失敗:`, quoteError.message);
                    continue;
                }
                
                // 避免請求過於頻繁
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`富果 API: 成功獲取 ${quotes.length} 檔股票報價`);

            return {
                msgArray: quotes,
                queryTime: {
                    sysTime: new Date().toLocaleTimeString('zh-TW'),
                    stockInfoItem: Date.now()
                }
            };

        } catch (error) {
            console.error('富果 API 報價獲取失敗:', error);
            throw error;
        }
    },

    // 獲取歷史 K 線數據
    getHistoricalData: async (symbol, days = 30, timeframe = '1D') => {
        try {
            const stockCode = symbol.replace('.TW', '');
            console.log(`使用富果 API 獲取 ${stockCode} 的 ${timeframe} K 線數據...`);

            const candleData = await fugleClient.getHistoricalCandles(symbol, days, timeframe);

            if (!candleData || !candleData.data || !Array.isArray(candleData.data)) {
                throw new Error('富果 API 返回的數據格式不正確');
            }

            // 轉換為標準格式
            const klineData = candleData.data.map(candle => ({
                x: new Date(candle.date),
                o: parseFloat(candle.open || 0),
                h: parseFloat(candle.high || 0), 
                l: parseFloat(candle.low || 0),
                c: parseFloat(candle.close || 0),
                v: parseInt(candle.volume || 0), // 保持原始成交量數據
                timestamp: candle.date
            }));
            
            // 由於我們在API請求中設定了 sort: 'asc'，數據應該已經是升序
            // 但為了確保一致性，我們檢查並調整排序
            klineData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            console.log(`富果 API: 成功獲取 ${klineData.length} 筆 ${timeframe} K 線數據`);
            return klineData;

        } catch (error) {
            console.error(`富果 API ${timeframe} K 線數據獲取失敗:`, error);
            throw error;
        }
    },

    // 獲取當日分K線數據（使用盤中行情）
    getIntradayCandles: async (symbol, timeframe = '1') => {
        try {
            const stockCode = symbol.replace('.TW', '');
            console.log(`使用富果 API 獲取 ${stockCode} 的當日 ${timeframe} 分K數據...`);

            const candleData = await fugleClient.getIntradayCandles(symbol, timeframe);

            if (!candleData || !candleData.data || !Array.isArray(candleData.data)) {
                throw new Error('富果 API 返回的當日分K數據格式不正確');
            }

            // 轉換為標準格式
            const klineData = candleData.data.map(candle => ({
                x: new Date(candle.date),
                o: parseFloat(candle.open || 0),
                h: parseFloat(candle.high || 0), 
                l: parseFloat(candle.low || 0),
                c: parseFloat(candle.close || 0),
                v: parseInt(candle.volume || 0),
                timestamp: candle.date
            }));
            
            // 升序排列
            klineData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            console.log(`富果 API: 成功獲取 ${klineData.length} 筆當日 ${timeframe} 分K數據`);
            return klineData;

        } catch (error) {
            console.error(`富果 API 當日 ${timeframe} 分K數據獲取失敗:`, error);
            throw error;
        }
    },

    // 獲取公司資訊
    getCompanyInfo: async (symbol) => {
        try {
            const companyData = await fugleClient.getQuote(symbol);
            return companyData;
        } catch (error) {
            console.error('富果 API 公司資訊獲取失敗:', error);
            throw error;
        }
    },
    
    // 獲取日內交易明細
    getIntradayTrades: async (symbol, limit = 1000, offset = 0) => {
        const stockCode = symbol.replace('.TW', '');
        
        try {
            console.log(`使用富果 API 獲取 ${stockCode} 的日內交易明細...`);
            
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                sort: 'desc' // 降冪排序，最新的在前面
            });
            
            const response = await fetch(`${FUGLE_BASE_URL}/intraday/trades/${stockCode}?${params}`, {
                headers: {
                    'X-API-KEY': FUGLE_API_TOKEN
                }
            });
            
            if (!response.ok) {
                throw new Error(`富果 API 錯誤: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.data && Array.isArray(data.data)) {
                // 轉換格式為標準格式
                const trades = data.data.map(trade => ({
                    price: trade.price,
                    volume: trade.size || trade.volume,
                    time: new Date(trade.time / 1000), // 轉換微秒時間戳為毫秒
                    timestamp: trade.time / 1000,
                    bid: trade.bid,
                    ask: trade.ask,
                    serial: trade.serial
                }));
                
                console.log(`富果 API: 成功獲取 ${trades.length} 筆交易明細`);
                return trades;
            }
            
            return [];
        } catch (error) {
            console.error('富果 API 獲取交易明細失敗:', error);
            throw error;
        }
    }
};

// 富果 API 第二個服務實例（使用第二個 token）
export const fugleApiSecondary = {
    // 獲取即時報價
    getQuotes: async (symbols) => {
        try {
            const twSymbols = symbols.filter(s => s.endsWith('.TW'));
            if (twSymbols.length === 0) {
                return { msgArray: [] };
            }

            console.log('使用富果 API（第二個 token）獲取即時報價...');
            const quotes = [];

            // 批量獲取報價
            for (const symbol of twSymbols) {
                try {
                    const stockCode = symbol.replace('.TW', '');
                    const quoteData = await fugleClientSecondary.getQuote(symbol);
                    
                    // 富果 API v1.0 直接返回數據，無需 .data 嵌套
                    if (quoteData && (quoteData.symbol || quoteData.closePrice !== undefined)) {
                        const quote = quoteData;
                        
                        quotes.push({
                            c: quote.symbol || stockCode,
                            n: quote.name || stockCode,
                            z: (quote.closePrice || quote.lastPrice || 0).toFixed(2),
                            tv: quote.total?.tradeVolume || 0,
                            v: Math.floor((quote.total?.tradeVolume || 0) / 1000),
                            o: (quote.openPrice || 0).toFixed(2),
                            h: (quote.highPrice || 0).toFixed(2),
                            l: (quote.lowPrice || 0).toFixed(2),
                            y: (quote.previousClose || 0).toFixed(2),
                            u: quote.change || 0,
                            w: quote.changePercent || 0
                        });
                    }
                } catch (quoteError) {
                    console.warn(`獲取 ${symbol} 報價失敗:`, quoteError.message);
                    continue;
                }
                
                // 避免請求過於頻繁
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`富果 API（第二個 token）: 成功獲取 ${quotes.length} 檔股票報價`);

            return {
                msgArray: quotes,
                queryTime: {
                    sysTime: new Date().toLocaleTimeString('zh-TW'),
                    stockInfoItem: Date.now()
                }
            };

        } catch (error) {
            console.error('富果 API（第二個 token）報價獲取失敗:', error);
            throw error;
        }
    },

    // 獲取歷史 K 線數據
    getHistoricalData: async (symbol, days = 30, timeframe = '1D') => {
        try {
            const stockCode = symbol.replace('.TW', '');
            console.log(`使用富果 API（第二個 token）獲取 ${stockCode} 的 ${timeframe} K 線數據...`);

            const candleData = await fugleClientSecondary.getHistoricalCandles(symbol, days, timeframe);

            if (!candleData || !candleData.data || !Array.isArray(candleData.data)) {
                throw new Error('富果 API 返回的數據格式不正確');
            }

            // 轉換為標準格式
            const klineData = candleData.data.map(candle => ({
                x: new Date(candle.date),
                o: parseFloat(candle.open || 0),
                h: parseFloat(candle.high || 0), 
                l: parseFloat(candle.low || 0),
                c: parseFloat(candle.close || 0),
                v: parseInt(candle.volume || 0), // 保持原始成交量數據
                timestamp: candle.date
            }));
            
            // 由於我們在API請求中設定了 sort: 'asc'，數據應該已經是升序
            // 但為了確保一致性，我們檢查並調整排序
            klineData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            console.log(`富果 API（第二個 token）: 成功獲取 ${klineData.length} 筆 ${timeframe} K 線數據`);
            return klineData;

        } catch (error) {
            console.error(`富果 API（第二個 token）${timeframe} K 線數據獲取失敗:`, error);
            throw error;
        }
    },

    // 獲取公司資訊
    getCompanyInfo: async (symbol) => {
        try {
            const companyData = await fugleClientSecondary.getQuote(symbol);
            return companyData;
        } catch (error) {
            console.error('富果 API（第二個 token）公司資訊獲取失敗:', error);
            throw error;
        }
    },
    
    // 獲取日內交易明細
    getIntradayTrades: async (symbol, limit = 1000, offset = 0) => {
        const stockCode = symbol.replace('.TW', '');
        
        try {
            console.log(`使用富果 API（第二個 token）獲取 ${stockCode} 的日內交易明細...`);
            
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                sort: 'desc'
            });
            
            const response = await fetch(`${FUGLE_BASE_URL}/intraday/trades/${stockCode}?${params}`, {
                headers: {
                    'X-API-KEY': FUGLE_API_TOKEN_SEC
                }
            });
            
            if (!response.ok) {
                throw new Error(`富果 API 錯誤: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.data && Array.isArray(data.data)) {
                const trades = data.data.map(trade => ({
                    price: trade.price,
                    volume: trade.size || trade.volume,
                    time: new Date(trade.time / 1000),
                    timestamp: trade.time / 1000,
                    bid: trade.bid,
                    ask: trade.ask,
                    serial: trade.serial
                }));
                
                console.log(`富果 API（第二個 token）: 成功獲取 ${trades.length} 筆交易明細`);
                return trades;
            }
            
            return [];
        } catch (error) {
            console.error('富果 API（第二個 token）獲取交易明細失敗:', error);
            throw error;
        }
    }
};

export default fugleApi;
