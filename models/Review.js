const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // 关联的美食
    foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
        required: true
    },
    // 评论者
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 评论内容
    content: {
        type: String,
        required: [true, '评论内容不能为空'],
        maxlength: [500, '评论最多500个字符'],
        trim: true
    },
    rating: {
        type: Number,
        required: [true, '评分不能为空'],
        min: [1, '评分最低1星'],
        max: [5, '评分最高5星']
    },
    // 点赞用户列表
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // 点赞数量 (冗余字段，便于排序)
    likesCount: {
        type: Number,
        default: 0
    },
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 创建复合索引 - 一个用户对同一个美食只能评论一次
reviewSchema.index({ foodId: 1, userId: 1 }, { unique: true });

// 更新时间中间件
reviewSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 计算点赞数量
reviewSchema.pre('save', function(next) {
    this.likesCount = this.likes.length;
    next();
});

module.exports = mongoose.model('Review', reviewSchema);