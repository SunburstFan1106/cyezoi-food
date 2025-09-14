const SchoolMenu = require('../../models/SchoolMenu');
const Food = require('../../models/Food');

// 获取今日菜单
exports.getTodayMenu = async (req, res) => {
    try {
        const { mealType = 'lunch' } = req.query;
        const menu = await SchoolMenu.getTodayMenu(mealType);
        
        if (!menu) {
            return res.json({
                success: true,
                menu: null,
                message: '今日暂无菜单'
            });
        }
        
        res.json({
            success: true,
            menu,
            message: '获取今日菜单成功'
        });
    } catch (error) {
        console.error('获取今日菜单失败:', error);
        res.status(500).json({
            success: false,
            message: '获取今日菜单失败'
        });
    }
};

// 获取本周菜单
exports.getWeekMenu = async (req, res) => {
    try {
        const menus = await SchoolMenu.getWeekMenu();
        
        res.json({
            success: true,
            menus,
            message: '获取本周菜单成功'
        });
    } catch (error) {
        console.error('获取本周菜单失败:', error);
        res.status(500).json({
            success: false,
            message: '获取本周菜单失败'
        });
    }
};

// 添加食堂菜单（管理员功能）- 支持多餐次
exports.createMenu = async (req, res) => {
    try {
        console.log('📝 收到添加菜单请求:', req.body);
        const { date, meals } = req.body;
        
        if (!date || !meals) {
            return res.status(400).json({
                success: false,
                message: '缺少必要字段：日期或餐次信息'
            });
        }

        // meals 格式: { breakfast: [dishes], lunch: [dishes], dinner: [dishes] }
        const validMealTypes = ['breakfast', 'lunch', 'dinner'];
        const createdMenus = [];

        for (const mealType of validMealTypes) {
            if (meals[mealType] && meals[mealType].length > 0) {
                const dishes = meals[mealType];
                
                // 验证菜品是否存在
                for (const dish of dishes) {
                    const food = await Food.findById(dish.foodId);
                    if (!food) {
                        return res.status(400).json({
                            success: false,
                            message: `菜品 ${dish.foodId} 不存在`
                        });
                    }
                }

                // 检查是否已存在相同日期和餐次的菜单
                const existingMenu = await SchoolMenu.findOne({
                    date: new Date(date),
                    mealType
                });

                if (existingMenu) {
                    // 更新现有菜单
                    existingMenu.dishes = dishes;
                    await existingMenu.save();
                    await existingMenu.populate('dishes.foodId');
                    createdMenus.push(existingMenu);
                    console.log(`✅ 更新菜单: ${date} ${mealType}`);
                } else {
                    // 创建新菜单
                    const newMenu = new SchoolMenu({
                        date: new Date(date),
                        mealType,
                        dishes,
                        school: {
                            name: '上海市曹杨第二中学',
                            location: '上海市普陀区梅川路160号'
                        },
                        source: 'manual',
                        createdAt: new Date()
                    });

                    await newMenu.save();
                    await newMenu.populate('dishes.foodId');
                    createdMenus.push(newMenu);
                    console.log(`✅ 创建菜单: ${date} ${mealType}`);
                }
            }
        }
        
        console.log('✅ 菜单操作完成，共处理:', createdMenus.length, '个餐次');
        res.status(201).json({
            success: true,
            message: `菜单操作成功！共处理了 ${createdMenus.length} 个餐次。`,
            menus: createdMenus
        });
    } catch (error) {
        console.error('❌ 添加食堂菜单失败:', error);
        res.status(500).json({
            success: false,
            message: '添加食堂菜单失败',
            error: error.message
        });
    }
};

// 获取指定日期的所有餐次菜单
exports.getDayMenu = async (req, res) => {
    try {
        const { date } = req.params;
        
        const menus = await SchoolMenu.find({
            date: new Date(date)
        }).populate('dishes.foodId').sort({ mealType: 1 });
        
        res.json({
            success: true,
            menus,
            message: '获取当日菜单成功'
        });
    } catch (error) {
        console.error('获取当日菜单失败:', error);
        res.status(500).json({
            success: false,
            message: '获取当日菜单失败'
        });
    }
};

// 更新菜单（管理员功能）
exports.updateMenu = async (req, res) => {
    try {
        const { menuId } = req.params;
        const { dishes } = req.body;
        
        const menu = await SchoolMenu.findById(menuId);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: '菜单不存在'
            });
        }
        
        if (dishes) {
            // 验证菜品是否存在
            for (const dish of dishes) {
                const food = await Food.findById(dish.foodId);
                if (!food) {
                    return res.status(400).json({
                        success: false,
                        message: `菜品 ${dish.foodId} 不存在`
                    });
                }
            }
            menu.dishes = dishes;
        }
        
        await menu.save();
        await menu.populate('dishes.foodId');
        
        res.json({
            success: true,
            menu,
            message: '菜单更新成功'
        });
    } catch (error) {
        console.error('更新菜单失败:', error);
        res.status(500).json({
            success: false,
            message: '更新菜单失败'
        });
    }
};

// 删除菜单（管理员功能）
exports.deleteMenu = async (req, res) => {
    try {
        const { menuId } = req.params;
        
        const menu = await SchoolMenu.findByIdAndDelete(menuId);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: '菜单不存在'
            });
        }
        
        res.json({
            success: true,
            message: '菜单删除成功'
        });
    } catch (error) {
        console.error('删除菜单失败:', error);
        res.status(500).json({
            success: false,
            message: '删除菜单失败'
        });
    }
};

// 手动触发爬虫（管理员功能）
exports.crawlMenu = async (req, res) => {
    try {
        const SchoolMenuCrawler = require('../../scripts/crawlSchoolMenu');
        const crawler = new SchoolMenuCrawler();
        
        // 在后台执行爬虫
        crawler.crawl().catch(error => {
            console.error('后台爬虫执行失败:', error);
        });
        
        res.json({
            success: true,
            message: '爬虫任务已启动，请稍后查看结果'
        });
    } catch (error) {
        console.error('启动爬虫失败:', error);
        res.status(500).json({
            success: false,
            message: '启动爬虫失败'
        });
    }
};

// 获取菜单详情（管理员功能）
exports.getMenuById = async (req, res) => {
    try {
        const { menuId } = req.params;
        
        const menu = await SchoolMenu.findById(menuId).populate('dishes.foodId');
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: '菜单不存在'
            });
        }
        
        res.json({
            success: true,
            menu,
            message: '获取菜单详情成功'
        });
    } catch (error) {
        console.error('获取菜单详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取菜单详情失败'
        });
    }
};