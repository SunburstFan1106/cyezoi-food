// 核心 App 类与基础状态
import { mountAnnouncements } from './announcements.js';

export class App {
  constructor() {
    // 全局状态
    this.foods = [];
    this.currentUser = null;
    this.currentView = "main";
    this.authMode = "login";
    this.apiUrl = "api"; // 相对路径，兼容反向代理

    // 评论相关
    this.currentFoodId = null;
    this.currentFoodName = null;
    this.currentRating = 0;
    this.currentReviews = [];
    this.reviewsPage = 1;
    this.reviewsTotal = 0;
    this.editingReviewId = null;
    this.editRating = 0;

    // 添加美食相关
    this.addFoodModalVisible = false;
    this.validCategories = ["面食", "快餐", "饮品", "小吃", "早餐", "其他"];
    this.categoryEmojiMap = {
      面食: "🍜",
      快餐: "🍔",
      饮品: "🧋",
      小吃: "🍗",
      早餐: "🥞",
      其他: "🍽️",
    };

    // 菜单相关状态
    this.todayMenu = null;
    this.weekMenu = [];

    // 延迟初始化，确保模块加载完成
    setTimeout(() => this.init(), 0);
  }
}

// 初始化与通用渲染
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

App.prototype.render = function () {
  const root = document.getElementById("app-root") || document.body;
  let html = "";
  if (this.currentUser) {
    html = this.renderMain();
  } else {
    html = this.renderAuth();
  }
  
  // 确保返回的是字符串
  if (typeof html !== 'string') {
    console.error('渲染函数返回值不是字符串:', html);
    html = '<div class="container"><h1>加载中...</h1></div>';
  }
  
  root.innerHTML = html;
  
  // ✅ 关键修复：在DOM更新后重新绑定事件
  setTimeout(() => {
    this.bindEvents();
  }, 0);
  
  // 如果用户已登录，自动重新挂载公告栏
  if (this.currentUser) {
    setTimeout(async () => {
      try {
        await mountAnnouncements(this);
      } catch (e) {
        console.warn('重新挂载公告栏失败', e);
      }
    }, 0);
  }
};

// 认证相关占位函数
App.prototype.renderAuth = function () {
  return `
    <div class="auth-container">
      <div class="auth-form">
        <h2 class="auth-title">🍔 登录</h2>
        <p>模块加载中...</p>
      </div>
    </div>
  `;
};

App.prototype.checkAuth = async function () {
  // 占位函数，会被 auth.js 覆盖
  this.currentView = 'auth';
};

// 美食相关占位函数
App.prototype.renderMain = function () {
  return `
    <div class="container">
      <div class="header">
        <h1>曹杨二中周边美食</h1>
        <div class="user-info">
          <div>加载中...</div>
        </div>
      </div>
      <div class="controls">
        <p>正在加载美食数据...</p>
      </div>
    </div>
  `;
};

App.prototype.loadFoods = async function () {
  // 占位函数，会被 foods.js 覆盖
  this.foods = [];
};

App.prototype.loadTodayMenu = async function () {
  // 占位函数，会被 menu.js 覆盖
  this.todayMenu = null;
};

// 菜单相关占位函数
App.prototype.renderTodayMenu = function () {
  return '';
};

App.prototype.bindMenuEvents = function () {
  // 占位函数，会被 menu.js 覆盖
};

// 事件绑定占位函数
App.prototype.bindEvents = function () {
  // 占位函数，会被其他模块扩展
};

