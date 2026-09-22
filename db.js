const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'feedback.db');
const db = new DatabaseSync(dbPath);

// Initialize feedback table
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    rating INTEGER NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

// Pre-seed initial data if table is empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM feedback');
const rowCount = countStmt.get().count;

if (rowCount === 0) {
  const seedItems = [
    {
      id: 'fb-101',
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      rating: 5,
      category: 'Praise',
      message: 'The Sysslan IT Solutions integration is so smooth and fast! Love the instant updates.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'fb-102',
      name: 'Alex Rivera',
      email: 'arivera@example.com',
      rating: 4,
      category: 'Feature Request',
      message: 'Great IT service platform! Would be awesome to add dark mode toggle option.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'fb-103',
      name: 'Elena Rostova',
      email: 'elena.r@techcorp.io',
      rating: 5,
      category: 'General',
      message: 'Outstanding customer support and highly scalable solution architecture.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO feedback (id, name, email, rating, category, message, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  seedItems.forEach(item => {
    insertStmt.run(item.id, item.name, item.email, item.rating, item.category, item.message, item.createdAt);
  });
}

/**
 * Save feedback entry to SQLite
 */
function saveFeedback({ name, email, rating, category, message }) {
  const newFeedback = {
    id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    rating: Number(rating),
    category: category.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  const insertStmt = db.prepare(`
    INSERT INTO feedback (id, name, email, rating, category, message, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    newFeedback.id,
    newFeedback.name,
    newFeedback.email,
    newFeedback.rating,
    newFeedback.category,
    newFeedback.message,
    newFeedback.createdAt
  );

  return newFeedback;
}

/**
 * Get all feedback entries with optional filtering and sorting
 */
function getAllFeedback(categoryFilter = null, sortBy = 'newest') {
  let query = 'SELECT * FROM feedback';
  const params = [];

  if (categoryFilter && categoryFilter !== 'all' && categoryFilter.trim() !== '') {
    query += ' WHERE category = ?';
    params.push(categoryFilter.trim());
  }

  if (sortBy === 'oldest') {
    query += ' ORDER BY createdAt ASC';
  } else if (sortBy === 'rating_desc') {
    query += ' ORDER BY rating DESC, createdAt DESC';
  } else if (sortBy === 'rating_asc') {
    query += ' ORDER BY rating ASC, createdAt DESC';
  } else {
    // Default newest first
    query += ' ORDER BY createdAt DESC';
  }

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get feedback analytics statistics
 */
function getFeedbackStats() {
  const totalStmt = db.prepare('SELECT COUNT(*) as total, AVG(rating) as avgRating FROM feedback');
  const summary = totalStmt.get();

  const distributionStmt = db.prepare('SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating');
  const distRows = distributionStmt.all();

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distRows.forEach(row => {
    distribution[row.rating] = row.count;
  });

  return {
    total: summary.total || 0,
    avgRating: summary.avgRating ? Number(summary.avgRating).toFixed(1) : '0.0',
    distribution
  };
}

module.exports = {
  saveFeedback,
  getAllFeedback,
  getFeedbackStats
};
