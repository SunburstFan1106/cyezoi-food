const Food = require('../models/Food');

exports.listFoods = async (req, res) => {
    try {
        const foods = await Food.find().sort({ createdAt: -1 });
        res.json(foods);
    } catch (e) {
        res.status(500).json({ message: '获取美食失败' });
    }
};

exports.createFood = async (req, res) => {
    try {
        const { name, category, location, description, emoji } = req.body;
        if (!name || !category || !location || !description) {
            return res.status(400).json({ message: '缺少必要字段' });
        }
        const food = await Food.create({
            name, category, location, description,
            emoji: emoji || '🍽️',
            createdBy: req.user?._id
        });
        res.status(201).json({ message: '创建成功', food });
    } catch (e) {
        console.error('创建美食错误:', e);
        res.status(500).json({ message: '创建失败' });
    }
};

exports.deleteFood = async (req, res) => {
    try {
        const { id } = req.params;
        const food = await Food.findById(id);
        if (!food) return res.status(404).json({ message: '未找到该美食' });

        // 可选: 权限校验 (管理员或创建者)
        if (req.user.role !== 'admin' && String(food.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ message: '无权限删除' });
        }

        await food.deleteOne();
        res.json({ message: '删除成功' });
    } catch (e) {
        res.status(500).json({ message: '删除失败' });
    }
};