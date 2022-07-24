const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
  const userData = {
    name: 'Mike',
    email: 'mike@example.com',
    password: 'mike@example.com'
  }
  const response = await request(app)
    .post('/users')
    .send(userData)
    .expect(201);

  // Assert that the database was changed correctly
  const user = await User.findOne({ email: response.body.user.email });
  expect(user).not.toBeNull();

  // Assert about the response
  expect(response.body).toMatchObject({
    user: {
      name: userData.name,
      email: userData.email
    },
    token: user.tokens[0].token
  });

  // Assert that the password is not stored as plain text
  expect(user.password).not.toBe(userData.password);
});

test('Should not signup a existent user', async () => {
  await request(app)
    .post('/users')
    .send(userOne)
    .expect(400);
});

test('Should login existing user', async () => {
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password
    })
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexistent user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'test@test.com',
      password: 'test@test.com'
    })
    .expect(400);
});

test('Should not login wrong password', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: 'test@test.com'
    })
    .expect(400);
});

test('Should logout user', async () => {
  await request(app)
    .post('/users/logout')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // Assert that the user is disconnected
  const user = await User.findById(userOne._id);
  expect(user.tokens[0]).toBeUndefined();
});

test('Should not logout user that is unauthenticated', async () => {
  await request(app)
    .post('/users/logout')
    .send()
    .expect(401)
});

test('Should logout user from all devices', async () => {
  await request(app)
    .post('/users/logoutall')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // Assert that the user is disconnected
  const user = await User.findById(userOne._id);
  expect(user.tokens).toEqual([]);
});

test('Should not logout from all devices user that is unauthenticated', async () => {
  await request(app)
    .post('/users/logoutall')
    .send()
    .expect(401);
});

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

test('Should update valid user fields', async () => {
  const newUserOne = {
    name: 'Mike',
    email: 'example2@example.com',
    password: 'example2@example.com',
    age: 59
  };

  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send(newUserOne)
    .expect(200);

  const user = await User.findById(userOne._id);

  // Assert that the password is updated
  expect(await bcrypt.compare(newUserOne.password, user.password)).toBe(true);

  // Assert that the fields is updated
  delete newUserOne.password;
  expect(user).toMatchObject(newUserOne);
});

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ location: 'sometext' })
    .expect(400);
});

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401);
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  const user = await User.findById(userOne._id);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should not upload avatar invalid files', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/sample-pdf-file.pdf')
    .expect(400);
});

test('Should get user avatar', async () => {
  // upload image first
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  await request(app)
    .get('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
});

test('Should not get user avatar if user is unauthenticated', async () => {
  await request(app)
    .get('/users/me/avatar')
    .send()
    .expect(401)
});

test('Should not get user avatar if not exists the pic', async () => {
  await request(app)
    .get('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(404)
});

test('Should delete user avatar', async () => {
  // upload image first
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  await request(app)
    .delete('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

  // Assert that the avatar is deleted
  const user = await User.findById(userOne._id);
  expect(user.avatar).toBeUndefined();
});

test('Should not delete user avatar if not exists', async () => {
  await request(app)
    .delete('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(500)
});

test('Should not delete user avatar if user is unauthenticated', async () => {
  await request(app)
    .delete('/users/me/avatar')
    .send()
    .expect(401)
});
