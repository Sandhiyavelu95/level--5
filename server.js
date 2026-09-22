const express = require('express');
const cors = require('cors');
const path = require('path');
const { saveFeedback, getAllFeedback, getFeedbackStats } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Email validation regex
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation function for feedback input
function validateFeedback(data) {
  const errors = {};

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.name = 'Name is required.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long.';
  }

  // Email validation
  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  // Rating validation
  const ratingNum = Number(data.rating);
  if (!data.rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    errors.rating = 'Please select a valid rating between 1 and 5 stars.';
  }

  // Category validation
  if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
    errors.category = 'Please select a feedback category.';
  }

  // Message validation
  if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') {
    errors.message = 'Feedback message cannot be empty.';
  } else if (data.message.trim().length < 5) {
    errors.message = 'Feedback message must be at least 5 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Task 3: GET /api/feedback
 * Fetch feedback with filtering and sorting
 */
app.get('/api/feedback', (req, res) => {
  try {
    const { category, sortBy } = req.query;
    const items = getAllFeedback(category, sortBy);
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    console.error('Error getting feedback:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Task 3: GET /api/stats
 * Fetch feedback analytics and star rating distribution
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = getFeedbackStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Task 1 & Task 4: POST /api/feedback
 * Connect feedback form, perform validation, and persist to SQLite
 */
app.post('/api/feedback', (req, res) => {
  const { name, email, rating, category, message } = req.body || {};

  // Backend Validation
  const validation = validateFeedback({ name, email, rating, category, message });

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the highlighted errors.',
      errors: validation.errors
    });
  }

  try {
    // Persist to SQLite store
    const newFeedback = saveFeedback({ name, email, rating, category, message });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been successfully submitted.',
      data: newFeedback
    });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ success: false, message: 'Failed to persist feedback.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
