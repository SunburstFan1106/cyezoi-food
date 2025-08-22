const Review = require('../../models/Review');
const Food = require('../../models/Food');

exports.listByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ success: false, message: '美食不存在' });
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {}; sortOptions[sort] = sortOrder;
    const reviews = await Review.find({ foodId }).populate('userId', 'username avatar').sort(sortOptions).skip(skip).limit(parseInt(limit)).lean();
    const total = await Review.countDocuments({ foodId });
    res.json({ success: true, reviews, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalReviews: total, hasMore: skip + reviews.length < total } });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
};

exports.create = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { content, rating } = req.body;
    if (!content || !rating) return res.status(400).json({ success: false, message: '评论内容和评分不能为空' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: '评分必须在1-5星之间' });
    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ success: false, message: '美食不存在' });
    const existing = await Review.findOne({ foodId, userId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: '您已经评论过这个美食了，可以选择修改评论' });
    const review = await Review.create({ foodId, userId: req.user._id, content: content.trim(), rating: parseInt(rating) });
    await review.populate('userId', 'username avatar');
    await food.calculateRating();
    res.status(201).json({ success: true, message: '评论添加成功！', review, foodRating: { averageRating: food.averageRating, reviewsCount: food.reviewsCount } });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: '您已经评论过这个美食了' });
    res.status(500).json({ success: false, message: '添加评论失败，请稍后重试' });
  }
};

exports.update = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, rating } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: '评论不存在' });
    if (String(review.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: '只能修改自己的评论' });
    if (content) review.content = content.trim();
    if (rating) {
      if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: '评分必须在1-5星之间' });
      review.rating = parseInt(rating);
    }
    const updated = await review.save();
    await updated.populate('userId', 'username avatar');
    const food = await Food.findById(review.foodId); if (food) await food.calculateRating();
    res.json({ success: true, message: '评论更新成功！', review: updated });
  } catch (e) { res.status(500).json({ success: false, message: '更新评论失败' }); }
};

exports.remove = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: '评论不存在' });
    const isAuthor = String(review.userId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) return res.status(403).json({ success: false, message: '没有权限删除此评论' });
    const foodId = review.foodId; await Review.findByIdAndDelete(reviewId);
    const food = await Food.findById(foodId); if (food) await food.calculateRating();
    res.json({ success: true, message: '评论删除成功' });
  } catch (e) { res.status(500).json({ success: false, message: '删除评论失败' }); }
};

exports.toggleLike = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: '评论不存在' });
    const userId = req.user._id;
    const isLiked = review.likes.includes(userId);
    if (isLiked) {
      review.likes = review.likes.filter(id => String(id) !== String(userId));
    } else {
      review.likes.push(userId);
    }
    await review.save();
    res.json({ success: true, message: isLiked ? '取消点赞成功' : '点赞成功', isLiked: !isLiked, likesCount: review.likesCount });
  } catch (e) { res.status(500).json({ success: false, message: '操作失败' }); }
};
