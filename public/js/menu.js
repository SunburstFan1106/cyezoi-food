// 学校菜单功能模块
import { App } from './app-core.js';

// 获取今日所有餐次菜单
App.prototype.loadTodayMenu = async function () {
  try {
    console.log('📥 加载今日菜单...');
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${this.apiUrl}/menu/day/${today}`, { 
      credentials: 'include' 
    });
    const result = await response.json();
    
    if (response.ok && result.success) {
      this.todayMenus = result.menus || [];
      console.log('✅ 今日菜单加载成功:', result.menus);
      return result.menus;
    } else {
      console.log('⚠️ 今日无菜单');
      this.todayMenus = [];
      return [];
    }
  } catch (error) {
    console.error('❌ 加载今日菜单失败:', error);
    this.todayMenus = [];
    return [];
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

// 渲染今日菜单区域 - 支持多餐次
App.prototype.renderTodayMenu = function () {
  if (!this.todayMenus || this.todayMenus.length === 0) {
    return `
      <div class="menu-section">
        <h3>📅 今日菜单</h3>
        <div class="no-menu">
          <p>今日暂无菜单</p>
          <p class="menu-hint">请联系管理员更新菜单信息</p>
          ${this.currentUser && this.currentUser.role === 'admin' ? 
            `<button class="btn-primary add-menu-btn" onclick="app.showAddMenuModal()">➕ 添加菜单</button>` : ''}
        </div>
      </div>
    `;
  }

  const mealTypeText = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐'
  };

  const mealTypeOrder = ['breakfast', 'lunch', 'dinner'];
  
  // 按餐次顺序组织菜单
  const organizedMenus = {};
  this.todayMenus.forEach(menu => {
    organizedMenus[menu.mealType] = menu;
  });

  const menusHtml = mealTypeOrder.map(mealType => {
    const menu = organizedMenus[mealType];
    
    if (!menu || !menu.dishes || menu.dishes.length === 0) {
      return `
        <div class="meal-section" data-meal-type="${mealType}">
          <div class="meal-header">
            <h4>${getMealEmoji(mealType)} ${mealTypeText[mealType]}</h4>
          </div>
          <div class="no-dishes">
            <p>暂无${mealTypeText[mealType]}菜单</p>
            ${this.currentUser && this.currentUser.role === 'admin' ? 
              `<button class="btn-sm btn-primary" onclick="app.showAddMenuModal('${mealType}')">添加${mealTypeText[mealType]}</button>` : ''}
          </div>
        </div>
      `;
    }

    const dishesHtml = menu.dishes.map(dish => {
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
                  data-food-rating="${food.averageRating || 0}">评价</button>
        </div>
      `;
    }).join('');

    return `
      <div class="meal-section" data-meal-type="${mealType}">
        <div class="meal-header">
          <h4>${getMealEmoji(mealType)} ${mealTypeText[mealType]}</h4>
          ${this.currentUser && this.currentUser.role === 'admin' ? 
            `<button class="btn-sm edit-meal-btn" onclick="app.showEditMealModal('${menu._id}', '${mealType}')">✏️ 编辑</button>` : ''}
        </div>
        <div class="meal-dishes">
          ${dishesHtml}
        </div>
      </div>
    `;
  }).join('');

  // 获取今天的日期
  const today = new Date();
  
  function getMealEmoji(mealType) {
    const emojiMap = {
      breakfast: '🌅',
      lunch: '🌞', 
      dinner: '🌙'
    };
    return emojiMap[mealType] || '🍽️';
  }

  return `
    <div class="menu-section">
      <div class="menu-header">
        <h3>📅 今日菜单</h3>
        <div class="menu-date">
          ${today.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>
      
      <div class="daily-meals">
        ${menusHtml}
      </div>
      
      <div class="menu-actions">
        <button class="btn-secondary" onclick="app.showWeekMenu()">查看本周菜单</button>
        ${this.currentUser && this.currentUser.role === 'admin' ? 
          `<button class="btn-primary" onclick="app.refreshMenu()">刷新菜单</button>
           <button class="btn-primary add-daily-menu-btn" onclick="app.showAddDailyMenuModal()">➕ 添加完整菜单</button>` : ''}
      </div>
    </div>
  `;
};

