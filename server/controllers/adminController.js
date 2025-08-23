const User = require('../../models/User');

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users, total: users.length });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
};
