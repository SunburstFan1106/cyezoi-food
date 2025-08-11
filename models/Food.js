const mongoose = require('mongoose');

const ratingDistributionDefault = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

const FoodSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { 
        type: String, 
        required: true,
        enum: ['面食', '快餐', '饮品', '小吃', '早餐', '其他']
    },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    emoji: { type: String, default: '🍽️' },
    averageRating: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    ratingDistribution: {
        type: Map,
        of: Number,
        default: () => ratingDistributionDefault
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String } 
}, {
    timestamps: true
});

// 计算平均评分的方法
FoodSchema.methods.calculateRating = async function() {
    const Review = mongoose.model('Review');
    const stats = await Review.aggregate([
        { $match: { foodId: this._id } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingCounts: { $push: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        const stat = stats[0];
        this.averageRating = Math.round(stat.averageRating * 10) / 10;
        this.reviewsCount = stat.totalReviews;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stat.ratingCounts.forEach(r => { distribution[r]++; });
        this.ratingDistribution = distribution;
        this.totalRating = stat.ratingCounts.reduce((a, b) => a + b, 0);
    } else {
        this.averageRating = 0;
        this.reviewsCount = 0;
        this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        this.totalRating = 0;
    }

    await this.save();
};

module.exports = mongoose.model('Food', FoodSchema);