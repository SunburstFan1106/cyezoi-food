const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Food = require('./models/Food');
const Review = require('./models/Review');
const { generateToken, verifyToken, requireAdmin, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB连接成功');
    console.log('📊 数据库:', mongoose.connection.name);
})
.catch(err => {
    console.error('❌ MongoDB连接失败:', err.message);
    process.exit(1);
});

// 中间件设置
app.use((req, res, next) => {
    // CORS配置
    // res.header('Access-Control-Allow-Origin', 'http://localhost:4000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        console.log('📋 处理OPTIONS预检请求:', req.path);
        return res.status(200).end();
    }
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 允许前端同源或本地调试
app.use(cors({
    origin: ['http://127.0.0.1:8000','http://localhost:8000','https://food.cyezoi.com'],
    credentials: true
}));

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        const logBody = { ...req.body };
        if (logBody.password) logBody.password = '[隐藏]';
        console.log('📥 请求体:', logBody);
    }
    next();
});

// ================================
// 根路由 - API文档
// ================================
app.get('/', (req, res) => {
    res.json({
        message: '🍔 曹杨二中美食评分系统 API',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        features: ['用户认证系统', '美食管理', '权限控制', 'JWT认证'],
        endpoints: {
            // 认证相关
            'POST /api/auth/register': '用户注册',
            'POST /api/auth/login': '用户登录',
            'POST /api/auth/logout': '用户登出',
            'GET /api/auth/me': '获取当前用户信息',
            
            // 美食相关
            'GET /api/foods': '获取美食列表',
            'POST /api/foods': '添加新美食（需登录）',
            'GET /api/foods/:id': '获取单个美食详情',
            'PUT /api/foods/:id': '更新美食信息（作者或管理员）',
            'DELETE /api/foods/:id': '删除美食（仅管理员）',
            
            // 用户管理（管理员）
            'GET /api/admin/users': '获取用户列表（仅管理员）',
            'DELETE /api/admin/users/:id': '删除用户（仅管理员）'
        }
    });
});

// ================================
// 用户认证路由
// ================================

