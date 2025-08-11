# 曹杨二中美食评分系统

本项目提供用户注册 / 登录、美食推荐、评价与点赞等功能。

## 技术栈
- 后端: Node.js + Express + Mongoose (MongoDB)
- 前端: 原生 HTML/CSS/JS (位于 `public/`)
- 认证: JWT (HTTP-only Cookie)
- 脚本: 数据初始化 / 诊断工具

## 当前目录结构
```
.
├─ server.js
├─ models/
├─ middleware/
├─ public/
├─ scripts/
├─ .env (不提交)
├─ .gitignore
├─ package.json
└─ LICENSE
```

## 快速开始
```bash
npm install
npm run dev     # 开发 (nodemon)
npm start       # 生产模式
npm run diagnose
```

## 环境变量
参见 `.env.example`（请自行复制为 `.env`）:
```
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/cyezoi-food
JWT_SECRET=请自行修改
ALLOWED_ORIGINS=http://127.0.0.1:8000
```

## 脚本
- `npm run create-admin` 创建管理员
- `npm run seed-reviews` 写入示例评论
- `npm run test-db` 测试数据库连接
- `npm run diagnose` 环境诊断

## 许可证
本项目采用 AGPL-3.0，详见 `LICENSE`。

## TODO
- （可选）迁移到 React / Vite
- 添加单元测试
- 分页与排序组件化