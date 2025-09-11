# 曹杨二中美食评分系统

本项目提供用户注册 / 登录、美食推荐、评价与点赞、学校菜单查看与评价等功能。

## 功能特性

- 🔐 **用户系统**: 注册/登录、JWT认证、权限控制
- 🍽️ **美食管理**: 美食推荐、分类筛选、搜索功能
- ⭐ **评价系统**: 5星评分、评论发布、点赞互动
- 📅 **学校菜单**: 今日菜单展示、本周菜单查看、菜单评价功能
- 🎯 **每日推荐**: 智能推荐今日美食
- 📢 **公告系统**: 管理员发布公告、用户查看通知
- 🕷️ **数据爬取**: 自动爬取学校官网菜单信息

## 技术栈

- 后端: Node.js + Express + Mongoose (MongoDB)
- 前端: 原生 HTML/CSS/JS (位于 `public/`)
- 认证: JWT (HTTP-only Cookie)
- 爬虫: Puppeteer
- 数据库: MongoDB
- 脚本: 数据初始化 / 诊断工具

## 当前目录结构

```
.
├─ server.js                    # 主服务器
├─ middleware/
│  └─ auth.js                   # 认证中间件
├─ models/                      # 数据模型
│  ├─ User.js                   # 用户模型
│  ├─ Food.js                   # 美食模型
│  ├─ Review.js                 # 评论模型
│  ├─ SchoolMenu.js            # 学校菜单模型
│  ├─ DailyRecommendation.js   # 每日推荐模型
│  └─ Announcement.js          # 公告模型
├─ server/                      # 服务器组件
│  ├─ controllers/             # 控制器
│  ├─ routes/                  # 路由
│  └─ middleware/              # 中间件
├─ public/                      # 前端资源
│  ├─ index.html               # 主页面
│  ├─ styles.css              # 样式文件
│  └─ js/                     # JavaScript模块
│     ├─ app-core.js          # 核心应用类
│     ├─ auth.js              # 认证模块
│     ├─ foods.js             # 美食管理
│     ├─ reviews.js           # 评论系统
│     ├─ menu.js              # 菜单功能
│     ├─ recommendation.js    # 推荐系统
│     ├─ announcements.js     # 公告系统
│     ├─ bindings.js          # 事件绑定
│     └─ main.js              # 入口文件
├─ scripts/                     # 脚本工具
│  ├─ createAdmin.js           # 创建管理员
│  ├─ crawlSchoolMenu.js       # 爬取学校菜单
│  ├─ crawlSpecificMenu.js     # 爬取指定菜单
│  ├─ updateRealMenu.js        # 批量更新真实菜单
│  ├─ seedReviews.js          # 生成示例评论
│  ├─ testConnection.js       # 测试数据库连接
│  └─ diagnose.js             # 系统诊断
├─ .env                        # 环境变量 (不提交)
├─ .gitignore                  # Git忽略文件
├─ package.json                # 项目配置
└─ LICENSE                     # 许可证 (AGPL-3.0)
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev     # 开发模式 (nodemon)
# 或
npm start       # 生产模式

# 系统诊断
npm run diagnose
```

## 环境变量

参见 `.env.example`（请自行复制为 `.env`）:

```env
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/cyezoi-food
JWT_SECRET=请自行修改为随机字符串
ALLOWED_ORIGINS=http://127.0.0.1:8000
```

## 脚本命令

### 基础脚本
- `npm run create-admin` - 创建管理员账户
- `npm run seed-reviews` - 生成示例评论数据
- `npm run test-db` - 测试数据库连接
- `npm run diagnose` - 环境诊断

### 菜单数据脚本
- `node scripts/crawlSchoolMenu.js` - 自动爬取学校官网菜单
- `node scripts/crawlSpecificMenu.js` - 爬取指定页面菜单
- `node scripts/updateRealMenu.js` - 批量写入真实菜单数据

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 美食接口
- `GET /api/foods` - 获取美食列表
- `POST /api/foods` - 添加新美食（需登录）
- `GET /api/foods/:id` - 获取单个美食详情
- `PUT /api/foods/:id` - 更新美食信息（作者或管理员）
- `DELETE /api/foods/:id` - 删除美食（仅管理员）

### 评论接口
- `GET /api/foods/:id/reviews` - 获取美食评论列表
- `POST /api/foods/:id/reviews` - 添加评论（需登录）
- `PUT /api/reviews/:id` - 更新评论（作者）
- `DELETE /api/reviews/:id` - 删除评论（作者或管理员）
- `POST /api/reviews/:id/like` - 点赞/取消点赞

### 菜单接口
- `GET /api/menu/today` - 获取今日菜单
- `GET /api/menu/week` - 获取本周菜单
- `POST /api/menu` - 创建菜单（管理员）
- `POST /api/menu/crawl` - 触发菜单爬取（管理员）

### 推荐接口
- `GET /api/daily-recommendation` - 获取今日推荐美食（需登录）

### 公告接口
- `GET /api/announcements` - 获取公告列表
- `POST /api/announcements` - 发布公告（管理员）
- `PUT /api/announcements/:id` - 更新公告（管理员）
- `DELETE /api/announcements/:id` - 删除公告（管理员）

## 使用说明

### 1. 菜单功能使用
1. **查看今日菜单**: 登录后在主页面可查看今日学校菜单
2. **评价菜品**: 点击菜单中任意菜品的"评价"按钮即可评分和评论
3. **查看本周菜单**: 点击"查看本周菜单"按钮查看完整周菜单
4. **管理员功能**: 管理员可点击"刷新菜单"按钮触发爬虫更新菜单

### 2. 数据管理
1. **手动更新菜单**: 运行 `node scripts/updateRealMenu.js` 批量写入真实菜单数据
2. **爬取菜单**: 运行 `node scripts/crawlSchoolMenu.js` 自动爬取官网菜单
3. **创建管理员**: 运行 `npm run create-admin` 创建管理员账户

### 3. 开发调试
1. **查看日志**: 服务器会输出详细的请求日志和操作日志
2. **诊断系统**: 运行 `npm run diagnose` 检查环境配置
3. **测试连接**: 运行 `npm run test-db` 验证数据库连接

## 许可证

本项目采用 **GNU Affero General Public License v3.0** (AGPL-3.0)，详见 [`LICENSE`](LICENSE) 文件。

## TODO

- ✅ 学校菜单功能与评价系统
- ✅ 菜单数据批量导入脚本
- ✅ 去除所有弹窗提示
- 🔄 菜单数据自动同步
- 📱 响应式设计优化
- 🧪 单元测试覆盖
- ⚡ 性能优化与缓存
- 🎨 UI/UX 改进

## 贡献

欢迎提交 Issue 和 Pull Request！请确保遵循项目的代码风格和许可证要求。

---

💡 **提示**: 访问 `http://127.0.0.1:8000` 查看完整的 API 文档和功能介绍。