// 用户注册
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📝 用户注册请求');
        const { username, email, password } = req.body;
        
        // 输入验证
        if (!username || !email || !password) {
            console.log('❌ 注册失败: 缺少必要字段');
            return res.status(400).json({
                success: false,
                message: '请填写完整的用户名、邮箱和密码'
            });
        }
        
        if (password.length < 6) {
            console.log('❌ 注册失败: 密码长度不足');
            return res.status(400).json({
                success: false,
                message: '密码至少需要6位字符'
            });
        }

        // 检查用户是否已存在
        console.log('🔍 检查用户是否已存在...');
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });
        
        if (existingUser) {
            const conflictField = existingUser.email === email.toLowerCase() ? '邮箱' : '用户名';
            console.log('❌ 注册失败:', conflictField, '已被使用');
            return res.status(400).json({ 
                success: false,
                message: `${conflictField}已被使用，请选择其他${conflictField}` 
            });
        }

        // 创建新用户
        console.log('👤 创建新用户...');
        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
            avatar: '👤'
        });

        const savedUser = await newUser.save();
        console.log('✅ 用户创建成功:', savedUser.username, savedUser._id);

        // 生成JWT token
        const token = generateToken(savedUser._id);
        
        // 设置HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // 开发环境设为false
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
        });

        res.status(201).json({
            success: true,
            message: '注册成功！欢迎加入曹杨二中美食评分系统！',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role,
                avatar: savedUser.avatar,
                createdAt: savedUser.createdAt
            }
        });

    } catch (error) {
        console.error('❌ 用户注册错误:', error);
        
        // 处理MongoDB验证错误
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: errorMessages.join(', ')
            });
        }
        
        // 处理MongoDB重复键错误
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const fieldName = field === 'email' ? '邮箱' : '用户名';
            return res.status(400).json({
                success: false,
                message: `${fieldName}已被使用，请选择其他${fieldName}`
            });
        }
        
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 用户登录请求');
        const { email, password } = req.body;
        
        // 输入验证
        if (!email || !password) {
            console.log('❌ 登录失败: 缺少邮箱或密码');
            return res.status(400).json({
                success: false,
                message: '请输入邮箱和密码'
            });
        }

        // 查找用户
        console.log('🔍 查找用户:', email);
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('❌ 登录失败: 用户不存在');
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 验证密码
        console.log('🔑 验证密码...');
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            console.log('❌ 登录失败: 密码错误');
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 生成JWT token
        const token = generateToken(user._id);
        
        // 设置cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log('✅ 用户登录成功:', user.username);
        res.json({
            success: true,
            message: `欢迎回来，${user.username}！`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ 用户登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 用户登出
app.post('/api/auth/logout', (req, res) => {
    console.log('👋 用户登出');
    res.cookie('token', '', { 
        httpOnly: true,
        expires: new Date(0) 
    });
    
    res.json({
        success: true,
        message: '已安全退出登录'
    });
});

// 获取当前用户信息
app.get('/api/auth/me', verifyToken, (req, res) => {
    console.log('👤 获取用户信息:', req.user.username);
    res.json({
        success: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar,
            createdAt: req.user.createdAt
        }
    });
});

// ================================
// 美食相关路由
// ================================

// 获取所有美食（公开访问，但会显示用户相关信息）
app.get('/api/foods', optionalAuth, async (req, res) => {
    try {
        console.log('🍽️ 获取美食列表');
        
        // 可以添加查询参数支持
        const { category, search, sort = 'createdAt', order = 'desc' } = req.query;
        let query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        const foods = await Food.find(query)
            .populate('createdBy', 'username avatar')
            .sort({ [sort]: order === 'desc' ? -1 : 1 })
            .lean();
            
        console.log('✅ 返回', foods.length, '个美食数据');
        res.json(foods);
        
    } catch (error) {
        console.error('❌ 获取美食列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取美食列表失败'
        });
    }
});

// 添加新美食（需要登录）
app.post('/api/foods', verifyToken, async (req, res) => {
    try {
        console.log('🆕 添加新美食，用户:', req.user.username);
        const { name, category, location, description, emoji } = req.body;

        if (!name || !category || !location || !description) {
            return res.status(400).json({ success: false, message: '缺少必要字段' });
        }

        const categoryEmojiMap = {
            '面食': '🍜',
            '快餐': '🍔',
            '饮品': '🧋',
            '小吃': '🍗',
            '早餐': '🥞',
            '其他': '🍽️'
        };

        const newFood = new Food({
            name: name.trim(),
            category,
            location: location.trim(),
            description: description.trim(),
            emoji: emoji || categoryEmojiMap[category] || '🍽️',
            createdBy: req.user._id,
            createdByName: req.user.username
            // 统计字段走模型默认值
        });

        const savedFood = await newFood.save();
        await savedFood.populate('createdBy', 'username avatar');

        console.log('✅ 美食添加成功:', savedFood.name);
        res.status(201).json({
            success: true,
            message: '美食添加成功！',
            food: savedFood
        });
    } catch (error) {
        console.error('❌ 添加美食错误:', error);
        res.status(500).json({ success: false, message: '添加失败' });
    }
});

// 删除美食（仅管理员）
app.delete('/api/foods/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        console.log('🗑️ 管理员删除美食:', req.params.id);
        
        const food = await Food.findById(req.params.id);
        if (!food) {
            console.log('❌ 美食不存在');
            return res.status(404).json({
                success: false,
                message: '美食不存在'
            });
        }

        await Food.findByIdAndDelete(req.params.id);
        
        console.log('✅ 美食删除成功:', food.name);
        res.json({
            success: true,
            message: `美食"${food.name}"已删除`
        });

    } catch (error) {
        console.error('❌ 删除美食错误:', error);
        res.status(500).json({
            success: false,
            message: '删除美食失败'
        });
    }
});

