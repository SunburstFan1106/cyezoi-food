// 学校菜单功能模块
import { App } from './app-core.js';

// 获取今日菜单
App.prototype.loadTodayMenu = async function () {
  try {
    console.log('📥 加载今日菜单...');
    const response = await fetch(`${this.apiUrl}/menu/today?mealType=lunch`, { 
      credentials: 'include' 
    });
    const result = await response.json();
    
    if (response.ok && result.success) {
      this.todayMenu = result.menu;
      console.log('✅ 今日菜单加载成功:', result.menu);
      return result.menu;
    } else {
      console.log('⚠️ 今日无菜单');
      this.todayMenu = null;
      return null;
    }
  } catch (error) {
    console.error('❌ 加载今日菜单失败:', error);
    this.todayMenu = null;
    return null;
  }
};

// 获取本周菜单
App.prototype.loadWeekMenu = async function () {
  try {
    console.log('📥 加载本周菜单...');
    const response = await fetch(`${this.apiUrl}/menu/week`, { 
      credentials: 'include' 
    });
    const result = await response.json();
    
    if (response.ok && result.success) {
      this.weekMenu = result.menus;
      console.log('✅ 本周菜单加载成功:', result.menus);
      return result.menus;
    } else {
      console.log('⚠️ 本周无菜单');
      this.weekMenu = [];
      return [];
    }
  } catch (error) {
    console.error('❌ 加载本周菜单失败:', error);
    this.weekMenu = [];
    return [];
  }
};

// 渲染今日菜单区域
App.prototype.renderTodayMenu = function () {
  if (!this.todayMenu || !this.todayMenu.dishes || this.todayMenu.dishes.length === 0) {
    return `
      <div class="menu-section">
        <h3>📅 今日菜单</h3>
        <div class="no-menu">
          <p>今日暂无菜单</p>
          <p class="menu-hint">请联系管理员更新菜单信息</p>
        </div>
      </div>
    `;
  }

  const dishesHtml = this.todayMenu.dishes.map(dish => {
    const food = dish.foodId;
    if (!food) return '';
    
    return `
      <div class="menu-dish-item" data-food-id="${food._id}">
        <div class="dish-info">
          <span class="dish-emoji">${food.emoji}</span>
          <div class="dish-details">
            <div class="dish-name">${food.name}</div>
            <div class="dish-meta">
              <span class="dish-category">${food.category}</span>
              ${dish.price > 0 ? `<span class="dish-price">¥${dish.price}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="dish-rating">
          <span class="rating-stars">${this.renderStars(food.averageRating)}</span>
          <span class="rating-text">${Number(food.averageRating || 0).toFixed(1)}</span>
        </div>
        <button class="btn-review" 
                data-food-id="${food._id}" 
                data-food-name="${food.name}"
                data-food-emoji="${food.emoji}"
                data-food-category="${food.category}"
                data-dish-price="${dish.price > 0 ? dish.price : ''}"
                data-food-rating="${food.averageRating || 0}">评价</button>
      </div>
    `;
  }).join('');

  const mealTypeText = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐'
  };

  return `
    <div class="menu-section">
      <h3>📅 今日菜单 - ${mealTypeText[this.todayMenu.mealType] || '午餐'}</h3>
      <div class="menu-date">
        ${new Date(this.todayMenu.date).toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })}
      </div>
      <div class="menu-dishes">
        ${dishesHtml}
      </div>
      <div class="menu-actions">
        <button class="btn-secondary" onclick="app.showWeekMenu()">查看本周菜单</button>
        ${this.currentUser && this.currentUser.role === 'admin' ? 
          `<button class="btn-primary" onclick="app.refreshMenu()">刷新菜单</button>` : ''}
      </div>
    </div>
  `;
};

// ✅ 新增：打开菜单评价模态框
App.prototype.openMenuReviewModal = async function (foodId, foodName, foodEmoji, foodCategory, dishPrice, foodRating) {
  if (!this.currentUser) {
    console.log('❌ 请先登录后再评价');
    this.showAuth();
    return;
  }
  
  this.currentFoodId = foodId;
  this.currentFoodName = foodName;
  this.currentRating = 0;

  // 设置模态框信息
  document.getElementById('menuModalTitle').textContent = `${foodName} - 菜单评价`;
  document.getElementById('menuDishEmoji').textContent = foodEmoji;
  document.getElementById('menuDishName').textContent = foodName;
  document.getElementById('menuDishCategory').textContent = foodCategory;
  document.getElementById('menuDishPrice').textContent = dishPrice ? `¥${dishPrice}` : '';
  
  // 设置评分显示
  const ratingContainer = document.querySelector('#menuDishRating');
  const starsSpan = ratingContainer.querySelector('.rating-stars');
  const textSpan = ratingContainer.querySelector('.rating-text');
  starsSpan.innerHTML = this.renderStars(foodRating);
  textSpan.textContent = Number(foodRating || 0).toFixed(1);

  // 显示模态框
  document.getElementById('menuReviewModal').style.display = 'block';
  this.resetMenuReviewForm();
  
  // 加载评论
  await this.loadMenuReviews(foodId);
};

// ✅ 新增：关闭菜单评价模态框
App.prototype.closeMenuReviewModal = function () {
  document.getElementById('menuReviewModal').style.display = 'none';
  this.currentFoodId = null;
  this.currentFoodName = null;
  this.currentRating = 0;
  this.reviewsPage = 1;
};

// ✅ 新增：重置菜单评价表单
App.prototype.resetMenuReviewForm = function () {
  document.getElementById('menuReviewContent').value = '';
  this.setMenuRating(0);
};

// ✅ 新增：设置菜单评价星级
App.prototype.setMenuRating = function (rating) {
  this.currentRating = rating;
  this.previewRating('menuStarRating', rating);
  this.updateRatingFeedback('menuRatingFeedback', rating);
};

// ✅ 新增：提交菜单评价
App.prototype.submitMenuReview = async function () {
  if (!this.currentUser) {
    console.log('❌ 请先登录');
    return;
  }
  
  if (!this.currentFoodId) {
    console.log('❌ 系统错误，请重新打开评价窗口');
    return;
  }

  const content = document.getElementById('menuReviewContent').value.trim();
  const rating = this.currentRating;
  
  if (!content) {
    console.log('❌ 请填写评价内容');
    return;
  }
  
  if (rating === 0) {
    console.log('❌ 请选择评分');
    return;
  }

  try {
    console.log('📤 提交菜单评价:', { foodId: this.currentFoodId, content, rating });
    const response = await fetch(`${this.apiUrl}/foods/${this.currentFoodId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, rating })
    });
    
    const result = await response.json();
    console.log('📡 菜单评价提交响应:', result);
    
    if (response.ok) {
      console.log('✅ 菜单评价提交成功');
      this.resetMenuReviewForm();
      await this.loadMenuReviews(this.currentFoodId);
      await this.loadTodayMenu();
      this.render();
    } else {
      console.log('❌ 菜单评价提交失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 提交菜单评价失败:', error);
  }
};

