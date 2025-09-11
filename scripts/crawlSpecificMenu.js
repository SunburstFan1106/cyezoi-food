const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Food = require('../models/Food');
const SchoolMenu = require('../models/SchoolMenu');
require('dotenv').config();

class SpecificMenuCrawler {
    constructor() {
        this.targetUrl = 'https://web-hscyez.pte.sh.cn/tzgg/20250904/a1097612c3ac4d189652a981d8fa3e6a.html';
        this.browser = null;
        this.page = null;
        this.categoryEmojiMap = {
            '红烧': '🍖',
            '炒': '🥘', 
            '汤': '🍲',
            '面': '🍜',
            '饭': '🍚',
            '鸡': '🐔',
            '肉': '🥩',
            '鱼': '🐟',
            '虾': '🦐',
            '蛋': '🥚',
            '豆腐': '🧈',
            '青菜': '🥬',
            '白菜': '🥬',
            '土豆': '🥔',
            '萝卜': '🥕',
            '冬瓜': '🥒',
            '茄子': '🍆',
            '西红柿': '🍅',
            '米饭': '🍚',
            '粥': '🥣',
            '面条': '🍜',
            '饺子': '🥟',
            '包子': '🥟',
            '馒头': '🥖'
        };
    }

    async init() {
        console.log('🚀 启动浏览器...');
        this.browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // 设置用户代理
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    async crawlMenuPage() {
        console.log('📄 正在访问菜单页面...');
        console.log(`🔗 URL: ${this.targetUrl}`);
        
        try {
            await this.page.goto(this.targetUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            console.log('✅ 页面加载完成');

            // 获取页面标题
            const title = await this.page.title();
            console.log(`📰 页面标题: ${title}`);

            // 尝试多种方式提取菜单信息
            const menuData = await this.page.evaluate(() => {
                const result = {
                    title: document.title,
                    content: '',
                    dishes: []
                };

                // 获取页面主要内容
                const contentSelectors = [
                    '.content',
                    '.article-content', 
                    '.post-content',
                    '#content',
                    'article',
                    '.main-content',
                    'body'
                ];

                let mainContent = null;
                for (const selector of contentSelectors) {
                    mainContent = document.querySelector(selector);
                    if (mainContent) break;
                }

                if (mainContent) {
                    result.content = mainContent.innerText || mainContent.textContent || '';
                }

                // 尝试提取菜单信息的不同模式
                const text = result.content;
                
                // 模式1: 寻找包含菜名的行
                const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                
                const dishPatterns = [
                    /([^，。！？\n]{2,8})(肉|鱼|虾|蛋|豆腐|青菜|白菜|土豆|萝卜|冬瓜|茄子|西红柿)/g,
                    /([红烧炒煮蒸炸]{1,2}[^，。！？\n]{2,10})/g,
                    /([^，。！？\n]{2,8}[汤粥面饭]{1})/g
                ];

                // 从文本中提取可能的菜品
                for (const pattern of dishPatterns) {
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        const dishName = match[1] || match[0];
                        if (dishName && dishName.length >= 2 && dishName.length <= 12) {
                            result.dishes.push(dishName.trim());
                        }
                    }
                }

                // 去重
                result.dishes = [...new Set(result.dishes)];
                
                return result;
            });

            console.log('📋 爬取到的内容预览:');
            console.log(menuData.content.substring(0, 300) + '...');
            
            console.log(`🍽️ 识别到 ${menuData.dishes.length} 个可能的菜品:`);
            menuData.dishes.forEach((dish, index) => {
                console.log(`  ${index + 1}. ${dish}`);
            });

            return menuData;

        } catch (error) {
            console.error('❌ 爬取页面失败:', error.message);
            throw error;
        }
    }

    getEmojiForDish(dishName) {
        for (const [keyword, emoji] of Object.entries(this.categoryEmojiMap)) {
            if (dishName.includes(keyword)) {
                return emoji;
            }
        }
        return '🍽️'; // 默认emoji
    }

    getDishCategory(dishName) {
        if (dishName.includes('汤') || dishName.includes('粥')) return '饮品';
        if (dishName.includes('面') || dishName.includes('饺') || dishName.includes('包')) return '面食';
        if (dishName.includes('肉') || dishName.includes('鸡') || dishName.includes('鱼')) return '快餐';
        if (dishName.includes('菜') || dishName.includes('豆腐')) return '小吃';
        if (dishName.includes('粥') || dishName.includes('蛋')) return '早餐';
        return '其他';
    }

    async saveMenuToDatabase(menuData) {
        console.log('💾 保存菜单数据到数据库...');
        
        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food');
            
            const foods = [];
            let foundCount = 0;
            let missingCount = 0;
            let missingDishes = [];

            // ✅ 修复：仅检查现有菜品，不自动创建
            for (const dishName of menuData.dishes) {
                let food = await Food.findOne({ name: dishName });
                
                if (food) {
                    foods.push(food);
                    foundCount++;
                    console.log(`✅ 找到现有菜品: ${dishName}`);
                } else {
                    missingCount++;
                    missingDishes.push(dishName);
                    console.log(`⚠️ 菜品不存在: ${dishName}`);
                }
            }

            console.log(`\n📊 菜品检查结果:`);
            console.log(`✅ 找到现有菜品: ${foundCount} 个`);
            console.log(`⚠️ 缺失菜品: ${missingCount} 个`);
            
            if (missingDishes.length > 0) {
                console.log(`\n❌ 以下菜品需要在系统中手动创建:`);
                missingDishes.forEach(dish => {
                    console.log(`  - ${dish} (${this.getDishCategory(dish)}) ${this.getEmojiForDish(dish)}`);
                });
                console.log(`\n🔧 请先在系统中创建这些菜品，然后重新运行爬虫。`);
            }

            // 仅为存在的菜品创建菜单
            if (foods.length > 0) {
                // 创建今日菜单
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // 删除今日已有菜单
                await SchoolMenu.deleteMany({ date: today });
                
                const lunchMenu = new SchoolMenu({
                    date: today,
                    mealType: 'lunch',
                    dishes: foods.map((food, index) => ({
                        foodId: food._id,
                        price: 8 + Math.floor(Math.random() * 12) // 8-20元随机价格
                    })),
                    source: 'crawler',
                    sourceUrl: this.targetUrl,
                    createdAt: new Date()
                });
                
                await lunchMenu.save();
                console.log(`✅ 创建今日菜单，包含 ${foods.length} 道现有菜品`);
            }
            
            return { 
                foodsCreated: 0, // ✅ 修复：不再创建新菜品
                foodsFound: foundCount,
                foodsMissing: missingCount,
                menuCreated: foods.length > 0 
            };
            
        } catch (error) {
            console.error('❌ 保存数据失败:', error);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 浏览器已关闭');
        }
        
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔒 数据库连接已关闭');
        }
    }

    async run() {
        try {
            await this.init();
            const menuData = await this.crawlMenuPage();
            const result = await this.saveMenuToDatabase(menuData);
            
            console.log('🎉 爬取完成！');
            console.log(`📊 统计信息:`);
            console.log(`  🍽️ 创建菜品数量: ${result.foodsCreated}`);
            console.log(`  📅 创建菜单: ${result.menuCreated ? '是' : '否'}`);
            
        } catch (error) {
            console.error('💥 爬取过程出错:', error);
        } finally {
            await this.close();
        }
    }
}

// 运行爬虫
async function main() {
    const crawler = new SpecificMenuCrawler();
    await crawler.run();
    process.exit(0);
}

main().catch(console.error);