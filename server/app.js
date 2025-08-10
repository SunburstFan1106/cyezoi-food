const express = require('express');
const app = express();
const port = 3000;

const foodsRouter = require('./routes/foods');
app.use('/api/foods', foodsRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});