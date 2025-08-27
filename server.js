const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Food = require("./models/Food");
const Review = require("./models/Review");
const DailyRecommendation = require("./models/DailyRecommendation");
const {
  generateToken,
  verifyToken,
  requireAdmin,
  optionalAuth,
} = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 8000;

// 连接MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cyezoi-food", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB连接成功");
    console.log("📊 数据库:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB连接失败:", err.message);
    process.exit(1);
  });

// 中间件设置
app.use((req, res, next) => {
  // CORS配置
  // res.header('Access-Control-Allow-Origin', 'http://localhost:4000');
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    console.log("📋 处理OPTIONS预检请求:", req.path);
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 允许前端同源或本地调试
app.use(
  cors({
    origin: [
      "http://127.0.0.1:8000",
      "http://localhost:8000",
      "https://food.cyezoi.com",
    ],
    credentials: true,
  })
);

// 静态资源
app.use(express.static(path.join(__dirname, "public")));

// 模块化路由挂载
const foodsRouter = require("./server/routes/foods");
const authRouter = require("./server/routes/auth");
const reviewsRouter = require("./server/routes/reviews");
const recommendationRouter = require("./server/routes/recommendation");
const adminRouter = require("./server/routes/admin");
const announcementsRouter = require("./server/routes/announcements");

app.use("/api/foods", foodsRouter);
app.use("/api/auth", authRouter);
// reviews 路由文件里已包含 '/foods/:foodId/reviews' 和 '/reviews/:reviewId' 等前缀
app.use("/api", reviewsRouter);
// recommendation 路由文件里包含 '/daily-recommendation*' 路径
app.use("/api", recommendationRouter);
// admin 路由文件在此挂载，内部是 '/users'
app.use("/api/admin", adminRouter);
// 公告栏：公开获取，管理员可增删改
app.use("/api/announcements", announcementsRouter);

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = "[隐藏]";
    console.log("📥 请求体:", logBody);
  }
  next();
});

// ================================
// 根路由 - API文档
// ================================
app.get("/", (req, res) => {
  res.json({
    message: "曹杨二中周边美食 API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    features: [
      "用户认证系统",
      "美食管理",
      "权限控制",
      "JWT认证",
      "每日美食推荐",
    ],
    endpoints: {
      // 认证相关
      "POST /api/auth/register": "用户注册",
      "POST /api/auth/login": "用户登录",
      "POST /api/auth/logout": "用户登出",
      "GET /api/auth/me": "获取当前用户信息",

      // 美食相关
      "GET /api/foods": "获取美食列表",
      "POST /api/foods": "添加新美食（需登录）",
      "GET /api/foods/:id": "获取单个美食详情",
      "PUT /api/foods/:id": "更新美食信息（作者或管理员）",
      "DELETE /api/foods/:id": "删除美食（仅管理员）",

      // 今天吃什么
      "GET /api/daily-recommendation": "获取今日推荐美食（需登录）",
      "GET /api/daily-recommendation/history": "获取推荐历史（需登录）",

      // 用户管理（管理员）
      "GET /api/admin/users": "获取用户列表（仅管理员）",
      "DELETE /api/admin/users/:id": "删除用户（仅管理员）",
    },
  });
});

// ================================
// 用户认证路由 - 已模块化，见 /server/routes/auth.js
// ================================

// ================================
// 美食相关路由
// ================================

// 获取所有美食（公开访问，但会显示用户相关信息）
// 移除内联 /api/foods，改为使用模块化路由（见上）

// ================================
// 评论相关路由 - 已模块化，见 /server/routes/reviews.js
// ================================

// ================================
// 今天吃什么功能 - 已模块化，见 /server/routes/recommendation.js
// ================================

// ================================
// 管理员路由 - 已模块化，见 /server/routes/admin.js
// ================================

// ================================
// 错误处理
// ================================

// 404处理
app.use((req, res) => {
  console.log("❓ 404请求:", req.method, req.path);
  res.status(404).json({
    success: false,
    message: "接口不存在",
    path: req.path,
    method: req.method,
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error("🚨 服务器错误:", err);

  // 处理JSON解析错误
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "请求数据格式错误",
    });
  }

  res.status(500).json({
    success: false,
    message: "服务器内部错误",
  });
});

// ================================
// 启动服务器
// ================================
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log("🚀 服务器启动成功！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 端口: ${PORT}`);
  console.log(`🌐 本地访问: http://127.0.0.1:${PORT}`);
  console.log(`📖 API文档: http://127.0.0.1:${PORT}`);
  console.log(`🍽️ 美食API: http://127.0.0.1:${PORT}/api/foods`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

server.on("error", (err) => {
  console.error("🚨 服务器启动失败:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`端口 ${PORT} 已被占用`);
    process.exit(1);
  }
});

server.on("listening", () => {
  console.log("👂 服务器正在监听端口:", server.address());
});

// 添加进程错误处理
process.on("uncaughtException", (err) => {
  console.error("🚨 未捕获的异常:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 未处理的Promise拒绝:", reason);
  process.exit(1);
});

// 前端路由兜底（若不是单页应用可省略）
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
