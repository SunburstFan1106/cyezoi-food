const mongoose = require('mongoose');

const schoolMenuSchema = new mongoose.Schema({
    // 日期
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    // 餐次（早餐、午餐、晚餐）
    mealType: {
        type: String,
        required: true,
        enum: ['breakfast', 'lunch', 'dinner'],
        default: 'lunch'
    },
    // 菜品列表
    dishes: [{
        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Food',
            required: true
        },
        price: {
            type: Number,
            min: 0,
            default: 0
        },
        availability: {
            type: Boolean,
            default: true
        }
    }],
    // 学校信息
    school: {
        name: {
            type: String,
            default: '上海市曹杨第二中学'
        },
        location: {
            type: String,
            default: '上海市普陀区'
        }
    },
    // 数据源
    source: {
        type: String,
        enum: ['manual', 'crawler', 'api'],
        default: 'crawler'
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

// 创建复合索引
schoolMenuSchema.index({ date: 1, mealType: 1 }, { unique: true });

// 更新时间中间件
schoolMenuSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 获取今日菜单的静态方法
schoolMenuSchema.statics.getTodayMenu = function(mealType = 'lunch') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.findOne({
        date: { $gte: today, $lt: tomorrow },
        mealType: mealType
    }).populate('dishes.foodId');
};

// 获取本周菜单的静态方法
schoolMenuSchema.statics.getWeekMenu = function() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    return this.find({
        date: { $gte: startOfWeek, $lt: endOfWeek }
    }).populate('dishes.foodId').sort({ date: 1, mealType: 1 });
};

module.exports = mongoose.model('SchoolMenu', schoolMenuSchema);