// 显示添加完整日菜单模态框
App.prototype.showAddDailyMenuModal = function () {
  if (!this.currentUser || this.currentUser.role !== 'admin') {
    console.log('❌ 只有管理员可以添加菜单');
    alert('只有管理员可以添加菜单');
    return;
  }

  console.log('📝 显示添加完整日菜单模态框');

  const modal = document.createElement('div');
  modal.className = 'modal add-daily-menu-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>➕ 添加完整日菜单</h2>
        <span class="close" data-close>&times;</span>
      </div>
      <div class="modal-body">
        <form id="addDailyMenuForm">
          <div class="form-group">
            <label for="dailyMenuDate">日期：</label>
            <input type="date" id="dailyMenuDate" required>
          </div>
          
          <div class="meals-section">
            <div class="meal-input-section">
              <h4>🌅 早餐</h4>
              <textarea id="breakfastInput" rows="4" placeholder="请输入早餐菜品，每行一个，例如：
豆浆
包子
鸡蛋
粥"></textarea>
            </div>
            
            <div class="meal-input-section">
              <h4>🌞 午餐</h4>
              <textarea id="lunchInput" rows="6" placeholder="请输入午餐菜品，每行一个，例如：
红烧肉
青菜炒蛋
米饭
汤"></textarea>
            </div>
            
            <div class="meal-input-section">
              <h4>🌙 晚餐</h4>
              <textarea id="dinnerInput" rows="5" placeholder="请输入晚餐菜品，每行一个，例如：
炒面
小菜
汤
水果"></textarea>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" data-close>取消</button>
            <button type="submit" class="btn-primary">添加完整菜单</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // 设置默认日期为今天
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dailyMenuDate').value = today;

  // 显示模态框
  setTimeout(() => {
    modal.classList.add('visible');
  }, 10);

  // 绑定关闭事件
  const closeModal = () => {
    modal.classList.remove('visible');
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 200);
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) {
      closeModal();
    }
  });

  // 绑定表单提交事件
  document.getElementById('addDailyMenuForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('📝 提交添加完整日菜单表单');
    
    try {
      await this.submitAddDailyMenu();
      closeModal();
    } catch (error) {
      console.error('❌ 提交失败:', error);
    }
  });
};