// ✅ 新增：加载菜单评价列表
App.prototype.loadMenuReviews = async function (foodId, page = 1) {
  try {
    console.log('📥 加载菜单评价:', foodId, 'page:', page);
    const response = await fetch(`${this.apiUrl}/foods/${foodId}/reviews?page=${page}&limit=5&sort=createdAt&order=desc`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 菜单评价加载成功:', result);
      this.currentReviews = result.reviews;
      this.reviewsPage = result.pagination.currentPage;
      this.reviewsTotal = result.pagination.totalReviews;
      this.renderMenuReviews();
      this.renderMenuReviewsPagination(result.pagination);
    } else {
      console.error('❌ 加载菜单评价失败');
      document.getElementById('menuReviewsList').innerHTML = '<div class="error">加载评价失败</div>';
    }
  } catch (error) {
    console.error('❌ 加载菜单评价错误:', error);
    document.getElementById('menuReviewsList').innerHTML = '<div class="error">网络连接失败</div>';
  }
};

// ✅ 新增：渲染菜单评价列表
App.prototype.renderMenuReviews = function () {
  const reviewsCount = document.getElementById('menuReviewsCount');
  const reviewsList = document.getElementById('menuReviewsList');
  
  reviewsCount.textContent = `共 ${this.reviewsTotal} 条评价`;
  
  if (this.currentReviews.length === 0) {
    reviewsList.innerHTML = '<div class="no-reviews">暂无评价，快来发表第一条评价吧！</div>';
    return;
  }
  
  reviewsList.innerHTML = this.currentReviews.map(review => this.renderMenuReviewItem(review)).join('');
};

