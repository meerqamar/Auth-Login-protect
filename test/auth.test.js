const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');

test('public info endpoint returns data', async () => {
  const response = await fetch('http://127.0.0.1:3000/public/info');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.message, 'This is public information');
});

test('protected profile endpoint rejects missing token', async () => {
  const response = await fetch('http://127.0.0.1:3000/protected/profile');
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error, 'Missing bearer token');
});
