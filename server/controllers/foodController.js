// 修正路径：controllers 位于 server/controllers，模型在项目根 models
const Food = require('../../models/Food');

// 获取美食列表并附带贡献者用户名
exports.listFoods = async (req, res) => {
    try {
        const foods = await Food.find()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'username email')
            .lean();
        // 若缺少 createdByName 字段则补充
        const withContributor = foods.map(f => ({
            ...f,
            createdByName: f.createdByName || f.createdBy?.username || f.createdBy?.email || '匿名'
        }));
        res.json(withContributor);
    } catch (e) {
        console.error('获取美食失败:', e);
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
            name,
            category,
            location,
            description,
            emoji: emoji || '🍽️',
            createdBy: req.user?._id,
            createdByName: req.user?.username || req.user?.email || '未知'
        });
        res.status(201).json({ message: '创建成功', food });
    } catch (e) {
        console.error('创建美食错误:', e);
        res.status(500).json({ message: '创建失败' });
    }
};

// 更新美食（管理员或创建者）
exports.updateFood = async (req, res) => {
    try {
        const { id } = req.params;
    console.log('🔧 更新请求 id=', id);
        // ObjectId 基本格式校验
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({ message: '无效的ID格式' });
        }
        console.log('📥 更新请求体:', req.body);
        const food = await Food.findById(id);
        if (!food) return res.status(404).json({ message: '未找到该美食' });

        if (req.user.role !== 'admin' && String(food.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ message: '无权限修改' });
        }

        const { name, category, location, description, emoji } = req.body;
        if (name) food.name = name.trim();
        if (category) food.category = category;
        if (location) food.location = location.trim();
        if (description) food.description = description.trim();
        if (emoji) food.emoji = emoji;

        await food.save();
    console.log('✅ 更新成功:', food._id);
        res.json({ message: '更新成功', food });
    } catch (e) {
        console.error('更新美食错误:', e);
        res.status(500).json({ message: '更新失败' });
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