// ✅ 新增：渲染单个菜单评价项
App.prototype.renderMenuReviewItem = function (review) {
  const isOwnReview = this.currentUser && review.userId._id === this.currentUser.id;
  const isAdmin = this.currentUser && this.currentUser.role === 'admin';
  const isLiked = review.likes && review.likes.includes(this.currentUser?.id);
  const createdAt = new Date(review.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
    <div class="review-item menu-review-item">
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
        <button class="like-btn ${isLiked ? 'liked' : ''}" data-like-id="${review._id}">
          ${isLiked ? '❤️' : '🤍'} ${review.likesCount || 0}
        </button>
        ${isOwnReview ? `<button class="edit-btn" data-edit-id="${review._id}">✏️ 编辑</button>` : ''}
        ${isOwnReview || isAdmin ? `<button class="delete-review-btn" data-del-id="${review._id}">🗑️ 删除</button>` : ''}
      </div>
    </div>
  `;
};

// ✅ 新增：渲染菜单评价分页
App.prototype.renderMenuReviewsPagination = function (pagination) {
  const paginationContainer = document.getElementById('menuReviewsPagination');
  
  if (pagination.totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let html = '';
  html += `<button ${pagination.currentPage === 1 ? 'disabled' : ''} data-menu-page="${pagination.currentPage - 1}">上一页</button>`;
  
  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<button class="${i === pagination.currentPage ? 'active' : ''}" data-menu-page="${i}">${i}</button>`;
  }
  
  html += `<button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} data-menu-page="${pagination.currentPage + 1}">下一页</button>`;
  
  paginationContainer.innerHTML = html;
};

// 显示本周菜单模态框
App.prototype.showWeekMenu = async function () {
  await this.loadWeekMenu();
  
  if (!this.weekMenu || this.weekMenu.length === 0) {
    return;
  }

  const weekMenuHtml = this.weekMenu.map(menu => {
    const mealTypeText = {
      breakfast: '早餐',
      lunch: '午餐', 
      dinner: '晚餐'
    };
    
    const dishesHtml = menu.dishes.map(dish => {
      const food = dish.foodId;
      if (!food) return '';
      
      return `
        <div class="week-menu-dish">
          <span class="dish-emoji">${food.emoji}</span>
          <span class="dish-name">${food.name}</span>
          <span class="dish-rating">${this.renderStars(food.averageRating)} ${Number(food.averageRating || 0).toFixed(1)}</span>
        </div>
      `;
    }).join('');
    
    return `
      <div class="week-menu-day">
        <div class="week-menu-header">
          <h4>${new Date(menu.date).toLocaleDateString('zh-CN', { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
          })} - ${mealTypeText[menu.mealType]}</h4>
        </div>
        <div class="week-menu-dishes">
          ${dishesHtml}
        </div>
      </div>
    `;
  }).join('');

  const modal = document.createElement('div');
  modal.className = 'modal week-menu-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>📅 本周菜单</h2>
        <span class="close" data-close>&times;</span>
      </div>
      <div class="modal-body">
        <div class="week-menu-container">
          ${weekMenuHtml}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" data-close>关闭</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) {
      modal.remove();
    }
  });
};

// 刷新菜单（手动触发爬虫）
App.prototype.refreshMenu = async function () {
  if (!this.currentUser || this.currentUser.role !== 'admin') {
    return;
  }

  try {
    console.log('🔄 触发菜单刷新...');
    const response = await fetch(`${this.apiUrl}/menu/crawl`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ 菜单刷新任务已启动');
      // 等待一段时间后重新加载菜单
      setTimeout(async () => {
        await this.loadTodayMenu();
        await this.loadFoods();
        this.render();
      }, 5000);
    } else {
      console.error('❌ 菜单刷新失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 菜单刷新请求失败:', error);
  }
};

// ✅ 修改：绑定菜单相关事件
App.prototype.bindMenuEvents = function () {
  console.log('🍽️ 开始绑定菜单评价按钮事件...');
  
  // 菜单菜品评价按钮
  const reviewBtns = document.querySelectorAll('.btn-review[data-food-id]');
  console.log(`找到 ${reviewBtns.length} 个菜单评价按钮`);
  
  reviewBtns.forEach((btn, index) => {
    console.log(`绑定第 ${index + 1} 个评价按钮:`, btn.dataset.foodName);
    
    btn.addEventListener('click', (e) => {
      console.log('🔥 菜单评价按钮被点击:', e.target.dataset.foodName);
      
      const foodId = e.target.dataset.foodId;
      const foodName = e.target.dataset.foodName;
      const foodEmoji = e.target.dataset.foodEmoji;
      const foodCategory = e.target.dataset.foodCategory;
      const dishPrice = e.target.dataset.dishPrice;
      const foodRating = e.target.dataset.foodRating;
      
      this.openMenuReviewModal(foodId, foodName, foodEmoji, foodCategory, dishPrice, foodRating);
    });
  });
  
  console.log('✅ 菜单评价按钮事件绑定完成');
};