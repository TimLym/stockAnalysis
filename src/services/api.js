// API 服務模組
import { generateRealisticKlineData, generateMockNews, generateMockQuoteData } from './mockData.js';
import { fugleApi, fugleApiSecondary } from './fugleApi.js';

// 使用穩定的 CORS 代理服務
const CORS_PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/'
];

let currentProxyIndex = 0;

// 網路請求重試函數
const fetchWithProxy = async (url, options = {}, retries = 2) => {
    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
        const proxyUrl = `${CORS_PROXIES[currentProxyIndex]}${encodeURIComponent(url)}`;
        
        try {
            console.log(`嘗試 ${attempt + 1}/${retries}: 使用代理 ${currentProxyIndex + 1}`);
            
            const response = await fetch(proxyUrl, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let data;
            const contentType = response.headers.get('content-type');
            
            if (CORS_PROXIES[currentProxyIndex].includes('allorigins')) {
                const result = await response.json();
                data = typeof result.contents === 'string' ? JSON.parse(result.contents) : result.contents;
            } else {
                data = await response.json();
            }
            
            console.log('API 請求成功');
            return data;
            
        } catch (error) {
            lastError = error;
            console.warn(`代理 ${currentProxyIndex + 1} 失敗:`, error.message);
            
            // 切換到下一個代理
            currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
            
            if (attempt < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    throw new Error(`所有代理都失敗了: ${lastError?.message || '未知錯誤'}`);
};

// GNews API 服務
export const gnewsApi = {
    getNews: async (category) => {
        const API_KEY = '675e97b70e60602a50d9dfb83d3b5851';
        
        try {
            console.log(`正在獲取 ${category} 類別的新聞...`);
            
            const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=zh&country=tw&max=10&apikey=${API_KEY}`;
            const data = await fetchWithProxy(url);
            
            if (!data || !data.articles) {
                throw new Error('無效的新聞數據格式');
            }
            
            console.log('新聞數據獲取成功:', data.totalArticles, '篇文章');
            return data;
            
        } catch (error) {
            console.error('GNews API 錯誤:', error);
            console.warn('使用備用模擬新聞數據');
            
            // 使用備用模擬數據
            return generateMockNews(category);
        }
    }
};

// 股票數據 API 服務 - 優先使用富果 API
export const stockApi = {
    // 獲取股票歷史數據 - 支援多時間框架，分K線結合歷史+即時數據
    getHistoricalData: async (symbol, days = 30, timeframe = 'D') => {
        const stockCode = symbol.replace('.TW', '');
        console.log(`正在獲取 ${stockCode} 的 ${timeframe} 歷史數據，請求天數: ${days}`);
        
        // 判斷是否為分K線
        const isIntradayTimeframe = ['5m', '30m', '1m', '3m', '10m', '15m', '60m'].includes(timeframe);
        
        if (isIntradayTimeframe) {
            // 對於分K線，先獲取歷史數據，再嘗試獲取當日即時數據
            console.log(`分K線模式: 獲取歷史數據 + 當日即時數據`);
            
            let historicalData = [];
            let intradayData = [];
            
            // 步驟1: 獲取歷史數據
            try {
                const fugleHistorical = await fugleApi.getHistoricalData(symbol, days, timeframe);
                if (fugleHistorical && fugleHistorical.length > 0) {
                    historicalData = fugleHistorical;
                    console.log(`富果歷史API: 成功獲取 ${historicalData.length} 筆歷史 ${timeframe} 數據`);
                }
            } catch (error) {
                console.warn('富果歷史API失敗，嘗試第二個token:', error.message);
                try {
                    const fugleHistoricalSecondary = await fugleApiSecondary.getHistoricalData(symbol, days, timeframe);
                    if (fugleHistoricalSecondary && fugleHistoricalSecondary.length > 0) {
                        historicalData = fugleHistoricalSecondary;
                        console.log(`富果歷史API（第二個token）: 成功獲取 ${historicalData.length} 筆歷史 ${timeframe} 數據`);
                    }
                } catch (secondaryError) {
                    console.warn('所有歷史API都失敗:', secondaryError.message);
                }
            }
            
            // 步驟2: 獲取當日即時數據
            const fugleTimeframeMap = {
                '1m': '1', '3m': '3', '5m': '5', '10m': '10',
                '15m': '15', '30m': '30', '60m': '60'
            };
            const fugleTimeframe = fugleTimeframeMap[timeframe] || '5';
            
            try {
                const fugleIntraday = await fugleApi.getIntradayCandles(symbol, fugleTimeframe);
                if (fugleIntraday && fugleIntraday.length > 0) {
                    intradayData = fugleIntraday;
                    console.log(`富果盤中API: 成功獲取 ${intradayData.length} 筆當日 ${timeframe} 數據`);
                }
            } catch (error) {
                console.warn('富果盤中API失敗，嘗試第二個token:', error.message);
                try {
                    const fugleIntradaySecondary = await fugleApiSecondary.getIntradayCandles(symbol, fugleTimeframe);
                    if (fugleIntradaySecondary && fugleIntradaySecondary.length > 0) {
                        intradayData = fugleIntradaySecondary;
                        console.log(`富果盤中API（第二個token）: 成功獲取 ${intradayData.length} 筆當日 ${timeframe} 數據`);
                    }
                } catch (secondaryError) {
                    console.warn('所有盤中API都失敗:', secondaryError.message);
                }
            }
            
            // 步驟3: 合併歷史數據和當日數據
            let combinedData = [];
            
            if (historicalData.length > 0) {
                combinedData = [...historicalData];
            }
            
            if (intradayData.length > 0) {
                const today = new Date().toDateString();
                
                // 過濾掉歷史數據中今天的數據，避免重複
                combinedData = combinedData.filter(item => {
                    const itemDate = new Date(item.x || item.timestamp).toDateString();
                    return itemDate !== today;
                });
                
                // 添加當日即時數據
                combinedData = [...combinedData, ...intradayData];
            }
            
            if (combinedData.length > 0) {
                // 按時間排序
                combinedData.sort((a, b) => new Date(a.x || a.timestamp) - new Date(b.x || b.timestamp));
                console.log(`合併完成: ${combinedData.length} 筆 ${timeframe} 數據（歷史: ${historicalData.length}, 當日: ${intradayData.length}）`);
                return combinedData;
            }
        }
        
        // 方法 1: 富果 API（支援 5分K、30分K、日K、週K、月K）
        try {
            const fugleData = await fugleApi.getHistoricalData(symbol, days, timeframe);
            if (fugleData && fugleData.length > 0) {
                console.log(`富果 API: 成功獲取 ${fugleData.length} 筆 ${timeframe} K 線數據`);
                console.log(`富果數據時間範圍: ${fugleData[0].x.toLocaleDateString('zh-TW')} 到 ${fugleData[fugleData.length-1].x.toLocaleDateString('zh-TW')}`);
                return fugleData;
            }
        } catch (fugleError) {
            console.warn('富果 API 失敗，嘗試第二個 token:', fugleError.message);
        }
        
        // 方法 2: 富果 API 第二個 token - 備用方案（支援所有時間框架）
        try {
            const fugleDataSecondary = await fugleApiSecondary.getHistoricalData(symbol, days, timeframe);
            if (fugleDataSecondary && fugleDataSecondary.length > 0) {
                console.log(`富果 API（第二個 token）: 成功獲取 ${fugleDataSecondary.length} 筆 ${timeframe} K 線數據`);
                console.log(`富果數據時間範圍: ${fugleDataSecondary[0].x.toLocaleDateString('zh-TW')} 到 ${fugleDataSecondary[fugleDataSecondary.length-1].x.toLocaleDateString('zh-TW')}`);
                return fugleDataSecondary;
            }
        } catch (fugleErrorSecondary) {
            console.warn('富果 API（第二個 token）失敗，嘗試 Yahoo Finance:', fugleErrorSecondary.message);
        }
        
        // 方法 3: Yahoo Finance - 備用方案 (僅支援日K)
        if (timeframe === 'D' || timeframe === '1D') {
            try {
                // 使用台灣時區的當前時間
                const now = new Date();
                const taiwanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Taipei"}));
                const endDate = Math.floor(taiwanTime.getTime() / 1000);
                const startDate = endDate - (days * 24 * 60 * 60);
                
                console.log(`Yahoo Finance 請求時間範圍: ${new Date(startDate * 1000).toLocaleDateString('zh-TW')} 到 ${new Date(endDate * 1000).toLocaleDateString('zh-TW')}`);
                
                const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}.TW?period1=${startDate}&period2=${endDate}&interval=1d&includePrePost=true&events=div%7Csplit`;
                const data = await fetchWithProxy(yahooUrl);
                
                if (data?.chart?.result?.[0]) {
                    const result = data.chart.result[0];
                    const timestamps = result.timestamp;
                    const quote = result.indicators.quote[0];
                    if (timestamps && quote) {
                        const klineData = timestamps.map((timestamp, index) => ({
                            x: new Date(timestamp * 1000),
                            o: parseFloat((quote.open[index] || 0).toFixed(2)),
                            h: parseFloat((quote.high[index] || 0).toFixed(2)),
                            l: parseFloat((quote.low[index] || 0).toFixed(2)),
                            c: parseFloat((quote.close[index] || 0).toFixed(2)),
                            v: parseInt(quote.volume[index] || 0) // 保持原始成交量數據
                        })).filter(item => item.o > 0 && item.h > 0 && item.l > 0 && item.c > 0);
                        
                        if (klineData.length > 0) {
                            console.log(`Yahoo Finance: 成功獲取 ${klineData.length} 筆日K數據`);
                            console.log(`數據時間範圍: ${klineData[0].x.toLocaleDateString('zh-TW')} 到 ${klineData[klineData.length-1].x.toLocaleDateString('zh-TW')}`);
                            return klineData;
                        }
                    }
                }
            } catch (yahooError) {
                console.warn('Yahoo Finance 失敗:', yahooError.message);
            }
        } else {
            // 對於非日K線（5分K、30分K、週K、月K），當富果API都失敗時，直接使用模擬數據
            console.warn(`富果API對 ${timeframe} 時間框架失敗，Yahoo Finance不支援此時間框架，使用模擬數據`);
        }
        
        // 方法 4: 使用模擬數據作為最後備用方案
        console.warn(`所有 API 都失敗，使用模擬數據作為 ${stockCode} 的備用方案`);
        return generateRealisticKlineData(symbol, days, timeframe);
    },
    
    // 獲取即時報價 - 優先使用富果 API
    getQuotes: async (symbols) => {
        const twSymbols = symbols.filter(s => s.endsWith('.TW'));
        if (twSymbols.length === 0) {
            return { msgArray: [] };
        }
        
        console.log('正在獲取即時報價...');
        
        // 方法 1: 優先嘗試富果 API
        try {
            const fugleQuotes = await fugleApi.getQuotes(twSymbols);
            if (fugleQuotes.msgArray && fugleQuotes.msgArray.length > 0) {
                console.log(`富果 API: 成功獲取 ${fugleQuotes.msgArray.length} 檔股票報價`);
                return fugleQuotes;
            }
        } catch (fugleError) {
            console.warn('富果 API 報價獲取失敗，嘗試第二個 token:', fugleError.message);
        }
        
        // 方法 2: 富果 API 第二個 token - 備用方案
        try {
            const fugleQuotesSecondary = await fugleApiSecondary.getQuotes(twSymbols);
            if (fugleQuotesSecondary.msgArray && fugleQuotesSecondary.msgArray.length > 0) {
                console.log(`富果 API（第二個 token）: 成功獲取 ${fugleQuotesSecondary.msgArray.length} 檔股票報價`);
                return fugleQuotesSecondary;
            }
        } catch (fugleErrorSecondary) {
            console.warn('富果 API（第二個 token）報價獲取失敗，嘗試 Yahoo Finance:', fugleErrorSecondary.message);
        }
        
        // 方法 3: 備用方案 - Yahoo Finance
        try {
            const quotes = [];
            for (const symbol of twSymbols) {
                try {
                    const stockCode = symbol.replace('.TW', '');
                    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
                    const data = await fetchWithProxy(yahooUrl);
                    
                    if (data?.quoteResponse?.result?.[0]) {
                        const quote = data.quoteResponse.result[0];
                        // 使用 API 返回的股票名稱
                        const stockName = quote.longName || quote.shortName || quote.symbol;
                        
                        quotes.push({
                            c: stockCode,
                            n: stockName,
                            z: (quote.regularMarketPrice || 0).toFixed(2),
                            tv: quote.regularMarketVolume || 0,
                            o: (quote.regularMarketOpen || 0).toFixed(2),
                            h: (quote.regularMarketDayHigh || 0).toFixed(2),
                            l: (quote.regularMarketDayLow || 0).toFixed(2),
                            y: (quote.regularMarketPreviousClose || 0).toFixed(2)
                        });
                    }
                } catch (quoteError) {
                    console.warn(`獲取 ${symbol} 報價失敗:`, quoteError.message);
                }
            }
            
            if (quotes.length > 0) {
                console.log(`Yahoo Finance: 成功獲取 ${quotes.length} 檔股票報價`);
                return {
                    msgArray: quotes,
                    queryTime: {
                        sysTime: new Date().toLocaleTimeString('zh-TW'),
                        stockInfoItem: Date.now()
                    }
                };
            }
        } catch (error) {
            console.error('Yahoo Finance 報價獲取失敗:', error);
        }
        
        // 方法 4: 使用模擬數據作為備用方案
        console.warn('使用模擬數據作為即時報價的備用方案');
        return generateMockQuoteData(twSymbols);
    },
    
    // 獲取日內交易明細 - 優先使用富果 API
    getIntradayTrades: async (symbol, limit = 500) => {
        const stockCode = symbol.replace('.TW', '');
        console.log(`正在獲取 ${stockCode} 的日內交易明細...`);
        
        // 方法 1: 富果 API
        try {
            const trades = await fugleApi.getIntradayTrades(symbol, limit);
            if (trades && trades.length > 0) {
                console.log(`富果 API: 成功獲取 ${trades.length} 筆交易明細`);
                return trades;
            }
        } catch (fugleError) {
            console.warn('富果 API 交易明細獲取失敗，嘗試第二個 token:', fugleError.message);
        }
        
        // 方法 2: 富果 API 第二個 token - 備用方案
        try {
            const tradesSecondary = await fugleApiSecondary.getIntradayTrades(symbol, limit);
            if (tradesSecondary && tradesSecondary.length > 0) {
                console.log(`富果 API（第二個 token）: 成功獲取 ${tradesSecondary.length} 筆交易明細`);
                return tradesSecondary;
            }
        } catch (fugleErrorSecondary) {
            console.warn('富果 API（第二個 token）交易明細獲取失敗:', fugleErrorSecondary.message);
        }
        
        console.warn('所有日內交易 API 都失敗，返回空數據');
        return [];
    }
};

// 為了向後相容，保留 twseApi 別名
export const twseApi = {
    getHistoricalData: stockApi.getHistoricalData,
    getQuotes: stockApi.getQuotes
};