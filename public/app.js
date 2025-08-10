/* filepath: /Users/fengzhifan/cyezoi-food/public/app.js */
class App {
    constructor() {
        this.foods = [];
        this.currentUser = null;
        this.currentView = 'main';
        this.authMode = 'login';
        this.apiUrl = 'http://127.0.0.1:8000/api';
        this.currentFoodId = null;
        this.currentFoodName = null;
        this.currentRating = 0;
        this.currentReviews = [];
        this.reviewsPage = 1;
        this.reviewsTotal = 0;
        this.editingReviewId = null;
        this.editRating = 0;

        // 新增: 添加美食相关
        this.addFoodModalVisible = false;
        this.validCategories = ['面食', '快餐', '饮品', '小吃', '早餐', '其他'];
        this.categoryEmojiMap = {
            '面食': '🍜',
            '快餐': '🍔',
            '饮品': '🧋',
            '小吃': '🍗',
            '早餐': '🥞',
            '其他': '🍽️'
        };

        this.init();
    }

    async init() {
        console.log('🚀 应用初始化开始...');
        await this.checkAuth();
        if (this.currentUser) {
            await this.loadFoods();
        }
        this.render();
        this.bindEvents();
        console.log('✅ 应用初始化完成');
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/me`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.user;
                this.currentView = 'main';
                console.log('✅ 用户已登录:', this.currentUser.username);
            } else {
                this.currentView = 'auth';
                console.log('❌ 用户未登录');
            }
        } catch (error) {
            console.error('❌ 检查登录状态失败:', error);
            this.currentView = 'auth';
        }
    }

    async loadFoods() {
        try {
            console.log('📥 加载美食数据...');
            const response = await fetch(`${this.apiUrl}/foods`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.foods = await response.json();
                console.log(`✅ 成功加载 ${this.foods.length} 个美食数据`);
            } else {
                console.error('❌ 加载美食数据失败');
                this.foods = [];
            }
        } catch (error) {
            console.error('❌ 网络请求失败:', error);
            this.foods = [];
        }
    }

    render() {
        const root = document.getElementById('app-root') || document.body;
        let html = '';
        if (this.currentUser) {
            html = this.renderMain();
        } else {
            html = this.renderAuth();
        }
        root.innerHTML = html;
    }

    renderAuth() {
        const isLogin = this.authMode === 'login';
        return `
            <div class="auth-container">
                <form class="auth-form" id="authForm">
                    <h2 class="auth-title">${isLogin ? '🍔 登录' : '📝 注册'}</h2>
                    
                    ${!isLogin ? `
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" name="username" class="form-input" required>
                        </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label class="form-label">邮箱</label>
                        <input type="email" name="email" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" name="password" class="form-input" required>
                    </div>
                    
                    <button type="submit" class="auth-btn">
                        ${isLogin ? '登录' : '注册'}
                    </button>
                    
                    <div class="auth-switch">
                        ${isLogin ? '还没有账户？' : '已有账户？'}
                        <a href="#" onclick="app.toggleAuthMode()">
                            ${isLogin ? '立即注册' : '立即登录'}
                        </a>
                    </div>
                    
                    <a href="#" class="back-btn" onclick="app.showMainView()">返回主页</a>
                </form>
            </div>
        `;
    }

    renderMain() {
        if (!this.currentUser) {
            return `
                <div class="container">
                    <div class="header">
                        <h1>🍔 曹杨二中美食评分系统</h1>
                        <div style="text-align: center; margin-top: 20px;">
                            <button onclick="app.showAuth()" class="auth-btn" style="width: auto; padding: 15px 30px;">
                                登录 / 注册
                            </button>
                        </div>
                    </div>
                    ${this.renderFoodsGrid()}
                </div>
            `;
        }

        return `
            <div class="container">
                <div class="header">
                    <h1>🍔 曹杨二中美食评分系统</h1>
                    <div class="user-info">
                        <div class="user-profile">
                            <div class="user-avatar">${this.currentUser.avatar}</div>
                            <span>欢迎，${this.currentUser.username}!</span>
                            ${this.currentUser.role === 'admin' ? '<span style="color:#e74c3c;">👑 管理员</span>' : ''}
                        </div>
                        <button class="logout-btn" onclick="app.logout()">退出登录</button>
                    </div>
                </div>

                <div class="controls">
                    <input type="text" class="search-box" id="searchInput" placeholder="搜索美食、位置...">
                    <select class="filter-select" id="categoryFilter">
                        <option value="all">全部类别</option>
                        ${this.validCategories.map(c => `<option value="${c}">${this.categoryEmojiMap[c]} ${c}</option>`).join('')}
                    </select>
                    <button class="add-food-btn" onclick="app.openAddFoodModal()">+ 推荐美食</button>
                </div>

                ${this.renderFoodsGrid()}
            </div>

            ${this.renderAddFoodModal()}
        `;
    }

    // 新增: 添加美食模态框 HTML
    renderAddFoodModal() {
        if (!this.addFoodModalVisible) return '';
        return `
            <div class="modal visible" id="addFoodModal">
                <div class="modal-content">
                    <span class="close" onclick="app.closeAddFoodModal()">&times;</span>
                    <h2>➕ 推荐美食</h2>
                    <form id="addFoodForm" class="food-form">
                        <div class="form-group">
                            <label>名称</label>
                            <input type="text" name="name" required maxlength="50" placeholder="请输入美食名称">
                        </div>
                        <div class="form-group">
                            <label>类别</label>
                            <select name="category" required>
                                <option value="">请选择</option>
                                ${this.validCategories.map(c => `<option value="${c}">${this.categoryEmojiMap[c]} ${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>位置</label>
                            <input type="text" name="location" required maxlength="80" placeholder="档口 / 楼层 / 周边位置">
                        </div>
                        <div class="form-group">
                            <label>描述</label>
                            <textarea name="description" required maxlength="200" placeholder="简单介绍一下这个美食..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>自动表情 (可修改)</label>
                            <input type="text" name="emoji" maxlength="4" value="🍽️">
                        </div>
                        <div id="addFoodError" class="form-error" style="display:none;"></div>
                        <div class="form-actions">
                            <button type="button" onclick="app.closeAddFoodModal()">取消</button>
                            <button type="submit" class="primary">提交</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    openAddFoodModal() {
        if (!this.currentUser) {
            alert('请先登录');
            this.showAuth();
            return;
        }
        this.addFoodModalVisible = true;
        this.render();
        this.bindEvents();
    }

    closeAddFoodModal() {
        this.addFoodModalVisible = false;
        this.render();
        this.bindEvents();
    }

    // 替换旧 showAddFoodForm 逻辑
    async submitNewFood(formElement) {
        const formData = new FormData(formElement);
        const name = formData.get('name').trim();
        const category = formData.get('category').trim();
        const location = formData.get('location').trim();
        const description = formData.get('description').trim();
        const emojiInput = formData.get('emoji').trim();

        const errorEl = document.getElementById('addFoodError');
        const showError = (msg) => {
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = msg;
            } else {
                alert(msg);
            }
        };

        errorEl && (errorEl.style.display = 'none');

        if (!name || !category || !location || !description) {
            showError('请填写所有必填字段');
            return;
        }
        if (!this.validCategories.includes(category)) {
            showError('类别不合法');
            return;
        }

        // 若用户未改 emoji，自动按类别填
        const emoji = emojiInput || this.categoryEmojiMap[category] || '🍽️';

        const payload = { name, category, location, description, emoji };

        console.log('📤 创建美食(表单):', payload);

        try {
            const response = await fetch(`${this.apiUrl}/foods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));
            console.log('📡 创建响应:', result);

            if (!response.ok) {
                // 如果后端仍提示缺少统计字段, 再补一次默认值自动重试
                if (result?.message?.includes('缺少必要字段')) {
                    const withStats = {
                        ...payload,
                        averageRating: 0,
                        reviewsCount: 0,
                        totalRating: 0,
                        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
                    };
                    console.log('♻️ 重试携带统计字段:', withStats);
                    const retryResp = await fetch(`${this.apiUrl}/foods`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(withStats)
                    });
                    const retryResult = await retryResp.json().catch(() => ({}));
                    console.log('📡 重试响应:', retryResult);
                    if (!retryResp.ok) {
                        showError(retryResult.message || '创建失败');
                        return;
                    }
                    alert('美食添加成功！');
                    if (retryResult.food && retryResult.food._id) {
                        this.foods.push(retryResult.food);
                    } else {
                        await this.loadFoods();
                    }
                    this.closeAddFoodModal();
                    this.render();
                    this.bindEvents();
                    return;
                }

                showError(result.message || '创建失败');
                return;
            }

            alert('美食添加成功！');
            if (result.food && result.food._id) {
                this.foods.push(result.food);
            } else {
                await this.loadFoods();
            }
            this.closeAddFoodModal();
            this.render();
            this.bindEvents();
        } catch (e) {
            console.error('❌ 创建失败:', e);
            showError('网络错误，请稍后再试');
        }
    }

    bindEvents() {
        // 认证表单提交
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAuth(e);
            });
        }

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.handleSearch();
            });
        }

        // 分类筛选
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleFilter(e.target.value);
            });
        }

        // 评论表单提交
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReview();
            });
        }

        // 编辑评论表单提交
        const editReviewForm = document.getElementById('editReviewForm');
        if (editReviewForm) {
            editReviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateReview();
            });
        }

        // 新增评论星级评分点击事件
        this.bindStarRating('starRating', (rating) => {
            this.setRating(rating);
        });

        // 编辑评论星级评分点击事件
        this.bindStarRating('editStarRating', (rating) => {
            this.setEditRating(rating);
        });

        // 模态框外部点击关闭
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeReviewModal();
                }
            });
        }

        const editModal = document.getElementById('editReviewModal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.closeEditReviewModal();
                }
            });
        }

        // 添加美食表单提交
        const addFoodForm = document.getElementById('addFoodForm');
        if (addFoodForm) {
            addFoodForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitNewFood(addFoodForm);
            });

            // 类别选择联动 emoji（若用户没手动改）
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
    }

    // 绑定星级评分事件的通用方法
    bindStarRating(starRatingId, callback) {
        const starRating = document.getElementById(starRatingId);
        if (!starRating) return;

        const stars = starRating.querySelectorAll('.star');
        
        stars.forEach(star => {
            // 点击事件
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                callback(rating);
            });
            
            // 悬停预览
            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.previewRating(starRatingId, rating);
            });
        });

        // 鼠标离开重置预览
        starRating.addEventListener('mouseleave', () => {
            const currentRating = starRatingId === 'starRating' ? this.currentRating : this.editRating;
            this.previewRating(starRatingId, currentRating);
        });
    }

    // 认证相关方法
    async handleAuth(e) {
        const formData = new FormData(e.target);
        const isLogin = this.authMode === 'login';
        
        const userData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        if (!isLogin) {
            userData.username = formData.get('username');
        }

        console.log('📤 发送认证请求:', { ...userData, password: '[隐藏]' });

        try {
            const response = await fetch(`${this.apiUrl}/auth/${isLogin ? 'login' : 'register'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            console.log('📡 服务器响应:', result);

            if (response.ok) {
                this.currentUser = result.user;
                this.currentView = 'main';
                alert(result.message);
                await this.loadFoods();
                this.render();
                this.bindEvents();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('❌ 认证请求失败:', error);
            alert('网络连接失败，请重试');
        }
    }

    toggleAuthMode() {
        this.authMode = this.authMode === 'login' ? 'register' : 'login';
        this.render();
        this.bindEvents();
    }

    showAuth() {
        this.currentView = 'auth';
        this.render();
        this.bindEvents();
    }

    showMainView() {
        this.currentView = 'main';
        this.render();
        this.bindEvents();
    }

    async logout() {
        try {
            await fetch(`${this.apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            this.currentUser = null;
            this.currentView = 'auth';
            this.render();
            this.bindEvents();
            alert('已安全退出登录');
        } catch (error) {
            console.error('❌ 退出登录失败:', error);
        }
    }

    // 搜索和筛选
    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const foodCards = document.querySelectorAll('.food-card');
        
        foodCards.forEach(card => {
            const foodName = card.querySelector('.food-name').textContent.toLowerCase();
            const foodCategory = card.dataset.category.toLowerCase();
            const foodLocation = card.querySelector('.food-meta span').textContent.toLowerCase();
            
            if (foodName.includes(searchTerm) || 
                foodCategory.includes(searchTerm) || 
                foodLocation.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    handleFilter(category) {
        const foodCards = document.querySelectorAll('.food-card');
        
        foodCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // 评论系统方法
    async openReviewModal(foodId, foodName) {
        this.currentFoodId = foodId;
        document.getElementById('modalTitle').textContent = `${foodName} - 评价`;
        
        // 检查用户是否登录
        if (!this.currentUser) {
            alert('请先登录后再查看评价');
            this.showAuth();
            return;
        }

        // 显示模态框
        document.getElementById('reviewModal').style.display = 'block';
        
        // 重置评论表单
        this.resetReviewForm();
        
        // 加载评论
        await this.loadReviews(foodId);
    }

    closeReviewModal() {
        document.getElementById('reviewModal').style.display = 'none';
        this.currentFoodId = null;
        this.currentRating = 0;
        this.reviewsPage = 1;
    }

    resetReviewForm() {
        document.getElementById('reviewContent').value = '';
        this.setRating(0);
    }

    setRating(rating) {
        this.currentRating = rating;
        this.previewRating('starRating', rating);
        this.updateRatingFeedback('ratingFeedback', rating);
    }

    setEditRating(rating) {
        this.editRating = rating;
        this.previewRating('editStarRating', rating);
        this.updateRatingFeedback('editRatingFeedback', rating);
    }

    previewRating(starRatingId, rating) {
        const stars = document.querySelectorAll(`#${starRatingId} .star`);
        stars.forEach((star, index) => {
            star.classList.remove('active', 'preview');
            if (index < rating) {
                star.classList.add('active');
            }
        });
    }

    updateRatingFeedback(feedbackId, rating) {
        const feedback = document.getElementById(feedbackId);
        if (!feedback) return;

        const ratingTexts = {
            0: '请选择评分',
            1: '⭐ 非常不满意',
            2: '⭐⭐ 不太满意',
            3: '⭐⭐⭐ 一般般',
            4: '⭐⭐⭐⭐ 比较满意',
            5: '⭐⭐⭐⭐⭐ 非常满意'
        };

        const ratingClasses = {
            0: '',
            1: 'terrible',
            2: 'poor',
            3: 'average',
            4: 'good',
            5: 'excellent'
        };

        feedback.textContent = ratingTexts[rating];
        feedback.className = 'rating-feedback ' + (ratingClasses[rating] || '');
        
        if (rating > 0) {
            feedback.classList.add('selected');
        }
    }

    async submitReview() {
        if (!this.currentUser) {
            alert('请先登录');
            return;
        }

        if (!this.currentFoodId) {
            alert('系统错误，请重新打开评论窗口');
            return;
        }

        const content = document.getElementById('reviewContent').value.trim();
        const rating = this.currentRating;

        if (!content) {
            alert('请填写评论内容');
            return;
        }

        if (rating === 0) {
            alert('请选择评分');
            return;
        }

        try {
            console.log('📤 提交评论:', { foodId: this.currentFoodId, content, rating });
            
            const response = await fetch(`${this.apiUrl}/foods/${this.currentFoodId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ content, rating })
            });

            const result = await response.json();
            console.log('📡 评论提交响应:', result);

            if (response.ok) {
                alert(result.message);
                this.resetReviewForm();
                await this.loadReviews(this.currentFoodId);
                await this.loadFoods(); // 重新加载美食数据以更新评分
                this.render();
                this.bindEvents();
                // 重新打开模态框
                setTimeout(() => {
                    this.openReviewModal(this.currentFoodId, '当前美食');
                }, 100);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('❌ 提交评论失败:', error);
            alert('提交评论失败，请检查网络连接');
        }
    }

    async loadReviews(foodId, page = 1) {
        try {
            console.log('📥 加载评论:', foodId, 'page:', page);
            
            const response = await fetch(`${this.apiUrl}/foods/${foodId}/reviews?page=${page}&limit=5&sort=createdAt&order=desc`, {
                credentials: 'include'
            });

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
    }

    renderReviews() {
        const reviewsCount = document.getElementById('reviewsCount');
        const reviewsList = document.getElementById('reviewsList');

        reviewsCount.textContent = `共 ${this.reviewsTotal} 条评价`;

        if (this.currentReviews.length === 0) {
            reviewsList.innerHTML = '<div class="no-reviews">暂无评价，快来发表第一条评价吧！</div>';
            return;
        }

        reviewsList.innerHTML = this.currentReviews.map(review => this.renderReviewItem(review)).join('');
    }

    renderReviewItem(review) {
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
                    <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="app.toggleReviewLike('${review._id}')">
                        ${isLiked ? '❤️' : '🤍'} ${review.likesCount || 0}
                    </button>
                    ${isOwnReview ? `<button class="edit-btn" onclick="app.openEditReviewModal('${review._id}')">✏️ 编辑</button>` : ''}
                    ${(isOwnReview || isAdmin) ? `<button class="delete-review-btn" onclick="app.deleteReview('${review._id}')">🗑️ 删除</button>` : ''}
                </div>
            </div>
        `;
    }

    renderReviewsPagination(pagination) {
        const paginationContainer = document.getElementById('reviewsPagination');
        
        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';
        
        // 上一页按钮
        html += `
            <button ${pagination.currentPage === 1 ? 'disabled' : ''} 
                    onclick="app.loadReviews('${this.currentFoodId}', ${pagination.currentPage - 1})">
                上一页
            </button>
        `;

        // 页码按钮
        for (let i = 1; i <= pagination.totalPages; i++) {
            html += `
                <button class="${i === pagination.currentPage ? 'active' : ''}"
                        onclick="app.loadReviews('${this.currentFoodId}', ${i})">
                    ${i}
                </button>
            `;
        }

        // 下一页按钮
        html += `
            <button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} 
                    onclick="app.loadReviews('${this.currentFoodId}', ${pagination.currentPage + 1})">
                下一页
            </button>
        `;

        paginationContainer.innerHTML = html;
    }

    // 编辑评论功能
    async openEditReviewModal(reviewId) {
        this.editingReviewId = reviewId;
        
        // 找到要编辑的评论
        const review = this.currentReviews.find(r => r._id === reviewId);
        if (!review) {
            alert('找不到要编辑的评论');
            return;
        }

        // 显示编辑模态框
        document.getElementById('editReviewModal').style.display = 'block';
        
        // 填入原有内容
        document.getElementById('editReviewContent').value = review.content;
        this.setEditRating(review.rating);

        // 重新绑定编辑表单的事件
        this.bindStarRating('editStarRating', (rating) => {
            this.setEditRating(rating);
        });
    }

    closeEditReviewModal() {
        document.getElementById('editReviewModal').style.display = 'none';
        this.editingReviewId = null;
        this.editRating = 0;
        document.getElementById('editReviewContent').value = '';
    }

    async updateReview() {
        if (!this.editingReviewId) {
            alert('系统错误，请重新打开编辑窗口');
            return;
        }

        const content = document.getElementById('editReviewContent').value.trim();
        const rating = this.editRating;

        if (!content) {
            alert('请填写评论内容');
            return;
        }

        if (rating === 0) {
            alert('请选择评分');
            return;
        }

        try {
            console.log('📤 更新评论:', { reviewId: this.editingReviewId, content, rating });
            
            const response = await fetch(`${this.apiUrl}/reviews/${this.editingReviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ content, rating })
            });

            const result = await response.json();
            console.log('📡 评论更新响应:', result);

            if (response.ok) {
                alert(result.message);
                this.closeEditReviewModal();
                await this.loadReviews(this.currentFoodId, this.reviewsPage);
                await this.loadFoods(); // 重新加载美食数据以更新评分
                this.render();
                this.bindEvents();
                // 重新打开评论模态框
                setTimeout(() => {
                    this.openReviewModal(this.currentFoodId, '当前美食');
                }, 100);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('❌ 更新评论失败:', error);
            alert('更新评论失败，请检查网络连接');
        }
    }

    async toggleReviewLike(reviewId) {
        if (!this.currentUser) {
            alert('请先登录');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/reviews/${reviewId}/like`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                // 重新加载当前页的评论
                await this.loadReviews(this.currentFoodId, this.reviewsPage);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('❌ 点赞失败:', error);
            alert('操作失败，请重试');
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('确定要删除这条评论吗？')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/reviews/${reviewId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                await this.loadReviews(this.currentFoodId, this.reviewsPage);
                await this.loadFoods(); // 更新美食评分
                this.render();
                this.bindEvents();
                // 重新打开模态框
                setTimeout(() => {
                    this.openReviewModal(this.currentFoodId, '当前美食');
                }, 100);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('❌ 删除评论失败:', error);
            alert('删除失败，请重试');
        }
    }

    // 美食管理
    // 找到 showAddFoodForm 方法并完全替换为以下代码：

    async showAddFoodForm() {
        if (!this.currentUser) {
            alert('请先登录');
            this.showAuth();
            return;
        }

        const name = prompt('请输入美食名称:');
        if (!name || !name.trim()) return;

        const category = prompt('请输入美食类别 (面食/快餐/饮品/小吃/早餐/其他):');
        if (!category || !category.trim()) return;

        const validCategories = ['面食', '快餐', '饮品', '小吃', '早餐', '其他'];
        const normalizedCategory = category.trim();
        if (!validCategories.includes(normalizedCategory)) {
            alert('请输入有效的美食类别: ' + validCategories.join('、'));
            return;
        }

        const location = prompt('请输入位置:');
        if (!location || !location.trim()) return;

        const description = prompt('请输入描述:');
        if (!description || !description.trim()) return;

        const categoryEmojiMap = {
            '面食': '🍜',
            '快餐': '🍔',
            '饮品': '🧋',
            '小吃': '🍗',
            '早餐': '🥞',
            '其他': '🍽️'
        };

        const basePayload = {
            name: name.trim(),
            category: normalizedCategory,
            location: location.trim(),
            description: description.trim(),
            emoji: categoryEmojiMap[normalizedCategory] || '🍽️'
        };

        // 可能缺的统计类字段默认值（猜测后端要求）
        const statDefaults = {
            averageRating: 0,
            reviewsCount: 0,
            totalRating: 0,
            ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            // 若后端要求列表：
            reviews: []
        };

        const tryCreate = async (payload, phase) => {
            console.log(`📤 创建美食(${phase}):`, payload);
            const response = await fetch(`${this.apiUrl}/foods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));
            console.log(`📡 创建响应(${phase}):`, result);
            return { response, result };
        };

        try {
            // 第一次：最小字段
            let { response, result } = await tryCreate(basePayload, '最小字段');

            // 如果提示缺少必要字段，再带上推测的默认统计字段重试一次
            if (!response.ok && result?.message && result.message.includes('缺少必要字段')) {
                const extendedPayload = { ...basePayload, ...statDefaults };
                ({ response, result } = await tryCreate(extendedPayload, '含默认统计字段重试'));
            }

            if (!response.ok) {
                alert(`添加失败: ${result.message || '服务器返回错误'}`);
                return;
            }

            alert('美食添加成功！');

            if (result.food && result.food._id) {
                this.foods.push(result.food);
            } else {
                await this.loadFoods();
            }

            this.render();
            this.bindEvents();
        } catch (e) {
            console.error('❌ 创建失败:', e);
            alert('网络错误，稍后再试');
        }
    }

    // 找到 showEditFoodForm 方法并完全替换为以下代码：
    async deleteFood(foodId) {
        if (!confirm('确定要删除这个美食吗？此操作不可恢复！')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/foods/${foodId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                await this.loadFoods();
                this.render();
                this.bindEvents();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('❌ 删除美食失败:', error);
            alert('删除失败，请检查网络连接');
        }
    }

    // 渲染美食网格
    renderFoodsGrid() {
        if (!Array.isArray(this.foods) || this.foods.length === 0) {
            return `
                <div class="empty">
                    <p>暂无美食数据，${this.currentUser ? '点击“+ 推荐美食”添加第一条吧！' : '请先登录或注册。'}</p>
                </div>
            `;
        }

        return `
            <div class="foods-grid">
                ${this.foods.map(f => this.renderFoodCard(f)).join('')}
            </div>
        `;
    }

    // 单个美食卡片
    renderFoodCard(food) {
        const id = food._id || food.id;
        const name = food.name || '未命名';
        const category = food.category || '其他';
        const location = food.location || '未知位置';
        const desc = (food.description || '').slice(0, 60);
        const avg = (food.averageRating ?? 0).toFixed
            ? (food.averageRating || 0).toFixed(1)
            : food.averageRating || 0;
        const reviewsCount = food.reviewsCount ?? food.reviews?.length ?? 0;
        const emoji = food.emoji || this.categoryEmojiMap[category] || '🍽️';
        const canDelete = this.currentUser && this.currentUser.role === 'admin';

        return `
            <div class="food-card" data-category="${category}">
                <div class="food-emoji">${emoji}</div>
                <h3 class="food-name">${name}</h3>
                <div class="food-meta">
                    <span>${category}</span>
                    <span>${location}</span>
                </div>
                <div class="food-stats">
                    <span>⭐ ${avg}</span>
                    <span>💬 ${reviewsCount}</span>
                </div>
                <p class="food-desc">${desc}</p>
                <div class="food-actions">
                    <button onclick="app.openReviewModal('${id}','${name.replace(/'/g, '')}')">
                        查看 / 评价
                    </button>
                    ${canDelete ? `<button class="danger" onclick="app.deleteFood('${id}')">删除</button>` : ''}
                </div>
            </div>
        `;
    }
}

// 全局函数
function closeReviewModal() {
    app.closeReviewModal();
}

function closeEditReviewModal() {
    app.closeEditReviewModal();
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM加载完成，启动应用...');
    if (!window.app) {
        window.app = new App();
    }
});