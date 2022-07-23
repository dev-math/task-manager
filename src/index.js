const express = require('express');
const userRouter = require('./routers/user.js');
const taskRouter = require('./routers/task.js');

require('./db/mongoose');

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
