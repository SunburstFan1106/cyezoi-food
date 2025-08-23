exports.requireAuth = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: '未登录' });
    next();
};