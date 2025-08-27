const User = require('../../models/User');
const { generateToken } = require('../../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写完整的用户名、邮箱和密码' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少需要6位字符' });
    }

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existingUser) {
      const conflictField = existingUser.email === email.toLowerCase() ? '邮箱' : '用户名';
      return res.status(400).json({ success: false, message: `${conflictField}已被使用，请选择其他${conflictField}` });
    }

    const newUser = new User({ username: username.trim(), email: email.toLowerCase().trim(), password, avatar: '👤' });
    const savedUser = await newUser.save();

    const token = generateToken(savedUser._id);
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ success: true, message: '注册成功！欢迎加入曹杨二中美食评分系统！', user: {
      id: savedUser._id, username: savedUser.username, email: savedUser.email, role: savedUser.role, avatar: savedUser.avatar, createdAt: savedUser.createdAt,
    }});
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const fieldName = field === 'email' ? '邮箱' : '用户名';
      return res.status(400).json({ success: false, message: `${fieldName}已被使用，请选择其他${fieldName}` });
    }
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请输入邮箱和密码' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, message: `欢迎回来，${user.username}！`, user: {
      id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.createdAt,
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};

exports.logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: '已安全退出登录' });
};

exports.me = (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { id: u._id, username: u.username, email: u.email, role: u.role, avatar: u.avatar, createdAt: u.createdAt } });
};