// ================================
// 评论相关路由
// ================================

// 获取美食的所有评论
app.get('/api/foods/:foodId/reviews', async (req, res) => {
    try {
        console.log('💬 获取美食评论:', req.params.foodId);
        
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // 检查美食是否存在
        const food = await Food.findById(req.params.foodId);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: '美食不存在'
            });
        }
        
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortOptions = {};
        sortOptions[sort] = sortOrder;
        
        // 获取评论列表
        const reviews = await Review.find({ foodId: req.params.foodId })
            .populate('userId', 'username avatar')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        // 获取总数
        const total = await Review.countDocuments({ foodId: req.params.foodId });
        
        console.log('✅ 返回', reviews.length, '条评论');
        res.json({
            success: true,
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalReviews: total,
                hasMore: skip + reviews.length < total
            }
        });
        
    } catch (error) {
        console.error('❌ 获取评论错误:', error);
        res.status(500).json({
            success: false,
            message: '获取评论失败'
        });
    }
});

// 添加评论
app.post('/api/foods/:foodId/reviews', verifyToken, async (req, res) => {
    try {
        console.log('📝 添加评论，用户:', req.user.username);
        const { content, rating } = req.body;
        const foodId = req.params.foodId;
        
        // 输入验证
        if (!content || !rating) {
            return res.status(400).json({
                success: false,
                message: '评论内容和评分不能为空'
            });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: '评分必须在1-5星之间'
            });
        }
        
        // 检查美食是否存在
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: '美食不存在'
            });
        }
        
        // 检查用户是否已经评论过
        const existingReview = await Review.findOne({ 
            foodId, 
            userId: req.user._id 
        });
        
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: '您已经评论过这个美食了，可以选择修改评论'
            });
        }
        
        // 创建新评论
        const newReview = new Review({
            foodId,
            userId: req.user._id,
            content: content.trim(),
            rating: parseInt(rating)
        });
        
        const savedReview = await newReview.save();
        await savedReview.populate('userId', 'username avatar');
        
        // 重新计算美食的平均评分
        await food.calculateRating();
        
        console.log('✅ 评论添加成功:', savedReview._id);
        res.status(201).json({
            success: true,
            message: '评论添加成功！',
            review: savedReview,
            foodRating: {
                averageRating: food.averageRating,
                reviewsCount: food.reviewsCount
            }
        });
        
    } catch (error) {
        console.error('❌ 添加评论错误:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: '您已经评论过这个美食了'
            });
        }
        
        res.status(500).json({
            success: false,
            message: '添加评论失败，请稍后重试'
        });
    }
});

// 更新评论 (只能修改自己的评论)
app.put('/api/reviews/:reviewId', verifyToken, async (req, res) => {
    try {
        console.log('✏️ 修改评论:', req.params.reviewId);
        const { content, rating } = req.body;
        
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 检查是否是评论作者
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: '只能修改自己的评论'
            });
        }
        
        // 更新评论
        if (content) review.content = content.trim();
        if (rating) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: '评分必须在1-5星之间'
                });
            }
            review.rating = parseInt(rating);
        }
        
        const updatedReview = await review.save();
        await updatedReview.populate('userId', 'username avatar');
        
        // 重新计算美食评分
        const food = await Food.findById(review.foodId);
        if (food) {
            await food.calculateRating();
        }
        
        console.log('✅ 评论更新成功');
        res.json({
            success: true,
            message: '评论更新成功！',
            review: updatedReview
        });
        
    } catch (error) {
        console.error('❌ 更新评论错误:', error);
        res.status(500).json({
            success: false,
            message: '更新评论失败'
        });
    }
});

