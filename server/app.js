const express = require('express');
const cors = require('cors');
const app = express();
const port = 8000;

// 基础中间件
app.use(cors({ origin: [/^http:\/\/127\.0\.0\.1(:\d+)?$/,'http://localhost:3000','http://127.0.0.1:3000','https://food.cyezoi.com'], credentials: true }));
app.use(express.json());

app.use((req, _res, next) => {
  if (!req.user) {
    req.user = { _id: '64fa00000000000000000001', role: 'user', username: 'demoUser', email: 'demo@example.com' };
  }
  next();
});

// 简单请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  if (['POST','PUT','PATCH'].includes(req.method)) {
    console.log('📥 请求体:', req.body);
  }
  const end = res.end;
  res.end = function(...args){
    console.log(`❓ ${res.statusCode}响应: ${req.method} ${req.originalUrl}`);
    end.apply(this,args);
  };
  next();
});

// 路由
const foodsRouter = require('./routes/foods');
app.use('/api/foods', foodsRouter);

// 404 兜底
app.use((req,res)=>{
  res.status(404).json({ message: 'Not Found' });
});

app.listen(port, () => {
  console.log(`Food API server running at http://127.0.0.1:${port}`);
});