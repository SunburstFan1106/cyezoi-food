// 事件绑定与委托模块
import { App } from './app-core.js';

App.prototype.bindEvents = function () {
  // 认证表单
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleAuth(e); });
    const toggle = document.getElementById('toggleAuthLink');
    if (toggle) toggle.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthMode(); });
    const back = document.getElementById('backToMain');
    if (back) back.addEventListener('click', (e) => { e.preventDefault(); this.showMainView(); });
  }

  // 主视图按钮
  const showAuthBtn = document.getElementById('showAuthBtn');
  if (showAuthBtn) showAuthBtn.addEventListener('click', () => this.showAuth());
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

  // 搜索/筛选
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', () => this.handleSearch());
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) categoryFilter.addEventListener('change', (e) => this.handleFilter(e.target.value));

  // 今日推荐 & 新增美食
  const todayBtn = document.getElementById('todayBtn');
  if (todayBtn) todayBtn.addEventListener('click', () => this.getTodayRecommendation());
  const addFoodBtn = document.getElementById('addFoodBtn');
  if (addFoodBtn) addFoodBtn.addEventListener('click', () => this.openAddFoodModal());
  
  // 管理员管理公告
  const adminAnnounceBtn = document.getElementById('adminAnnounceBtn');
  if (adminAnnounceBtn) {
    adminAnnounceBtn.addEventListener('click', () => {
      import('./announcements.js').then(module => {
        module.showAdminAnnouncementModal();
      });
    });
  }

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

  // 评论模态外部点击关闭
  const modal = document.getElementById('reviewModal');
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this.closeReviewModal(); });
  const editModal = document.getElementById('editReviewModal');
  if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) this.closeEditReviewModal(); });

  // 绑定星级评分
  this.bindStarRating('starRating', (rating) => this.setRating(rating));
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
};
