// 美食列表与增删改模块
import { App } from './app-core.js';

App.prototype.loadFoods = async function () {
  try {
    console.log('📥 加载美食数据...');
    const response = await fetch(`${this.apiUrl}/foods`, { credentials: 'include' });
    if (response.ok) {
      const allFoods = await response.json();
      
      // ✅ 修复：过滤掉食堂菜品，只保留周边美食
      this.foods = allFoods.filter(food => {
        const location = (food.location || '').toLowerCase();
        
        // 排除食堂相关的菜品
        const isCanteenFood = location.includes('食堂') || 
                             location.includes('曹杨二中') ||
                             location.includes('学校') ||
                             location.includes('canteen') ||
                             location.includes('cafeteria');
        
        return !isCanteenFood;
      });
      
      console.log(`✅ 成功加载 ${this.foods.length} 个周边美食数据 (已排除 ${allFoods.length - this.foods.length} 个食堂菜品)`);
    } else {
      console.error('❌ 加载美食数据失败');
      this.foods = [];
    }
  } catch (error) {
    console.error('❌ 网络请求失败:', error);
    this.foods = [];
  }
};

App.prototype.renderMain = function () {
  if (!this.currentUser) {
    return `
      <div class="container">
        <div class="header">
          <h1>曹杨二中周边美食</h1>
          <div style="text-align: center; margin-top: 20px;">
            <button id="showAuthBtn" class="auth-btn" style="width: auto; padding: 15px 30px;">登录 / 注册</button>
          </div>
        </div>
        ${this.renderFoodsGrid()}
      </div>
    `;
  }

  return `
    <div class="container">
      <div class="header">
        <h1>曹杨二中周边美食</h1>
        <div class="user-info">
          <div class="user-profile">
            <div class="user-avatar">${this.currentUser.avatar}</div>
            <span>欢迎，${this.currentUser.username}!</span>
            ${this.currentUser.role === 'admin' ? '<span style="color:#e74c3c;">👑 管理员</span>' : ''}
          </div>
          <button class="logout-btn" id="logoutBtn">退出登录</button>
        </div>
      </div>

      ${this.renderTodayMenu()}

      <div class="controls">
        <input type="text" class="search-box" id="searchInput" placeholder="搜索美食、位置...">
        <select class="filter-select" id="categoryFilter">
          <option value="all">全部类别</option>
          ${this.validCategories.map(c => `<option value="${c}">${this.categoryEmojiMap[c]} ${c}</option>`).join('')}
        </select>
        <button class="daily-recommendation-btn" id="todayBtn">🎯 今天吃什么</button>
        <button class="add-food-btn" id="addFoodBtn">+ 推荐美食</button>
        ${this.currentUser.role === 'admin' ? '<button class="admin-announce-btn" id="adminAnnounceBtn">📢 管理公告</button>' : ''}
      </div>

      <!-- ✅ 修复：明确标示这是周边美食区域 -->
      <div class="section-header">
        <h2>🏪 周边美食推荐</h2>
        <p class="section-description">发现学校周边的特色餐厅和美食小店</p>
      </div>
      
      ${this.renderFoodsGrid()}
    </div>

    ${this.renderAddFoodModal()}
  `;
};

App.prototype.renderFoodsGrid = function () {
  if (!Array.isArray(this.foods) || this.foods.length === 0) {
    return `
      <div class="empty">
        <p>暂无周边美食数据，${this.currentUser ? '点击"+ 推荐美食"添加第一条吧！' : '请先登录或注册。'}</p>
        <p class="hint">💡 提示：食堂菜品请在上方"今日菜单"区域查看</p>
      </div>
    `;
  }
  return `
    <div class="foods-grid">
      ${this.foods.map(f => this.renderFoodCard(f)).join('')}
    </div>
  `;
};

