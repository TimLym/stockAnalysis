import { gnewsApi, stockApi } from './api.js';

// 測試新聞 API
async function testNewsApi() {
    console.log('=== 測試新聞 API ===');
    try {
        const businessNews = await gnewsApi.getNews('business');
        console.log('✅ 財經新聞獲取成功:', businessNews.totalArticles, '篇');
        
        const techNews = await gnewsApi.getNews('technology');
        console.log('✅ 科技新聞獲取成功:', techNews.totalArticles, '篇');
        
        return true;
    } catch (error) {
        console.error('❌ 新聞 API 測試失敗:', error.message);
        return false;
    }
}

// 測試股票 API
async function testStockApi() {
    console.log('\n=== 測試股票 API ===');
    try {
        // 測試歷史數據
        const klineData = await stockApi.getHistoricalData('2330.TW', 7);
        console.log('✅ K 線數據獲取成功:', klineData.length, '筆');
        
        // 測試即時報價
        const quotes = await stockApi.getQuotes(['2330.TW', '2454.TW']);
        console.log('✅ 即時報價獲取成功:', quotes.msgArray.length, '檔');
        
        return true;
    } catch (error) {
        console.error('❌ 股票 API 測試失敗:', error.message);
        return false;
    }
}

// 執行所有測試
export async function runApiTests() {
    console.log('🚀 開始 API 功能測試...\n');
    
    const results = {
        news: await testNewsApi(),
        stock: await testStockApi()
    };
    
    console.log('\n=== 測試結果總結 ===');
    console.log('新聞 API:', results.news ? '✅ 通過' : '❌ 失敗');
    console.log('股票 API:', results.stock ? '✅ 通過' : '❌ 失敗');
    
    if (results.news && results.stock) {
        console.log('🎉 所有 API 測試通過！');
    } else {
        console.log('⚠️ 部分 API 可能需要備用數據');
    }
    
    return results;
}

// 如果直接運行此檔案，執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
    runApiTests();
}