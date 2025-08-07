const mongoose = require('mongoose');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function diagnose() {
    console.log('🔍 开始诊断系统...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. 检查项目结构
    console.log('📁 检查项目结构:');
    const requiredFiles = [
        'server.js',
        'models/User.js',
        'models/Food.js',
        'middleware/auth.js',
        '.env'
    ];
    
    for (const file of requiredFiles) {
        if (fs.existsSync(path.join(process.cwd(), file))) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} (缺失)`);
        }
    }
    console.log('');
    
    // 2. 检查环境变量
    console.log('📋 环境变量:');
    console.log('PORT:', process.env.PORT || '未设置 (将使用8000)');
    console.log('MONGODB_URI:', process.env.MONGODB_URI || '未设置 (将使用默认)');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
    console.log('NODE_ENV:', process.env.NODE_ENV || '未设置');
    console.log('');
    
    // 3. 检查依赖
    console.log('📦 检查依赖包:');
    try {
        require('express');
        console.log('✅ express');
    } catch(e) { console.log('❌ express'); }
    
    try {
        require('mongoose');
        console.log('✅ mongoose');
    } catch(e) { console.log('❌ mongoose'); }
    
    try {
        require('bcryptjs');
        console.log('✅ bcryptjs');
    } catch(e) { console.log('❌ bcryptjs'); }
    
    try {
        require('jsonwebtoken');
        console.log('✅ jsonwebtoken');
    } catch(e) { console.log('❌ jsonwebtoken'); }
    console.log('');
    
    // 4. 检查端口占用
    console.log('🔍 检查端口占用...');
    try {
        await new Promise((resolve) => {
            exec('lsof -i :8000', (error, stdout, stderr) => {
                if (stdout) {
                    console.log('⚠️  端口8000被占用:');
                    console.log(stdout);
                } else {
                    console.log('✅ 端口8000可用');
                }
                resolve();
            });
        });
    } catch (error) {
        console.log('无法检查端口状态');
    }
    console.log('');
    
    // 5. 尝试连接MongoDB
    console.log('🔗 尝试连接MongoDB...');
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food';
        console.log('连接字符串:', uri);
        
        await mongoose.connect(uri, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ MongoDB连接成功!');
        console.log('数据库:', mongoose.connection.name);
        console.log('主机:', mongoose.connection.host);
        console.log('端口:', mongoose.connection.port);
        
        // 测试查询用户
        try {
            const User = require('../models/User');
            const userCount = await User.countDocuments();
            console.log('👥 用户数量:', userCount);
        } catch (e) {
            console.log('⚠️  无法加载User模型:', e.message);
        }
        
        await mongoose.connection.close();
        
    } catch (error) {
        console.log('❌ MongoDB连接失败:', error.message);
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 诊断完成');
    console.log('');
    console.log('🚀 建议的启动步骤:');
    console.log('1. npm install');
    console.log('2. npm run create-admin');
    console.log('3. npm run dev');
}

diagnose();