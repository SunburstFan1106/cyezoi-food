// 认证相关模块
import { App } from './app-core.js';

App.prototype.checkAuth = async function () {
  try {
    const response = await fetch(`${this.apiUrl}/auth/me`, {
      credentials: 'include',
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
};

App.prototype.renderAuth = function () {
  const isLogin = this.authMode === 'login';
  return `
    <div class="auth-container">
      <form class="auth-form" id="authForm">
        <h2 class="auth-title">${isLogin ? '🍔 登录' : '📝 注册'}</h2>
        ${
          !isLogin
            ? `
              <div class="form-group">
                <label class="form-label">用户名</label>
                <input type="text" name="username" class="form-input" required>
              </div>
            `
            : ''
        }
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input type="email" name="email" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input type="password" name="password" class="form-input" required>
        </div>
        <button type="submit" class="auth-btn">${isLogin ? '登录' : '注册'}</button>
        <div class="auth-switch">
          ${isLogin ? '还没有账户？' : '已有账户？'}
          <a href="#" id="toggleAuthLink">${isLogin ? '立即注册' : '立即登录'}</a>
        </div>
        <a href="#" class="back-btn" id="backToMain">返回主页</a>
      </form>
    </div>
  `;
};

App.prototype.handleAuth = async function (e) {
  const formData = new FormData(e.target);
  const isLogin = this.authMode === 'login';

  const userData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };
  if (!isLogin) userData.username = formData.get('username');

  console.log('📤 发送认证请求:', { ...userData, password: '[隐藏]' });

  try {
    const response = await fetch(`${this.apiUrl}/auth/${isLogin ? 'login' : 'register'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
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
      alert(result.message || '操作失败');
    }
  } catch (error) {
    console.error('❌ 认证请求失败:', error);
    alert('网络连接失败，请重试');
  }
};

App.prototype.toggleAuthMode = function () {
  this.authMode = this.authMode === 'login' ? 'register' : 'login';
  this.render();
  this.bindEvents();
};

App.prototype.showAuth = function () {
  this.currentView = 'auth';
  this.render();
  this.bindEvents();
};

App.prototype.showMainView = function () {
  this.currentView = 'main';
  this.render();
  this.bindEvents();
};

App.prototype.logout = async function () {
  try {
    await fetch(`${this.apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
    this.currentUser = null;
    this.currentView = 'auth';
    this.render();
    this.bindEvents();
    alert('已安全退出登录');
  } catch (error) {
    console.error('❌ 退出登录失败:', error);
  }
};
