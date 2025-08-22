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

    // 启动
    this.init();
  }
}

// 初始化与通用渲染
App.prototype.init = async function () {
  console.log("🚀 应用初始化开始...");
  await this.checkAuth();
  if (this.currentUser) {
    await this.loadFoods();
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
  root.innerHTML = html;
  
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
