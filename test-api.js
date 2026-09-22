const http = require('http');
const express = require('express');
const cors = require('cors');

// Create test instance using db.js
const { saveFeedback, getAllFeedback, getFeedbackStats } = require('./db');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateFeedback(data) {
  const errors = {};
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.name = 'Name is required.';
  }
  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }
  const ratingNum = Number(data.rating);
  if (!data.rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    errors.rating = 'Please select a valid rating between 1 and 5 stars.';
  }
  if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
    errors.category = 'Please select a feedback category.';
  }
  if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') {
    errors.message = 'Feedback message cannot be empty.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

app.get('/api/feedback', (req, res) => {
  const { category, sortBy } = req.query;
  const items = getAllFeedback(category, sortBy);
  res.status(200).json({ success: true, count: items.length, data: items });
});

app.get('/api/stats', (req, res) => {
  const stats = getFeedbackStats();
  res.status(200).json({ success: true, data: stats });
});

app.post('/api/feedback', (req, res) => {
  const { name, email, rating, category, message } = req.body || {};
  const validation = validateFeedback({ name, email, rating, category, message });
  if (!validation.isValid) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors: validation.errors });
  }

  const newFeedback = saveFeedback({ name, email, rating, category, message });
  res.status(201).json({ success: true, message: 'Thank you! Your feedback has been successfully submitted.', data: newFeedback });
});

const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}...`);
  try {
    // Test 1: GET /api/feedback
    console.log('\n--- Test 1: GET /api/feedback (Initial Load) ---');
    const getRes = await makeRequest('GET', '/api/feedback');
    console.log(`Status Code: ${getRes.status}`);
    assert(getRes.status === 200, 'GET /api/feedback should return 200');
    assert(getRes.body.success === true, 'Response success flag should be true');
    assert(getRes.body.data.length >= 1, 'Data array should contain seed items');
    console.log(`✅ Test 1 Passed: GET /api/feedback returned ${getRes.body.data.length} feedback items.`);

    // Test 2: POST /api/feedback with Invalid Inputs
    console.log('\n--- Test 2: POST /api/feedback (Backend Validation Check) ---');
    const invalidRes = await makeRequest('POST', '/api/feedback', { name: '', email: 'invalid-email', rating: 0 });
    console.log(`Status Code: ${invalidRes.status}`);
    assert(invalidRes.status === 400, 'POST with invalid payload should return HTTP 400 Bad Request');
    assert(invalidRes.body.success === false, 'Response success flag should be false');
    assert(invalidRes.body.errors.name !== undefined, 'Errors should contain name error');
    assert(invalidRes.body.errors.email !== undefined, 'Errors should contain email error');
    assert(invalidRes.body.errors.rating !== undefined, 'Errors should contain rating error');
    console.log('✅ Test 2 Passed: Backend validation correctly rejected invalid inputs with HTTP 400.');

    // Test 3: POST /api/feedback with Valid Input
    console.log('\n--- Test 3: POST /api/feedback (Success Case) ---');
    const validPayload = {
      name: 'John Developer',
      email: 'john.dev@code.io',
      rating: 5,
      category: 'Praise',
      message: 'Level 5 full-stack feedback application is working flawlessly!'
    };
    const validRes = await makeRequest('POST', '/api/feedback', validPayload);
    console.log(`Status Code: ${validRes.status}`);
    assert(validRes.status === 201, 'POST with valid payload should return HTTP 201 Created');
    assert(validRes.body.success === true, 'Response success flag should be true');
    assert(validRes.body.data.name === 'John Developer', 'Returned object name should match payload');
    console.log('✅ Test 3 Passed: Valid feedback successfully created and saved to SQLite.');

    // Test 4: GET /api/feedback?category=Praise
    console.log('\n--- Test 4: GET /api/feedback?category=Praise (Category Filtering) ---');
    const filterRes = await makeRequest('GET', '/api/feedback?category=Praise');
    assert(filterRes.status === 200, 'Filtering query should return 200');
    assert(filterRes.body.data.every(item => item.category === 'Praise'), 'All returned items should have category Praise');
    console.log(`✅ Test 4 Passed: Filter query returned ${filterRes.body.data.length} Praise category entries.`);

    // Test 5: GET /api/feedback?sortBy=rating_desc
    console.log('\n--- Test 5: GET /api/feedback?sortBy=rating_desc (Rating Sorting) ---');
    const sortRes = await makeRequest('GET', '/api/feedback?sortBy=rating_desc');
    assert(sortRes.status === 200, 'Sorting query should return 200');
    const ratings = sortRes.body.data.map(i => i.rating);
    for (let i = 0; i < ratings.length - 1; i++) {
      assert(ratings[i] >= ratings[i + 1], 'Ratings should be in descending order');
    }
    console.log('✅ Test 5 Passed: Sorting query successfully returned items ordered by highest rating.');

    // Test 6: GET /api/stats
    console.log('\n--- Test 6: GET /api/stats (Analytics Metrics) ---');
    const statsRes = await makeRequest('GET', '/api/stats');
    assert(statsRes.status === 200, 'Stats endpoint should return 200');
    assert(statsRes.body.data.total >= 2, 'Total feedback count should be accurate');
    assert(statsRes.body.data.distribution['5'] >= 1, 'Distribution should track 5-star count');
    console.log(`✅ Test 6 Passed: Stats API returned total=${statsRes.body.data.total}, avgRating=${statsRes.body.data.avgRating}.`);

    console.log('\n🎉 ALL 6 LEVEL 5 AUTOMATED API & DATA FLOW TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ Test Failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}
