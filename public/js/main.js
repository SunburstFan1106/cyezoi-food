// 应用入口：装配各模块并启动
import { App } from "./app-core.js";
import "./auth.js";
import "./foods.js";
import "./reviews.js";
import "./recommendation.js";
import "./bindings.js";
import "./announcements.js";

// 兼容现有全局函数调用（index.html 内联 onClick 仍存在）
window.closeReviewModal = function () {
  if (window.app) window.app.closeReviewModal();
};
window.closeEditReviewModal = function () {
  if (window.app) window.app.closeEditReviewModal();
};

// 启动应用
console.log("📄 DOM加载完成，启动应用 (ES Modules)...");
if (!window.app) window.app = new App();
