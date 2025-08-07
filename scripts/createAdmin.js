const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        console.log('🔗 连接到MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('👤 检查管理员是否已存在...');
        const existingAdmin = await User.findOne({ email: 'admin@cyezoi.edu.cn' });
        
        if (existingAdmin) {
            console.log('⚠️  管理员账户已存在!');
            console.log('📧 邮箱: admin@cyezoi.edu.cn');
            console.log('👤 用户名:', existingAdmin.username);
            console.log('🛡️  角色:', existingAdmin.role);
            await mongoose.connection.close();
            return;
        }
        
        console.log('🆕 创建管理员账户...');
        const adminUser = new User({
            username: 'admin',
            email: 'admin@cyezoi.edu.cn',
            password: 'admin123',
            role: 'admin',
            avatar: '👨‍💼'
        });
        
        await adminUser.save();
        console.log('✅ 管理员账户创建成功!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 邮箱: admin@cyezoi.edu.cn');
        console.log('🔑 密码: admin123');
        console.log('👤 用户名: admin');
        console.log('🛡️  角色: 管理员');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ 创建管理员失败:', error.message);
        process.exit(1);
    }
}

createAdmin();