App.prototype.renderFoodCard = function (food) {
  const id = food._id || food.id;
  const name = food.name || '未命名';
  const category = food.category || '其他';
  const location = food.location || '未知位置';
  const desc = (food.description || '').slice(0, 60);
  const avg = (food.averageRating ?? 0).toFixed ? (food.averageRating || 0).toFixed(1) : food.averageRating || 0;
  const reviewsCount = food.reviewsCount ?? food.reviews?.length ?? 0;
  const emoji = food.emoji || this.categoryEmojiMap[category] || '🍽️';
  const contributorId = food.createdBy?._id || food.createdBy || food.recommendedBy;
  const contributorName = food.createdByName || food.createdBy?.username || food.createdBy?.email || '匿名';
  const isOwner = this.currentUser && contributorId && String(contributorId) === String(this.currentUser.id);
  const canEdit = isOwner;
  const canDelete = this.currentUser && (this.currentUser.role === 'admin' || isOwner);

  return `
    <div class="food-card" data-category="${category}">
      <div class="food-emoji">${emoji}</div>
      <h3 class="food-name">${name}</h3>
      <div class="food-meta">
        <span>${category}</span>
        <span>${location}</span>
      </div>
      <div class="food-meta" style="margin-top:4px; font-size:10px; opacity:.75;">
        <span>贡献者: ${contributorName}</span>
      </div>
      <div class="food-stats">
        <span>⭐ ${avg}</span>
        <span>💬 ${reviewsCount}</span>
      </div>
      <p class="food-desc">${desc}</p>
      <div class="food-actions">
        <button class="view-btn" data-id="${id}" data-name="${name.replace(/'/g, '')}">查看 / 评价</button>
        ${canEdit ? `<button class="edit-food-btn" data-id="${id}">编辑</button>` : ''}
        ${canDelete ? `<button class="danger delete-food-btn" data-id="${id}">删除</button>` : ''}
      </div>
    </div>
  `;
};

App.prototype.openAddFoodModal = function () {
  if (!this.currentUser) {
    alert('请先登录');
    this.showAuth();
    return;
  }
  this.addFoodModalVisible = true;
  this.render();
  this.bindEvents();
};

App.prototype.closeAddFoodModal = function () {
  this.addFoodModalVisible = false;
  this.render();
  this.bindEvents();
};

