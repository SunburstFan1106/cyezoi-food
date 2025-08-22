// 评论系统模块
import { App } from './app-core.js';

// 绑定星级评分通用
App.prototype.bindStarRating = function (starRatingId, callback) {
  const starRating = document.getElementById(starRatingId);
  if (!starRating) return;
  const stars = starRating.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      const rating = parseInt(e.target.dataset.rating);
      callback(rating);
    });
    star.addEventListener('mouseover', (e) => {
      const rating = parseInt(e.target.dataset.rating);
      this.previewRating(starRatingId, rating);
    });
  });
  starRating.addEventListener('mouseleave', () => {
    const currentRating = starRatingId === 'starRating' ? this.currentRating : this.editRating;
    this.previewRating(starRatingId, currentRating);
  });
};

App.prototype.previewRating = function (starRatingId, rating) {
  const stars = document.querySelectorAll(`#${starRatingId} .star`);
  stars.forEach((star, index) => {
    star.classList.remove('active', 'preview');
    if (index < rating) star.classList.add('active');
  });
};

App.prototype.updateRatingFeedback = function (feedbackId, rating) {
  const feedback = document.getElementById(feedbackId);
  if (!feedback) return;
  const ratingTexts = {
    0: '请选择评分', 1: '⭐ 非常不满意', 2: '⭐⭐ 不太满意', 3: '⭐⭐⭐ 一般般', 4: '⭐⭐⭐⭐ 比较满意', 5: '⭐⭐⭐⭐⭐ 非常满意'
  };
  const ratingClasses = { 0: '', 1: 'terrible', 2: 'poor', 3: 'average', 4: 'good', 5: 'excellent' };
  feedback.textContent = ratingTexts[rating];
  feedback.className = 'rating-feedback ' + (ratingClasses[rating] || '');
  if (rating > 0) feedback.classList.add('selected');
};

App.prototype.renderStars = function (rating) {
  if (!rating || rating <= 0) return '<span class="no-rating">暂无评分</span>';
  const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));
  return '⭐'.repeat(normalizedRating);
};

App.prototype.setRating = function (rating) {
  this.currentRating = rating;
  this.previewRating('starRating', rating);
  this.updateRatingFeedback('ratingFeedback', rating);
};

App.prototype.setEditRating = function (rating) {
  this.editRating = rating;
  this.previewRating('editStarRating', rating);
  this.updateRatingFeedback('editRatingFeedback', rating);
};

App.prototype.openReviewModal = async function (foodId, foodName) {
  this.currentFoodId = foodId;
  document.getElementById('modalTitle').textContent = `${foodName} - 评价`;
  if (!this.currentUser) {
    alert('请先登录后再查看评价');
    this.showAuth();
    return;
  }
  document.getElementById('reviewModal').style.display = 'block';
  this.resetReviewForm();
  await this.loadReviews(foodId);
};

App.prototype.closeReviewModal = function () {
  document.getElementById('reviewModal').style.display = 'none';
  this.currentFoodId = null;
  this.currentRating = 0;
  this.reviewsPage = 1;
};

App.prototype.resetReviewForm = function () {
  document.getElementById('reviewContent').value = '';
  this.setRating(0);
};

