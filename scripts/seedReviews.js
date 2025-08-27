const mongoose = require('mongoose');
const User = require('../models/User');
const Food = require('../models/Food');
const Review = require('../models/Review');
require('dotenv').config();

const sampleReviews = [
    {
        content: "这家兰州拉面真的很正宗！汤头清香，面条劲道，牛肉也很新鲜。价格实惠，学生党的福音！",
        rating: 5
    },
    {
        content: "面条有点软，不过汤很好喝。服务态度不错，但等待时间有点长。",
        rating: 4
    },
    {
        content: "炸鸡很香脆，汉堡也新鲜。就是价格有点贵，偶尔吃吃还行。",
        rating: 4
    },
    {
        content: "奶茶甜度正好，珍珠也很Q弹。店里环境不错，适合和朋友聊天。",
        rating: 5
    }
];

async function seedReviews() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food');
        
        console.log('🌱 开始添加示例评论...');
        
        // 获取所有用户和美食
        const users = await User.find({});
        const foods = await Food.find({});
        
        if (users.length === 0 || foods.length === 0) {
            console.log('❌ 请先添加用户和美食数据');
            process.exit(1);
        }
        
        // 为每个美食添加1-2条评论
        for (const food of foods) {
            const reviewsToAdd = sampleReviews.slice(0, Math.floor(Math.random() * 2) + 1);
            
            for (let i = 0; i < reviewsToAdd.length; i++) {
                const reviewData = reviewsToAdd[i];
                const randomUser = users[Math.floor(Math.random() * users.length)];
                
                // 检查是否已存在评论
                const existingReview = await Review.findOne({
                    foodId: food._id,
                    userId: randomUser._id
                });
                
                if (!existingReview) {
                    const review = new Review({
                        foodId: food._id,
                        userId: randomUser._id,
                        content: reviewData.content,
                        rating: reviewData.rating
                    });
                    
                    await review.save();
                    console.log(`✅ 为"${food.name}"添加评论`);
                }
            }
            
            // 重新计算美食评分
            await food.calculateRating();
        }
        
        console.log('🎉 示例评论添加完成！');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 添加示例评论失败:', error);
        process.exit(1);
    }
}

seedReviews();