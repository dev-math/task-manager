const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const {
  userOne,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase
} = require('./fixtures/db');

// const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const User = require('../src/models/user');

beforeEach(setupDatabase);

test('Should create task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Run tests'
    })
    .expect(201);

  // Assert that the task is created 
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();

  // Assert that the task is setted to false by default 
  expect(task.completed).toEqual(false);
});

test('Should not create task for user unauthenticated', async () => {
  await request(app)
    .post('/tasks')
    .send({
      description: 'Run tests'
    })
    .expect(401);
});

test('Should fetch user tasks', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // Assert that we get 2 tasks in the response body
  expect(response.body.length).toEqual(2);
});

test('Should not fetch user tasks for unauthenticated users', async () => {
  await request(app)
    .get('/tasks')
    .send()
    .expect(401);
});

test('Should get the user task', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body).toMatchObject(taskOne);
});

test('Should not get user task that not exists', async () => {
  await request(app)
    .get('/tasks/02dc8ee52864ab818c5d2391')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(404);
});

test('Should not get task for unauthenticated user', async () => {
  response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);
});

test('Should not get task belonging to other user', async () => {
  response = await request(app)
    .get(`/tasks/${taskThree._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(404);
});

test('Should update valid task fields', async () => {
  const newTaskOne = {
    description: 'example',
    completed: true
  };

  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send(newTaskOne)
    .expect(200);

  const task = await Task.findById(taskOne._id);

  expect(task).toMatchObject(newTaskOne);
});

test('Should not update task fields from unauthenticated users', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .send({
      something: 'string'
    })
    .expect(401);
});

test('Should not update invalid task fields', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      something: 'string'
    })
    .expect(400);
});

test('Should delete user task', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  const task = await Task.findById(taskOne._id);
  expect(task).toBeNull();
})

test('Should not delete task from unauthenticated users', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);
})

test('Should not delete other users tasks', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
})
