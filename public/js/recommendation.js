// 今日推荐与历史推荐模块
import { App } from './app-core.js';

App.prototype.getTodayRecommendation = async function () {
  try {
    console.log('🎯 获取今日推荐...');
    const button = document.querySelector('.daily-recommendation-btn');
    const originalText = button?.textContent;
    if (button) { button.textContent = '🔄 推荐中...'; button.disabled = true; }

    const response = await fetch(`${this.apiUrl}/daily-recommendation`, { credentials: 'include' });
    const result = await response.json();

    if (button) { button.textContent = originalText; button.disabled = false; }

    if (response.ok && result.success) {
      this.showRecommendationModal(result.food, result.message, result.isNewRecommendation);
    } else {
      alert(result.message || '获取推荐失败，请稍后重试');
    }
  } catch (error) {
    console.error('❌ 获取今日推荐失败:', error);
    alert('网络错误，请稍后重试');
    const button = document.querySelector('.daily-recommendation-btn');
    if (button) { button.textContent = '🎯 今天吃什么'; button.disabled = false; }
  }
};

App.prototype.showRecommendationModal = function (food, message, isNewRecommendation) {
  const modal = document.createElement('div');
  modal.className = 'modal visible';
  modal.innerHTML = `
    <div class="modal-content recommendation-modal">
      <span class="close" data-close>&times;</span>
      <div class="recommendation-header">
        <h2>🎯 今日推荐</h2>
        ${isNewRecommendation ? '<span class="new-badge">新推荐</span>' : '<span class="today-badge">今日已推荐</span>'}
      </div>
      <div class="recommendation-content">
        <div class="recommended-food">
          <div class="food-icon">${food.emoji}</div>
          <div class="food-info">
            <h3>${food.name}</h3>
            <p class="food-category">${this.categoryEmojiMap[food.category]} ${food.category}</p>
            <p class="food-location">📍 ${food.location}</p>
            <p class="food-description">${food.description}</p>
          </div>
        </div>
        <div class="recommendation-message"><p>${message}</p></div>
        <div class="recommendation-rating">
          <span class="rating-stars">${this.renderStars(food.averageRating)}</span>
          <span class="rating-text">${Number(food.averageRating || 0).toFixed(1)} (${food.reviewsCount} 评价)</span>
        </div>
      </div>
      <div class="recommendation-actions">
        <button class="btn-secondary" data-history>查看历史推荐</button>
        <button class="btn-primary" data-view-id="${food._id}" data-view-name="${food.name}">查看详情</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) modal.remove();
    if (e.target.hasAttribute('data-history')) { this.showRecommendationHistory(); }
    if (e.target.hasAttribute('data-view-id')) { this.openReviewModal(e.target.getAttribute('data-view-id'), e.target.getAttribute('data-view-name')); modal.remove(); }
  });
};

App.prototype.showRecommendationHistory = async function () {
  try {
    console.log('📚 获取推荐历史...');
    const response = await fetch(`${this.apiUrl}/daily-recommendation/history?limit=30`, { credentials: 'include' });
    const result = await response.json();
    if (response.ok && result.success) {
      this.showHistoryModal(result.recommendations);
    } else {
      alert(result.message || '获取推荐历史失败');
    }
  } catch (error) {
    console.error('❌ 获取推荐历史失败:', error);
    alert('网络错误，请稍后重试');
  }
};

App.prototype.showHistoryModal = function (recommendations) {
  const modal = document.createElement('div');
  modal.className = 'modal visible';
  modal.innerHTML = `
    <div class="modal-content history-modal">
      <span class="close" data-close>&times;</span>
      <h2>📚 推荐历史</h2>
      <div class="history-content">
        ${recommendations.length === 0 ? '<p class="no-history">暂无推荐历史</p>' : recommendations.map(rec => `
          <div class="history-item">
            <div class="history-date">${rec.date}</div>
            <div class="history-food">
              <span class="food-emoji">${rec.food.emoji}</span>
              <span class="food-name">${rec.food.name}</span>
              <span class="food-category">${rec.food.category}</span>
            </div>
            <button class="btn-small" data-open-id="${rec.food._id}" data-open-name="${rec.food.name}">查看</button>
          </div>`).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" data-close>关闭</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) modal.remove();
    if (e.target.hasAttribute('data-open-id')) { this.openReviewModal(e.target.getAttribute('data-open-id'), e.target.getAttribute('data-open-name')); modal.remove(); }
  });
};
