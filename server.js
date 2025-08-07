const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const User = require('./models/User');
const Food = require('./models/Food');
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
    res.header('Access-Control-Allow-Origin', 'http://localhost:4000');
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
        const { name, category, location, rating, description } = req.body;
        
        // 输入验证
        if (!name || !category || !location || !rating || !description) {
            console.log('❌ 添加失败: 缺少必要字段');
            return res.status(400).json({
                success: false,
                message: '请填写完整的美食信息'
            });
        }

        // emoji映射
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
            rating: parseFloat(rating),
            description: description.trim(),
            emoji: categoryEmojiMap[category] || '🍽️',
            createdBy: req.user._id,
            createdByName: req.user.username,
            reviews: 1
        });

        const savedFood = await newFood.save();
        await savedFood.populate('createdBy', 'username avatar');
        
        console.log('✅ 美食添加成功:', savedFood.name);
        res.status(201).json({
            success: true,
            message: '美食添加成功！感谢你的分享！',
            food: savedFood
        });

    } catch (error) {
        console.error('❌ 添加美食错误:', error);
        
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: errorMessages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: '添加美食失败，请稍后重试'
        });
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