App.prototype.submitReview = async function () {
  if (!this.currentUser) { alert('请先登录'); return; }
  if (!this.currentFoodId) { alert('系统错误，请重新打开评论窗口'); return; }

  const content = document.getElementById('reviewContent').value.trim();
  const rating = this.currentRating;
  if (!content) { alert('请填写评论内容'); return; }
  if (rating === 0) { alert('请选择评分'); return; }

  try {
    console.log('📤 提交评论:', { foodId: this.currentFoodId, content, rating });
    const response = await fetch(`${this.apiUrl}/foods/${this.currentFoodId}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ content, rating })
    });
    const result = await response.json();
    console.log('📡 评论提交响应:', result);
    if (response.ok) {
      alert(result.message);
      this.resetReviewForm();
      await this.loadReviews(this.currentFoodId);
      await this.loadFoods();
      this.render();
      this.bindEvents();
      setTimeout(() => { this.openReviewModal(this.currentFoodId, '当前美食'); }, 100);
    } else {
      alert(result.message || '提交失败');
    }
  } catch (error) {
    console.error('❌ 提交评论失败:', error);
    alert('提交评论失败，请检查网络连接');
  }
};

App.prototype.loadReviews = async function (foodId, page = 1) {
  try {
    console.log('📥 加载评论:', foodId, 'page:', page);
    const response = await fetch(`${this.apiUrl}/foods/${foodId}/reviews?page=${page}&limit=5&sort=createdAt&order=desc`, { credentials: 'include' });
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 评论加载成功:', result);
      this.currentReviews = result.reviews;
      this.reviewsPage = result.pagination.currentPage;
      this.reviewsTotal = result.pagination.totalReviews;
      this.renderReviews();
      this.renderReviewsPagination(result.pagination);
    } else {
      console.error('❌ 加载评论失败');
      document.getElementById('reviewsList').innerHTML = '<div class="error">加载评论失败</div>';
    }
  } catch (error) {
    console.error('❌ 加载评论错误:', error);
    document.getElementById('reviewsList').innerHTML = '<div class="error">网络连接失败</div>';
  }
};

App.prototype.renderReviews = function () {
  const reviewsCount = document.getElementById('reviewsCount');
  const reviewsList = document.getElementById('reviewsList');
  reviewsCount.textContent = `共 ${this.reviewsTotal} 条评价`;
  if (this.currentReviews.length === 0) {
    reviewsList.innerHTML = '<div class="no-reviews">暂无评价，快来发表第一条评价吧！</div>';
    return;
  }
  reviewsList.innerHTML = this.currentReviews.map(review => this.renderReviewItem(review)).join('');
};

App.prototype.renderReviewItem = function (review) {
  const isOwnReview = this.currentUser && review.userId._id === this.currentUser.id;
  const isAdmin = this.currentUser && this.currentUser.role === 'admin';
  const isLiked = review.likes && review.likes.includes(this.currentUser?.id);
  const createdAt = new Date(review.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `
    <div class="review-item">
      <div class="review-header">
        <div class="review-author">
          <div class="review-author-avatar">${review.userId.avatar || '👤'}</div>
          <div>
            <div style="font-weight: bold;">${review.userId.username}</div>
            <div class="review-meta">${createdAt}</div>
          </div>
        </div>
        <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
      </div>
      <div class="review-content">${review.content}</div>
      <div class="review-actions">
        <button class="like-btn ${isLiked ? 'liked' : ''}" data-like-id="${review._id}">${isLiked ? '❤️' : '🤍'} ${review.likesCount || 0}</button>
        ${isOwnReview ? `<button class="edit-btn" data-edit-id="${review._id}">✏️ 编辑</button>` : ''}
        ${isOwnReview || isAdmin ? `<button class="delete-review-btn" data-del-id="${review._id}">🗑️ 删除</button>` : ''}
      </div>
    </div>
  `;
};

App.prototype.renderReviewsPagination = function (pagination) {
  const paginationContainer = document.getElementById('reviewsPagination');
  if (pagination.totalPages <= 1) { paginationContainer.innerHTML = ''; return; }
  let html = '';
  html += `<button ${pagination.currentPage === 1 ? 'disabled' : ''} data-page="${pagination.currentPage - 1}">上一页</button>`;
  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<button class="${i === pagination.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} data-page="${pagination.currentPage + 1}">下一页</button>`;
  paginationContainer.innerHTML = html;
};

App.prototype.openEditReviewModal = async function (reviewId) {
  this.editingReviewId = reviewId;
  const review = this.currentReviews.find(r => r._id === reviewId);
  if (!review) { alert('找不到要编辑的评论'); return; }
  document.getElementById('editReviewModal').style.display = 'block';
  document.getElementById('editReviewContent').value = review.content;
  this.setEditRating(review.rating);
  this.bindStarRating('editStarRating', (rating) => this.setEditRating(rating));
};

App.prototype.closeEditReviewModal = function () {
  document.getElementById('editReviewModal').style.display = 'none';
  this.editingReviewId = null;
  this.editRating = 0;
  document.getElementById('editReviewContent').value = '';
};

App.prototype.updateReview = async function () {
  if (!this.editingReviewId) { alert('系统错误，请重新打开编辑窗口'); return; }
  let content = document.getElementById('editReviewContent').value.trim();
  let rating = this.editRating;
  if (!content) { alert('请填写评论内容'); return; }
  if (rating === 0) { alert('请选择评分'); return; }
  try {
    console.log('📤 更新评论:', { reviewId: this.editingReviewId, content, rating });
    const response = await fetch(`${this.apiUrl}/reviews/${this.editingReviewId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ content, rating })
    });
    const result = await response.json();
    console.log('📡 评论更新响应:', result);
    if (response.ok) {
      alert(result.message);
      this.closeEditReviewModal();
      await this.loadReviews(this.currentFoodId, this.reviewsPage);
      await this.loadFoods();
      this.render();
      this.bindEvents();
      setTimeout(() => { this.openReviewModal(this.currentFoodId, '当前美食'); }, 100);
    } else {
      alert(result.message || '更新失败');
    }
  } catch (error) {
    console.error('❌ 更新评论失败:', error);
    alert('更新评论失败，请检查网络连接');
  }
};

App.prototype.toggleReviewLike = async function (reviewId) {
  if (!this.currentUser) { alert('请先登录'); return; }
  try {
    const response = await fetch(`${this.apiUrl}/reviews/${reviewId}/like`, { method: 'POST', credentials: 'include' });
    const result = await response.json();
    if (response.ok) {
      await this.loadReviews(this.currentFoodId, this.reviewsPage);
    } else {
      alert(result.message || '操作失败');
    }
  } catch (error) {
    console.error('❌ 点赞失败:', error);
    alert('操作失败，请重试');
  }
};

App.prototype.deleteReview = async function (reviewId) {
  if (!confirm('确定要删除这条评论吗？')) return;
  try {
    const response = await fetch(`${this.apiUrl}/reviews/${reviewId}`, { method: 'DELETE', credentials: 'include' });
    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      await this.loadReviews(this.currentFoodId, this.reviewsPage);
      await this.loadFoods();
      this.render();
      this.bindEvents();
      setTimeout(() => { this.openReviewModal(this.currentFoodId, '当前美食'); }, 100);
    } else {
      alert(result.message || '删除失败');
    }
  } catch (error) {
    console.error('❌ 删除评论失败:', error);
    alert('删除失败，请重试');
  }
};
