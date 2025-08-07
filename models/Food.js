const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '美食名称不能为空'],
        trim: true
    },
    category: {
        type: String,
        required: [true, '美食类别不能为空'],
        enum: ['面食', '快餐', '饮品', '小吃', '早餐', '其他']
    },
    location: {
        type: String,
        required: [true, '位置不能为空'],
        trim: true
    },
    rating: {
        type: Number,
        required: [true, '评分不能为空'],
        min: [1, '评分最低1分'],
        max: [5, '评分最高5分']
    },
    reviews: {
        type: Number,
        default: 0,
        min: 0
    },
    emoji: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: [true, '描述不能为空'],
        maxlength: [500, '描述最多500个字符']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdByName: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Food', foodSchema);