// 删除评论 (作者或管理员)
app.delete('/api/reviews/:reviewId', verifyToken, async (req, res) => {
    try {
        console.log('🗑️ 删除评论:', req.params.reviewId);
        
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 检查权限：评论作者或管理员可以删除
        const isAuthor = review.userId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '没有权限删除此评论'
            });
        }
        
        const foodId = review.foodId;
        await Review.findByIdAndDelete(req.params.reviewId);
        
        // 重新计算美食评分
        const food = await Food.findById(foodId);
        if (food) {
            await food.calculateRating();
        }
        
        console.log('✅ 评论删除成功');
        res.json({
            success: true,
            message: '评论删除成功'
        });
        
    } catch (error) {
        console.error('❌ 删除评论错误:', error);
        res.status(500).json({
            success: false,
            message: '删除评论失败'
        });
    }
});

// 点赞/取消点赞评论
app.post('/api/reviews/:reviewId/like', verifyToken, async (req, res) => {
    try {
        console.log('👍 点赞评论:', req.params.reviewId, '用户:', req.user.username);
        
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        const userId = req.user._id;
        const isLiked = review.likes.includes(userId);
        
        if (isLiked) {
            // 取消点赞
            review.likes = review.likes.filter(id => id.toString() !== userId.toString());
            console.log('✅ 取消点赞');
        } else {
            // 添加点赞
            review.likes.push(userId);
            console.log('✅ 添加点赞');
        }
        
        await review.save();
        
        res.json({
            success: true,
            message: isLiked ? '取消点赞成功' : '点赞成功',
            isLiked: !isLiked,
            likesCount: review.likesCount
        });
        
    } catch (error) {
        console.error('❌ 点赞评论错误:', error);
        res.status(500).json({
            success: false,
            message: '操作失败'
        });
    }
});

// 获取用户的所有评论
app.get('/api/user/reviews', verifyToken, async (req, res) => {
    try {
        console.log('👤 获取用户评论:', req.user.username);
        
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const reviews = await Review.find({ userId: req.user._id })
            .populate('foodId', 'name category location emoji')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await Review.countDocuments({ userId: req.user._id });
        
        res.json({
            success: true,
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalReviews: total
            }
        });
        
    } catch (error) {
        console.error('❌ 获取用户评论错误:', error);
        res.status(500).json({
            success: false,
            message: '获取评论失败'
        });
    }
});

// ================================
// 管理员路由
// ================================

// 获取所有用户（仅管理员）
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        console.log('👥 管理员获取用户列表');
        
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            users,
            total: users.length
        });
        
    } catch (error) {
        console.error('❌ 获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

// ================================
// 错误处理
// ================================

// 404处理
app.use((req, res) => {
    console.log('❓ 404请求:', req.method, req.path);
    res.status(404).json({ 
        success: false,
        message: '接口不存在',
        path: req.path,
        method: req.method
    });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('🚨 服务器错误:', err);
    
    // 处理JSON解析错误
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: '请求数据格式错误'
        });
    }
    
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// ================================
// 启动服务器
// ================================
const server = app.listen(PORT, '127.0.0.1', () => {
    console.log('🚀 服务器启动成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 端口: ${PORT}`);
    console.log(`🌐 本地访问: http://127.0.0.1:${PORT}`);
    console.log(`📖 API文档: http://127.0.0.1:${PORT}`);
    console.log(`🍽️ 美食API: http://127.0.0.1:${PORT}/api/foods`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

server.on('error', (err) => {
    console.error('🚨 服务器启动失败:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用`);
        process.exit(1);
    }
});

server.on('listening', () => {
    console.log('👂 服务器正在监听端口:', server.address());
});

// 添加进程错误处理
process.on('uncaughtException', (err) => {
    console.error('🚨 未捕获的异常:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 未处理的Promise拒绝:', reason);
    process.exit(1);
});

// 前端路由兜底 (若不是单页应用可省略)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:8000').split(',').map(o => o.trim());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});