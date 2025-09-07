// 应用入口：装配各模块并启动
import { App } from "./app-core.js";

// 等待所有模块加载完成
Promise.all([
  import("./auth.js"),
  import("./foods.js"),
  import("./reviews.js"),
  import("./recommendation.js"),
  import("./bindings.js"),
  import("./announcements.js"),
  import("./menu.js")
]).then(() => {
  console.log("📦 所有模块加载完成");
  
  // 兼容现有全局函数调用（index.html 内联 onClick 仍存在）
  window.closeReviewModal = function () {
    if (window.app) window.app.closeReviewModal();
  };
  window.closeEditReviewModal = function () {
    if (window.app) window.app.closeEditReviewModal();
  };

  // 启动应用
  console.log("📄 DOM加载完成，启动应用 (ES Modules)...");
  if (!window.app) {
    window.app = new App();
  }
}).catch(error => {
  console.error("❌ 模块加载失败:", error);
  document.body.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <h1>🚨 应用加载失败</h1>
      <p>请检查控制台错误信息</p>
    </div>
  `;
});
