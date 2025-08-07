const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'cyezoi-food-secret-key-2024';

// 生成JWT token
exports.generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// 验证JWT token中间件
exports.verifyToken = async (req, res, next) => {
    try {
        // 从cookie或Authorization头获取token
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: '请先登录访问此功能' 
            });
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: '用户不存在，请重新登录' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token验证错误:', error);
        return res.status(401).json({ 
            success: false,
            message: '登录状态已过期，请重新登录' 
        });
    }
};

// 验证管理员权限中间件
exports.requireAdmin = async (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: '需要管理员权限才能执行此操作' 
        });
    }
    next();
};

// 可选的token验证（不强制要求登录）
exports.optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }
        
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // 可选认证失败不影响请求继续
        console.log('可选认证失败:', error.message);
    }
    next();
};