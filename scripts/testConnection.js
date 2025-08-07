const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('🔄 测试MongoDB连接...');
        console.log('连接字符串:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food');
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ MongoDB连接成功!');
        console.log('数据库名称:', mongoose.connection.name);
        console.log('连接状态:', mongoose.connection.readyState);
        
        // 测试写入数据
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ test: 'Hello World', timestamp: new Date() });
        console.log('✅ 数据写入测试成功!');
        
        // 删除测试数据
        await testCollection.deleteMany({ test: 'Hello World' });
        console.log('✅ 数据删除测试成功!');
        
        await mongoose.connection.close();
        console.log('✅ 数据库连接测试完成');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ MongoDB连接失败:', error.message);
        console.error('详细错误:', error);
        process.exit(1);
    }
}

testConnection();