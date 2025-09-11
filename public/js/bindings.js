// 事件绑定与委托模块
import { App } from './app-core.js';

// 完整的事件绑定实现
App.prototype.bindEvents = function () {
  console.log('🔗 开始绑定事件...');

  // ✅ 修复：认证相关事件绑定
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', (e) => { 
      e.preventDefault(); 
      this.handleAuth(e);  // ✅ 传递 event 对象，而不是 form 元素
    });
    const toggle = document.getElementById('toggleAuthLink');
    if (toggle) toggle.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthMode(); });
    const back = document.getElementById('backToMain');
    if (back) back.addEventListener('click', () => this.backToMain());
  }

  // 主界面按钮
  const showAuthBtn = document.getElementById('showAuthBtn');
  if (showAuthBtn) showAuthBtn.addEventListener('click', () => this.showAuth());
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

  // 搜索和过滤
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', (e) => this.searchFoods(e.target.value));
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) categoryFilter.addEventListener('change', (e) => this.filterByCategory(e.target.value));

  // 推荐按钮
  const todayBtn = document.getElementById('todayBtn');
  if (todayBtn) todayBtn.addEventListener('click', () => this.getDailyRecommendation());
  const addFoodBtn = document.getElementById('addFoodBtn');
  if (addFoodBtn) addFoodBtn.addEventListener('click', () => this.openAddFoodModal());

  // 管理员公告按钮
  const adminAnnounceBtn = document.getElementById('adminAnnounceBtn');
  if (adminAnnounceBtn) {
    import('./announcements.js').then(module => {
      adminAnnounceBtn.addEventListener('click', () => {
        module.showAdminAnnouncementModal();
      });
    });
  }

  // ✅ 菜单相关事件绑定 - 确保在DOM更新后调用
  this.bindMenuEvents();

  // Foods 区域事件委托
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => this.openReviewModal(btn.dataset.id, btn.dataset.name));
  });
  document.querySelectorAll('.edit-food-btn').forEach(btn => {
    btn.addEventListener('click', () => this.openEditFoodModal(btn.dataset.id));
  });
  document.querySelectorAll('.delete-food-btn').forEach(btn => {
    btn.addEventListener('click', () => this.deleteFood(btn.dataset.id));
  });

  // 新增美食表单
  const addFoodForm = document.getElementById('addFoodForm');
  if (addFoodForm) {
    addFoodForm.addEventListener('submit', (e) => { e.preventDefault(); this.submitNewFood(addFoodForm); });
    const close = document.getElementById('closeAddFood');
    if (close) close.addEventListener('click', () => this.closeAddFoodModal());
    const cancel = document.getElementById('cancelAddFood');
    if (cancel) cancel.addEventListener('click', () => this.closeAddFoodModal());
    const categorySelect = addFoodForm.querySelector('select[name="category"]');
    const emojiInput = addFoodForm.querySelector('input[name="emoji"]');
    if (categorySelect && emojiInput) {
      categorySelect.addEventListener('change', () => {
        if (!emojiInput.value || Object.values(this.categoryEmojiMap).includes(emojiInput.value)) {
          emojiInput.value = this.categoryEmojiMap[categorySelect.value] || '🍽️';
        }
      });
    }
  }

  // 美食评论表单提交事件
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitReview();
    });
  }

  // ✅ 菜单评论表单提交事件
  const menuReviewForm = document.getElementById('menuReviewForm');
  if (menuReviewForm) {
    menuReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitMenuReview();
    });
  }

  // 编辑评论表单提交事件
  const editReviewForm = document.getElementById('editReviewForm');
  if (editReviewForm) {
    editReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateReview();
    });
  }

  // ✅ 修复：模态框关闭按钮事件绑定
  const closeReviewBtn = document.getElementById('closeReviewModalBtn');
  if (closeReviewBtn) {
    closeReviewBtn.addEventListener('click', () => this.closeReviewModal());
  }

  const closeMenuReviewBtn = document.getElementById('closeMenuReviewModalBtn');
  if (closeMenuReviewBtn) {
    closeMenuReviewBtn.addEventListener('click', () => this.closeMenuReviewModal());
  }

  const closeEditReviewBtn = document.getElementById('closeEditReviewModalBtn');
  if (closeEditReviewBtn) {
    closeEditReviewBtn.addEventListener('click', () => this.closeEditReviewModal());
  }

  // 评论模态外部点击关闭
  const modal = document.getElementById('reviewModal');
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this.closeReviewModal(); });
  
  // ✅ 菜单评论模态外部点击关闭
  const menuModal = document.getElementById('menuReviewModal');
  if (menuModal) menuModal.addEventListener('click', (e) => { if (e.target === menuModal) this.closeMenuReviewModal(); });
  
  const editModal = document.getElementById('editReviewModal');
  if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) this.closeEditReviewModal(); });

  // 绑定星级评分
  this.bindStarRating('starRating', (rating) => this.setRating(rating));
  
  // ✅ 绑定菜单评分星级
  this.bindStarRating('menuStarRating', (rating) => this.setMenuRating(rating));
  
  this.bindStarRating('editStarRating', (rating) => this.setEditRating(rating));

  // 评论列表按钮(委托)
  document.querySelectorAll('[data-like-id]').forEach(btn => {
    btn.addEventListener('click', () => this.toggleReviewLike(btn.dataset.likeId));
  });
  document.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', () => this.openEditReviewModal(btn.dataset.editId));
  });
  document.querySelectorAll('[data-del-id]').forEach(btn => {
    btn.addEventListener('click', () => this.deleteReview(btn.dataset.delId));
  });

  // 评论分页
  const pagination = document.getElementById('reviewsPagination');
  if (pagination) {
    pagination.querySelectorAll('button').forEach(btn => {
      const page = btn.getAttribute('data-page');
      if (page) btn.addEventListener('click', () => this.loadReviews(this.currentFoodId, Number(page)));
    });
  }

  // ✅ 菜单评论分页
  const menuPagination = document.getElementById('menuReviewsPagination');
  if (menuPagination) {
    menuPagination.querySelectorAll('button').forEach(btn => {
      const page = btn.getAttribute('data-menu-page');
      if (page) btn.addEventListener('click', () => this.loadMenuReviews(this.currentFoodId, Number(page)));
    });
  }

  console.log('✅ 事件绑定完成');
};

// 星级评分绑定辅助函数
App.prototype.bindStarRating = function (containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const stars = container.querySelectorAll('.star');
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      callback(rating);
    });
    
    star.addEventListener('mouseenter', () => {
      this.previewRating(containerId, index + 1);
    });
  });
  
  container.addEventListener('mouseleave', () => {
    const currentRating = containerId.includes('edit') ? this.editRating : this.currentRating;
    this.previewRating(containerId, currentRating);
  });
};

// 添加全局关闭函数
window.closeReviewModal = function() {
  if (window.app) {
    window.app.closeReviewModal();
  }
};

// ✅ 菜单评价模态框关闭函数
window.closeMenuReviewModal = function() {
  if (window.app) {
    window.app.closeMenuReviewModal();
  }
};

window.closeEditReviewModal = function() {
  if (window.app) {
    window.app.closeEditReviewModal();
  }
};
