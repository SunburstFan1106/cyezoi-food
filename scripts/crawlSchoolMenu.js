const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Food = require('../models/Food');
require('dotenv').config();

class SchoolMenuCrawler {
    constructor() {
        this.baseUrl = 'https://web-hscyez.pte.sh.cn/';
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🚀 启动浏览器...');
        this.browser = await puppeteer.launch({
            headless: false, // 设为true以在后台运行
            defaultViewport: { width: 1280, height: 720 }
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    async navigateToMenuPage() {
        console.log('📄 导航到食堂菜单页面...');
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // 查找食堂菜单相关链接
            const menuSelectors = [
                'a[href*="食堂"]',
                'a[href*="菜单"]',
                'a[href*="menu"]',
                'a[href*="canteen"]',
                'a:contains("食堂")',
                'a:contains("菜单")',
                'a:contains("餐厅")'
            ];

            let menuFound = false;
            for (const selector of menuSelectors) {
                try {
                    const menuLink = await this.page.$(selector);
                    if (menuLink) {
                        console.log(`✅ 找到菜单链接: ${selector}`);
                        await menuLink.click();
                        await this.page.waitForTimeout(2000);
                        menuFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!menuFound) {
                console.log('⚠️ 未找到直接的菜单链接，尝试查找页面内容...');
                return await this.scrapeCurrentPageMenu();
            }

            return await this.scrapeMenuData();
        } catch (error) {
            console.error('❌ 导航失败:', error);
            return [];
        }
    }

    async scrapeCurrentPageMenu() {
        console.log('🔍 分析当前页面的菜单内容...');
        try {
            // 查找包含菜单信息的元素
            const menuData = await this.page.evaluate(() => {
                const dishes = [];
                
                // 常见的菜单选择器模式
                const menuSelectors = [
                    '.menu-item',
                    '.dish-item',
                    '.food-item',
                    'tr td', // 表格形式
                    'li:contains("菜")',
                    'div:contains("菜")',
                    'p:contains("菜")'
                ];

                // 查找包含菜品信息的文本
                const textNodes = document.evaluate(
                    '//text()[contains(., "菜") or contains(., "汤") or contains(., "饭")]',
                    document,
                    null,
                    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );

                for (let i = 0; i < textNodes.snapshotLength; i++) {
                    const node = textNodes.snapshotItem(i);
                    const text = node.textContent.trim();
                    
                    // 简单的菜品识别模式
                    if (text.length > 2 && text.length < 50 && 
                        (text.includes('菜') || text.includes('汤') || 
                         text.includes('饭') || text.includes('面') ||
                         text.includes('肉') || text.includes('鱼') ||
                         text.includes('蛋') || text.includes('豆腐'))) {
                        
                        dishes.push({
                            name: text,
                            category: this.categorizeDish(text),
                            source: 'web-crawl',
                            location: '上海市曹杨第二中学食堂'
                        });
                    }
                }

                return dishes;
            });

            return menuData;
        } catch (error) {
            console.error('❌ 解析页面菜单失败:', error);
            return [];
        }
    }

    async scrapeMenuData() {
        console.log('📋 提取菜单数据...');
        try {
            const dishes = await this.page.evaluate(() => {
                const menuItems = [];
                
                // 尝试多种选择器模式
                const selectors = [
                    '.menu-list li',
                    '.dish-list .dish',
                    'table tr td',
                    '.food-item',
                    '.menu-item'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        elements.forEach(el => {
                            const dishName = el.textContent.trim();
                            if (dishName && dishName.length > 1) {
                                menuItems.push({
                                    name: dishName,
                                    category: this.categorizeDish(dishName),
                                    source: 'web-crawl',
                                    location: '上海市曹杨第二中学食堂'
                                });
                            }
                        });
                        break;
                    }
                }

                return menuItems;
            });

            return dishes;
        } catch (error) {
            console.error('❌ 提取菜单数据失败:', error);
            return [];
        }
    }

    categorizeDish(dishName) {
        if (dishName.includes('汤') || dishName.includes('羹')) return '汤类';
        if (dishName.includes('饭') || dishName.includes('面') || dishName.includes('粥')) return '主食';
        if (dishName.includes('肉') || dishName.includes('鸡') || dishName.includes('鱼') || dishName.includes('虾')) return '荤菜';
        if (dishName.includes('菜') || dishName.includes('豆腐') || dishName.includes('蛋')) return '素菜';
        return '其他';
    }

    async saveToDatabase(dishes) {
        console.log('💾 保存菜单到数据库...');
        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food');
            
            let savedCount = 0;
            for (const dish of dishes) {
                const existing = await Food.findOne({ name: dish.name, location: dish.location });
                if (!existing) {
                    const food = new Food({
                        name: dish.name,
                        category: dish.category,
                        location: dish.location,
                        description: `从${dish.location}官网获取的菜品信息`,
                        emoji: this.getEmojiByCategory(dish.category),
                        source: 'school-crawler'
                    });
                    await food.save();
                    savedCount++;
                    console.log(`✅ 保存菜品: ${dish.name}`);
                } else {
                    console.log(`⏭️ 菜品已存在: ${dish.name}`);
                }
            }
            
            console.log(`🎉 成功保存 ${savedCount} 个新菜品！`);
            await mongoose.disconnect();
            return savedCount;
        } catch (error) {
            console.error('❌ 保存到数据库失败:', error);
            return 0;
        }
    }

    getEmojiByCategory(category) {
        const emojiMap = {
            '汤类': '🍲',
            '主食': '🍚',
            '荤菜': '🍖',
            '素菜': '🥬',
            '其他': '🍽️'
        };
        return emojiMap[category] || '🍽️';
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }

    async crawl() {
        try {
            await this.init();
            const dishes = await this.navigateToMenuPage();
            
            if (dishes.length === 0) {
                console.log('❌ 未找到菜单数据');
                return;
            }

            console.log(`📊 找到 ${dishes.length} 个菜品`);
            const savedCount = await this.saveToDatabase(dishes);
            
            console.log(`\n📈 爬取完成：`);
            console.log(`- 发现菜品: ${dishes.length} 个`);
            console.log(`- 新增菜品: ${savedCount} 个`);
            
        } catch (error) {
            console.error('❌ 爬取过程出错:', error);
        } finally {
            await this.close();
        }
    }
}

// 执行爬取
async function main() {
    console.log('🍽️ 开始爬取曹杨第二中学食堂菜单...\n');
    const crawler = new SchoolMenuCrawler();
    await crawler.crawl();
}

if (require.main === module) {
    main();
}

module.exports = SchoolMenuCrawler;