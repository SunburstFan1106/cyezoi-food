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

// 创建菜单（管理员功能）
exports.createMenu = async (req, res) => {
    try {
        const { date, mealType, dishes } = req.body;
        
        if (!date || !mealType || !dishes || dishes.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供完整的菜单信息'
            });
        }
        
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
        
        const menu = new SchoolMenu({
            date: new Date(date),
            mealType,
            dishes
        });
        
        await menu.save();
        await menu.populate('dishes.foodId');
        
        res.status(201).json({
            success: true,
            menu,
            message: '菜单创建成功'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: '该时间段的菜单已存在'
            });
        }
        
        console.error('创建菜单失败:', error);
        res.status(500).json({
            success: false,
            message: '创建菜单失败'
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