const Food = require('../../models/Food');
const DailyRecommendation = require('../../models/DailyRecommendation');

exports.today = async (req, res) => {
  try {
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const todayString = beijingTime.toISOString().split('T')[0];
    let recommendation = await DailyRecommendation.findOne({ userId: req.user._id, dateString: todayString }).populate('foodId');
    if (recommendation && recommendation.foodId) {
      return res.json({ success: true, food: recommendation.foodId, message: `今天推荐您尝试：${recommendation.foodId.name} ${recommendation.foodId.emoji}`, isNewRecommendation: false });
    }
    const allFoods = await Food.find({});
    if (allFoods.length === 0) return res.status(404).json({ success: false, message: '暂无美食数据，请先添加一些美食！' });
    const sevenDaysAgo = new Date(beijingTime.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentRecommendations = await DailyRecommendation.find({ userId: req.user._id, date: { $gte: sevenDaysAgo } });
    const recentFoodIds = recentRecommendations.map(r => r.foodId.toString());
    let availableFoods = allFoods.filter(f => !recentFoodIds.includes(f._id.toString()));
    if (availableFoods.length === 0) availableFoods = allFoods;
    const seed = req.user._id.toString() + todayString;
    const seedHash = Array.from(seed).reduce((a, b) => { a = (a << 5) - a + b.charCodeAt(0); return a & a; }, 0);
    const selectedFood = availableFoods[Math.abs(seedHash) % availableFoods.length];
    const newRecommendation = new DailyRecommendation({ userId: req.user._id, foodId: selectedFood._id, date: beijingTime, dateString: todayString });
    await newRecommendation.save();
    res.json({ success: true, food: selectedFood, message: `今天推荐您尝试：${selectedFood.name} ${selectedFood.emoji}`, isNewRecommendation: true });
  } catch (e) { res.status(500).json({ success: false, message: '获取今日推荐失败，请稍后重试' }); }
};

exports.history = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const recommendations = await DailyRecommendation.find({ userId: req.user._id }).populate('foodId').sort({ date: -1 }).skip(skip).limit(parseInt(limit));
    const total = await DailyRecommendation.countDocuments({ userId: req.user._id });
    res.json({ success: true, recommendations: recommendations.map(r => ({ date: r.dateString, food: r.foodId, createdAt: r.createdAt })), pagination: { current: parseInt(page), total: Math.ceil(total / limit), count: recommendations.length, totalRecords: total } });
  } catch (e) { res.status(500).json({ success: false, message: '获取推荐历史失败' }); }
};
