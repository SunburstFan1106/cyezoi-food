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
        <button class="btn-review" data-food-id="${food._id}" data-food-name="${food.name}">评价</button>
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

// 绑定菜单相关事件
App.prototype.bindMenuEvents = function () {
  // 菜单菜品评价按钮
  document.querySelectorAll('.btn-review[data-food-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const foodId = e.target.dataset.foodId;
      const foodName = e.target.dataset.foodName;
      this.openReviewModal(foodId, foodName);
    });
  });
};