const mongoose = require("mongoose");

const dailyRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dateString: {
      type: String,
      required: true,
      // 格式: YYYY-MM-DD，用于快速查询
    },
  },
  {
    timestamps: true,
  }
);

// 复合索引，确保每个用户每天只有一个推荐
dailyRecommendationSchema.index({ userId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model(
  "DailyRecommendation",
  dailyRecommendationSchema
);