// 提交添加完整日菜单
App.prototype.submitAddDailyMenu = async function () {
  const date = document.getElementById('dailyMenuDate').value;
  const breakfastInput = document.getElementById('breakfastInput').value.trim();
  const lunchInput = document.getElementById('lunchInput').value.trim();
  const dinnerInput = document.getElementById('dinnerInput').value.trim();

  if (!date) {
    alert('请选择日期');
    return;
  }

  if (!breakfastInput && !lunchInput && !dinnerInput) {
    alert('请至少添加一个餐次的菜品');
    return;
  }

  console.log('📝 准备提交完整日菜单数据:', { date, breakfastInput, lunchInput, dinnerInput });

  try {
    // 显示加载状态
    const submitBtn = document.querySelector('#addDailyMenuForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '处理中...';
    submitBtn.disabled = true;

    const meals = {};

    // 处理早餐
    if (breakfastInput) {
      const breakfastDishes = await this.processDishNames(breakfastInput);
      if (breakfastDishes.length > 0) {
        meals.breakfast = breakfastDishes;
      }
    }

    // 处理午餐
    if (lunchInput) {
      const lunchDishes = await this.processDishNames(lunchInput);
      if (lunchDishes.length > 0) {
        meals.lunch = lunchDishes;
      }
    }

    // 处理晚餐
    if (dinnerInput) {
      const dinnerDishes = await this.processDishNames(dinnerInput);
      if (dinnerDishes.length > 0) {
        meals.dinner = dinnerDishes;
      }
    }

    if (Object.keys(meals).length === 0) {
      alert('所有菜品处理失败！请检查菜品名称。');
      return;
    }

    console.log('📤 准备提交完整日菜单到后端:', { date, meals });

    // 调用后端API添加菜单
    const response = await fetch(`${this.apiUrl}/menu/admin/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        date,
        meals
      })
    });

    const result = await response.json();
    console.log('📥 后端响应:', result);

    if (response.ok && result.success) {
      console.log('✅ 完整日菜单添加成功');
      alert(result.message || '完整日菜单添加成功！');
      
      // 重新加载菜单数据
      await this.loadTodayMenu();
      this.render();
    } else {
      console.error('❌ 完整日菜单添加失败:', result.message);
      alert('完整日菜单添加失败：' + (result.message || '未知错误'));
    }

  } catch (error) {
    console.error('❌ 添加完整日菜单请求失败:', error);
    alert('网络错误，请稍后重试: ' + error.message);
  } finally {
    // 恢复按钮状态
    const submitBtn = document.querySelector('#addDailyMenuForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
};

// 处理菜品名称列表
App.prototype.processDishNames = async function (dishInput) {
  const dishNames = dishInput.split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  const dishes = [];
  
  for (const dishName of dishNames) {
    try {
      const food = await this.findOrCreateFood(dishName);
      if (food && food._id) {
        dishes.push({
          foodId: food._id,
          price: 0,
          availability: true
        });
        console.log(`✅ 菜品处理成功: ${dishName}`);
      } else {
        console.warn(`⚠️ 菜品处理失败: ${dishName}`);
      }
    } catch (error) {
      console.error(`❌ 处理菜品 "${dishName}" 时出错:`, error);
    }
  }
  
  return dishes;
};

// 显示本周菜单模态框
App.prototype.showWeekMenu = async function () {
  await this.loadWeekMenu();
  
  if (!this.weekMenu || this.weekMenu.length === 0) {
    alert('暂无本周菜单数据');
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
  modal.style.display = 'flex';
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
  
  // 显示模态框
  setTimeout(() => {
    modal.classList.add('visible');
  }, 10);

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) {
      modal.classList.remove('visible');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
      }, 200);
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
      alert('菜单刷新任务已启动，请稍后查看结果');
      // 等待一段时间后重新加载菜单
      setTimeout(async () => {
        await this.loadTodayMenu();
        this.render();
      }, 3000);
    } else {
      console.error('❌ 菜单刷新失败:', result.message);
      alert('菜单刷新失败：' + result.message);
    }
  } catch (error) {
    console.error('❌ 菜单刷新请求失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 绑定菜单相关事件
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
      const foodRating = e.target.dataset.foodRating;
      
      // 调用普通的评价模态框，不需要特殊的菜单评价模态框
      this.openReviewModal(foodId, foodName);
    });
  });
  
  console.log('✅ 菜单评价按钮事件绑定完成');
};

// 显示编辑菜单模态框
App.prototype.showEditMenuModal = async function (menuId) {
  if (!this.currentUser || this.currentUser.role !== 'admin') {
    console.log('❌ 只有管理员可以编辑菜单');
    alert('只有管理员可以编辑菜单');
    return;
  }

  console.log('📝 显示编辑菜单模态框，菜单ID:', menuId);

  try {
    // 获取菜单详情
    const response = await fetch(`${this.apiUrl}/menu/${menuId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('获取菜单详情失败');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '获取菜单详情失败');
    }
    
    const menu = result.menu;
    console.log('📋 获取到菜单详情:', menu);
    
    // 构建菜品列表文本
    const dishesText = menu.dishes.map(dish => {
      return dish.foodId ? dish.foodId.name : '';
    }).filter(name => name).join('\n');

    const modal = document.createElement('div');
    modal.className = 'modal edit-menu-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ 编辑食堂菜单</h2>
          <span class="close" data-close>&times;</span>
        </div>
        <div class="modal-body">
          <form id="editMenuForm">
            <div class="form-group">
              <label for="editMenuDate">日期：</label>
              <input type="date" id="editMenuDate" value="${new Date(menu.date).toISOString().split('T')[0]}" required>
            </div>
            
            <div class="form-group">
              <label for="editMealType">餐次：</label>
              <select id="editMealType" required>
                <option value="breakfast" ${menu.mealType === 'breakfast' ? 'selected' : ''}>早餐</option>
                <option value="lunch" ${menu.mealType === 'lunch' ? 'selected' : ''}>午餐</option>
                <option value="dinner" ${menu.mealType === 'dinner' ? 'selected' : ''}>晚餐</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="editDishInput">菜品列表（每行一个菜品）：</label>
              <textarea id="editDishInput" rows="8" placeholder="请输入菜品名称，每行一个" required>${dishesText}</textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" data-close>取消</button>
              <button type="button" class="btn-danger" onclick="app.deleteMenu('${menuId}')">🗑️ 删除菜单</button>
              <button type="submit" class="btn-primary">保存修改</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // 显示模态框
    setTimeout(() => {
      modal.classList.add('visible');
    }, 10);

    // 绑定关闭事件
    const closeModal = () => {
      modal.classList.remove('visible');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
      }, 200);
    };

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.hasAttribute('data-close')) {
        closeModal();
      }
    });

    // 绑定表单提交事件
    document.getElementById('editMenuForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📝 提交编辑菜单表单');
      
      try {
        await this.submitEditMenu(menuId);
        closeModal();
      } catch (error) {
        console.error('❌ 提交失败:', error);
      }
    });

  } catch (error) {
    console.error('❌ 获取菜单详情失败:', error);
    alert('获取菜单详情失败：' + error.message);
  }
};