App.prototype.renderAddFoodModal = function () {
  if (!this.addFoodModalVisible) return '';
  return `
    <div class="modal" style="display:block;">
      <div class="modal-content food-form">
        <span class="close" id="closeAddFood">&times;</span>
        <h2>推荐周边美食</h2>
        <form id="addFoodForm">
          <div class="form-group">
            <label>美食名称</label>
            <input type="text" name="name" required maxlength="50" placeholder="例如：阿姨奶茶、重庆小面">
          </div>
          <div class="form-group">
            <label>类别</label>
            <select name="category" required>
              <option value="">请选择类别</option>
              ${this.validCategories.map(c => `<option value="${c}">${this.categoryEmojiMap[c]} ${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>位置</label>
            <input type="text" name="location" required maxlength="80" placeholder="具体店铺位置，如：学校东门对面、XX路XX号">
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea name="description" required maxlength="200" placeholder="简单介绍一下这个美食的特色、口味、价格等..."></textarea>
          </div>
          <div class="form-group">
            <label>自动表情 (可修改)</label>
            <input type="text" name="emoji" maxlength="4" value="🍽️">
          </div>
          <div id="addFoodError" class="form-error" style="display:none;"></div>
          <div class="form-actions">
            <button type="button" id="cancelAddFood">取消</button>
            <button type="submit" class="primary">提交</button>
          </div>
        </form>
      </div>
    </div>
  `;
};

App.prototype.submitNewFood = async function (formElement) {
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

  const emoji = emojiInput || this.categoryEmojiMap[category] || '🍽️';
  const payload = { name, category, location, description, emoji };
  console.log('📤 创建美食(表单):', payload);

  try {
    const response = await fetch(`${this.apiUrl}/foods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    console.log('📡 创建响应:', result);

    if (!response.ok) {
      if (result?.message?.includes('缺少必要字段')) {
        const withStats = {
          ...payload,
          averageRating: 0,
          reviewsCount: 0,
          totalRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
        console.log('♻️ 重试携带统计字段:', withStats);
        const retryResp = await fetch(`${this.apiUrl}/foods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(withStats),
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
};

App.prototype.openEditFoodModal = async function (foodId) {
  const food = this.foods.find(f => f._id === foodId);
  if (!food) {
    alert('找不到要编辑的美食');
    return;
  }
  const ownerId = food.createdBy?._id || food.createdBy || food.recommendedBy;
  if (!(this.currentUser && (this.currentUser.role === 'admin' || (ownerId && String(ownerId) === String(this.currentUser.id))))) {
    alert('无权限编辑该美食');
    return;
  }

  const name = prompt('请输入新的美食名称:', food.name);
  if (!name || !name.trim()) return;

  const category = prompt('请输入新的美食类别 (面食/快餐/饮品/小吃/早餐/其他):', food.category);
  if (!category || !category.trim()) return;

  const validCategories = ['面食', '快餐', '饮品', '小吃', '早餐', '其他'];
  const normalizedCategory = category.trim();
  if (!validCategories.includes(normalizedCategory)) {
    alert('请输入有效的美食类别: ' + validCategories.join('、'));
    return;
  }

  const location = prompt('请输入新的位置:', food.location);
  if (!location || !location.trim()) return;

  const description = prompt('请输入新的描述:', food.description);
  if (!description || !description.trim()) return;

  const payload = { name: name.trim(), category: normalizedCategory, location: location.trim(), description: description.trim() };

  try {
    const response = await fetch(`${this.apiUrl}/foods/${foodId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (response.ok) {
      alert('美食信息更新成功！');
      await this.loadFoods();
      this.render();
      this.bindEvents();
    } else {
      alert(result.message || '更新失败');
    }
  } catch (error) {
    console.error('❌ 更新美食失败:', error);
    alert('更新失败，请检查网络连接');
  }
};

App.prototype.deleteFood = async function (foodId) {
  const food = this.foods.find(f => f._id === foodId);
  if (!food) {
    console.log('❌ 找不到要删除的美食');
    return;
  }
  
  const ownerId = food?.createdBy?._id || food?.createdBy || food?.recommendedBy;
  if (!(this.currentUser && (this.currentUser.role === 'admin' || (ownerId && String(ownerId) === String(this.currentUser.id))))) {
    console.log('❌ 无权限删除该美食');
    return;
  }
  
  // ✅ 调用自定义确认对话框
  const confirmed = await this.showDeleteConfirm(food.name);
  if (!confirmed) return;

  try {
    console.log('🗑️ 删除美食:', foodId);
    const response = await fetch(`${this.apiUrl}/foods/${foodId}`, { 
      method: 'DELETE', 
      credentials: 'include' 
    });
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 删除成功:', result.message);
      await this.loadFoods();
      this.render();
    } else {
      console.error('❌ 删除失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 删除美食失败:', error);
  }
};

// ✅ 新增：自定义删除确认对话框
App.prototype.showDeleteConfirm = function (foodName) {
  return new Promise((resolve) => {
    // 创建自定义确认对话框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px; text-align: center;">
        <h3>⚠️ 确认删除</h3>
        <p>确定要删除美食「<strong>${foodName}</strong>」吗？</p>
        <p style="color: #999; font-size: 14px;">此操作不可恢复！</p>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <button id="confirmDeleteBtn" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">确认删除</button>
          <button id="cancelDeleteBtn" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">取消</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    const confirmBtn = modal.querySelector('#confirmDeleteBtn');
    const cancelBtn = modal.querySelector('#cancelDeleteBtn');
    
    const cleanup = () => {
      modal.remove();
    };
    
    confirmBtn.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
        resolve(false);
      }
    });
  });
};

// 搜索与筛选
App.prototype.handleSearch = function () {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const foodCards = document.querySelectorAll('.food-card');
  foodCards.forEach(card => {
    const foodName = card.querySelector('.food-name').textContent.toLowerCase();
    const foodCategory = card.dataset.category.toLowerCase();
    const foodLocation = card.querySelector('.food-meta span').textContent.toLowerCase();
    if (foodName.includes(searchTerm) || foodCategory.includes(searchTerm) || foodLocation.includes(searchTerm)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
};

App.prototype.handleFilter = function (category) {
  const foodCards = document.querySelectorAll('.food-card');
  foodCards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
};

// 在 public/js/app-core.js 的 init 函数中添加菜单加载
App.prototype.init = async function () {
  console.log("🚀 应用初始化开始...");
  await this.checkAuth();
  if (this.currentUser) {
    await this.loadFoods();
    await this.loadTodayMenu(); // 添加这一行
  }
  this.render();
  this.bindEvents();
  console.log("✅ 应用初始化完成");
};