// 提交编辑菜单
App.prototype.submitEditMenu = async function (menuId) {
  const date = document.getElementById('editMenuDate').value;
  const mealType = document.getElementById('editMealType').value;
  const dishInput = document.getElementById('editDishInput').value.trim();

  if (!date || !mealType || !dishInput) {
    alert('请填写完整信息');
    return;
  }

  console.log('📝 准备提交编辑菜单数据:', { menuId, date, mealType, dishInput });

  // 解析菜品输入
  const dishNames = dishInput.split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (dishNames.length === 0) {
    alert('请至少输入一个菜品');
    return;
  }

  try {
    console.log('📝 正在处理菜品列表...', dishNames);

    // 显示加载状态
    const submitBtn = document.querySelector('#editMenuForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '处理中...';
    submitBtn.disabled = true;

    // 批量创建菜品并收集dishes数组
    const dishes = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < dishNames.length; i++) {
      const dishName = dishNames[i];
      console.log(`🔄 处理第 ${i + 1}/${dishNames.length} 个菜品: ${dishName}`);
      
      try {
        const food = await this.findOrCreateFood(dishName);
        if (food && food._id) {
          dishes.push({
            foodId: food._id,
            price: 0,
            availability: true
          });
          successCount++;
          console.log(`✅ 菜品处理成功: ${dishName} (ID: ${food._id})`);
        } else {
          failCount++;
          console.warn(`⚠️ 菜品处理失败: ${dishName}`);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ 处理菜品 "${dishName}" 时出错:`, error);
      }
    }

    console.log(`📊 菜品处理结果: 成功 ${successCount} 个, 失败 ${failCount} 个`);

    if (dishes.length === 0) {
      alert(`所有菜品处理失败！请检查菜品名称或网络连接。\n成功: ${successCount}, 失败: ${failCount}`);
      return;
    }

    if (failCount > 0) {
      const proceed = confirm(`有 ${failCount} 个菜品处理失败，${successCount} 个成功。是否继续保存成功的菜品？`);
      if (!proceed) {
        return;
      }
    }

    console.log('📤 准备提交菜单更新到后端:', { menuId, date, mealType, dishes });

    // 调用后端API更新菜单
    const response = await fetch(`${this.apiUrl}/menu/${menuId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        date,
        mealType,
        dishes
      })
    });

    const result = await response.json();
    console.log('📥 后端响应:', result);

    if (response.ok && result.success) {
      console.log('✅ 菜单更新成功');
      alert(`菜单更新成功！共包含 ${dishes.length} 个菜品。`);
      
      // 重新加载菜单数据
      await this.loadTodayMenu();
      this.render();
    } else {
      console.error('❌ 菜单更新失败:', result.message);
      alert('菜单更新失败：' + (result.message || '未知错误'));
    }

  } catch (error) {
    console.error('❌ 更新菜单请求失败:', error);
    alert('网络错误，请稍后重试: ' + error.message);
  } finally {
    // 恢复按钮状态
    const submitBtn = document.querySelector('#editMenuForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
};

// 删除菜单
App.prototype.deleteMenu = async function (menuId) {
  if (!this.currentUser || this.currentUser.role !== 'admin') {
    console.log('❌ 只有管理员可以删除菜单');
    alert('只有管理员可以删除菜单');
    return;
  }

  const confirmed = confirm('确定要删除这个菜单吗？此操作不可撤销！');
  if (!confirmed) {
    return;
  }

  try {
    console.log('🗑️ 删除菜单:', menuId);
    
    const response = await fetch(`${this.apiUrl}/menu/${menuId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();
    console.log('📥 删除响应:', result);

    if (response.ok && result.success) {
      console.log('✅ 菜单删除成功');
      alert('菜单删除成功！');
      
      // 关闭模态框
      const modal = document.querySelector('.edit-menu-modal');
      if (modal) {
        modal.remove();
      }
      
      // 重新加载菜单数据
      await this.loadTodayMenu();
      this.render();
    } else {
      console.error('❌ 菜单删除失败:', result.message);
      alert('菜单删除失败：' + (result.message || '未知错误'));
    }

  } catch (error) {
    console.error('❌ 删除菜单请求失败:', error);
    alert('网络错误，请稍后重试: ' + error.message);
  }
};

// 显示添加单个餐次菜单模态框
App.prototype.showAddMenuModal = function (mealType = 'lunch') {
  if (!this.currentUser || this.currentUser.role !== 'admin') {
    console.log('❌ 只有管理员可以添加菜单');
    alert('只有管理员可以添加菜单');
    return;
  }

  console.log('📝 显示添加菜单模态框，餐次:', mealType);

  const mealTypeText = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐'
  };

  const modal = document.createElement('div');
  modal.className = 'modal add-menu-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>➕ 添加${mealTypeText[mealType]}菜单</h2>
        <span class="close" data-close>&times;</span>
      </div>
      <div class="modal-body">
        <form id="addMenuForm">
          <div class="form-group">
            <label for="menuDate">日期：</label>
            <input type="date" id="menuDate" required>
          </div>
          
          <div class="form-group">
            <label for="mealType">餐次：</label>
            <select id="mealType" required>
              <option value="breakfast" ${mealType === 'breakfast' ? 'selected' : ''}>早餐</option>
              <option value="lunch" ${mealType === 'lunch' ? 'selected' : ''}>午餐</option>
              <option value="dinner" ${mealType === 'dinner' ? 'selected' : ''}>晚餐</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="dishInput">菜品列表（每行一个菜品）：</label>
            <textarea id="dishInput" rows="6" placeholder="请输入菜品名称，每行一个，例如：
红烧肉
青菜炒蛋
米饭
紫菜蛋花汤" required></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" data-close>取消</button>
            <button type="submit" class="btn-primary">添加菜单</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // 设置默认日期为今天
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('menuDate').value = today;

  // 显示模态框
  setTimeout(() => {
    modal.classList.add('visible');
  }, 10);

  // 绑定关闭事件
  const closeModal = () => {
    modal.classList.remove('visible');
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 200);
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) {
      closeModal();
    }
  });

  // 绑定表单提交事件
  document.getElementById('addMenuForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('📝 提交添加菜单表单');
    
    try {
      await this.submitAddMenu();
      closeModal();
    } catch (error) {
      console.error('❌ 提交失败:', error);
    }
  });
};

// 提交添加单个餐次菜单
App.prototype.submitAddMenu = async function () {
  const date = document.getElementById('menuDate').value;
  const mealType = document.getElementById('mealType').value;
  const dishInput = document.getElementById('dishInput').value.trim();

  if (!date || !mealType || !dishInput) {
    alert('请填写完整信息');
    return;
  }

  console.log('📝 准备提交菜单数据:', { date, mealType, dishInput });

  try {
    // 显示加载状态
    const submitBtn = document.querySelector('#addMenuForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '添加中...';
    submitBtn.disabled = true;

    // 处理菜品数据
    const dishNames = dishInput.split('\n').map(name => name.trim()).filter(name => name);
    const dishes = await this.processDishes(dishNames);

    if (dishes.length === 0) {
      alert('无有效菜品添加');
      return;
    }

    // 提交到后端
    const response = await fetch(`${this.apiUrl}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        date,
        mealType,
        dishes
      })
    });

    const result = await response.json();
    console.log('📥 添加菜单响应:', result);

    if (response.ok && result.success) {
      console.log('✅ 菜单添加成功');
      alert('菜单添加成功！');
      
      // 重新加载菜单数据
      await this.loadTodayMenu();
      this.render();
    } else {
      console.error('❌ 菜单添加失败:', result.message);
      alert('菜单添加失败：' + (result.message || '未知错误'));
    }

  } catch (error) {
    console.error('❌ 添加菜单请求失败:', error);
    alert('网络错误，请稍后重试: ' + error.message);
  } finally {
    // 恢复按钮状态
    const submitBtn = document.querySelector('#addMenuForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = '添加菜单';
      submitBtn.disabled = false;
    }
  }
};