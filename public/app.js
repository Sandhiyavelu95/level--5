const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? ''
  : 'https://sysslan-feedback-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('feedback-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const ratingInput = document.getElementById('rating');
  const categoryInput = document.getElementById('category');
  const messageInput = document.getElementById('message');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  const starContainer = document.getElementById('star-rating');
  const starBtns = starContainer.querySelectorAll('.star-btn');
  
  const feedbackListEl = document.getElementById('feedback-list');
  const refreshBtn = document.getElementById('refresh-btn');
  const filterCategorySelect = document.getElementById('filter-category');
  const sortBySelect = document.getElementById('sort-by');
  
  const statTotalEl = document.getElementById('stat-total');
  const statAvgEl = document.getElementById('stat-avg');
  const ratingBreakdownEl = document.getElementById('rating-breakdown');
  const toastContainer = document.getElementById('toast-container');
  const navLinks = document.querySelectorAll('.nav-link');

  // --- Task 2: Active Navigation & Smooth Scroll ---
  window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section, footer');
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId.startsWith('#')) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          e.preventDefault();
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // --- Star Rating Interactivity ---
  let selectedRating = 0;

  starBtns.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const value = parseInt(star.dataset.value);
      highlightStars(value, 'hover');
    });

    star.addEventListener('mouseleave', () => {
      highlightStars(selectedRating, 'active');
    });

    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value);
      ratingInput.value = selectedRating;
      highlightStars(selectedRating, 'active');
      clearFieldError('rating');
    });
  });

  function highlightStars(count, className) {
    starBtns.forEach(star => {
      const val = parseInt(star.dataset.value);
      star.classList.remove('hover', 'active');
      if (val <= count) {
        star.classList.add(className);
      }
    });
  }

  // --- Real-time Field Error Clearing ---
  [nameInput, emailInput, categoryInput, messageInput].forEach(input => {
    input.addEventListener('input', () => {
      clearFieldError(input.name);
    });
  });

  // --- Toast Notification System ---
  function showToast(title, message, type = 'success', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- Client-side Validation (Task 4) ---
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function clearFieldError(fieldName) {
    const group = document.getElementById(`group-${fieldName}`);
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (group) group.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }

  function setFieldError(fieldName, message) {
    const group = document.getElementById(`group-${fieldName}`);
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (group) group.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  }

  function validateClientForm() {
    let isValid = true;

    // Validate Name
    const nameVal = nameInput.value.trim();
    if (!nameVal) {
      setFieldError('name', 'Please enter your full name.');
      isValid = false;
    } else if (nameVal.length < 2) {
      setFieldError('name', 'Name must be at least 2 characters.');
      isValid = false;
    } else {
      clearFieldError('name');
    }

    // Validate Email
    const emailVal = emailInput.value.trim();
    if (!emailVal) {
      setFieldError('email', 'Please enter your email address.');
      isValid = false;
    } else if (!isValidEmail(emailVal)) {
      setFieldError('email', 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearFieldError('email');
    }

    // Validate Rating
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      setFieldError('rating', 'Please select a star rating (1-5).');
      isValid = false;
    } else {
      clearFieldError('rating');
    }

    // Validate Category
    if (!categoryInput.value) {
      setFieldError('category', 'Please select a category.');
      isValid = false;
    } else {
      clearFieldError('category');
    }

    // Validate Message
    const messageVal = messageInput.value.trim();
    if (!messageVal) {
      setFieldError('message', 'Please enter your feedback message.');
      isValid = false;
    } else if (messageVal.length < 5) {
      setFieldError('message', 'Message must be at least 5 characters long.');
      isValid = false;
    } else {
      clearFieldError('message');
    }

    return isValid;
  }

  // --- Task 3: Fetch Feedback Data with Category Filtering & Sorting ---
  async function fetchFeedbackData() {
    try {
      const category = filterCategorySelect ? filterCategorySelect.value : 'all';
      const sortBy = sortBySelect ? sortBySelect.value : 'newest';

      const url = `${API_BASE}/api/feedback?category=${encodeURIComponent(category)}&sortBy=${encodeURIComponent(sortBy)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }
      
      const result = await response.json();
      if (result.success) {
        renderFeedbackList(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch feedback.');
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      feedbackListEl.innerHTML = `
        <div class="empty-state">
          <p style="color: var(--error);">Failed to load feedback from SQLite backend API.</p>
          <button onclick="location.reload()" class="btn-icon" style="margin-top: 0.5rem;">Try Again</button>
        </div>
      `;
    }
  }

  // --- Task 3 & 4: Fetch Analytics Stats ---
  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE}/api/stats`);
      if (!response.ok) return;
      const result = await response.json();

      if (result.success && result.data) {
        const { total, avgRating, distribution } = result.data;
        statTotalEl.textContent = total;
        statAvgEl.textContent = `${avgRating} ★`;

        renderRatingBreakdown(total, distribution);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  function renderRatingBreakdown(total, dist) {
    if (!ratingBreakdownEl) return;

    let html = '';
    for (let star = 5; star >= 1; star--) {
      const count = dist[star] || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;

      html += `
        <div class="bar-row">
          <span class="bar-label">${star} Stars</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%;"></div>
          </div>
          <span class="bar-count">${count} (${pct}%)</span>
        </div>
      `;
    }
    ratingBreakdownEl.innerHTML = html;
  }

  // --- Render Feedback Cards ---
  function renderFeedbackList(items) {
    if (!items || items.length === 0) {
      feedbackListEl.innerHTML = `
        <div class="empty-state">
          <p>No feedback matching criteria. Be the first to submit!</p>
        </div>
      `;
      return;
    }

    feedbackListEl.innerHTML = items.map(item => {
      const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
      const initials = item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let badgeClass = 'badge-general';
      if (item.category === 'Praise') badgeClass = 'badge-praise';
      else if (item.category === 'Bug Report') badgeClass = 'badge-bug';
      else if (item.category === 'Feature Request') badgeClass = 'badge-feature';

      return `
        <div class="feedback-card">
          <div class="fb-card-header">
            <div class="fb-user">
              <div class="fb-avatar">${initials}</div>
              <div>
                <div class="fb-name">${escapeHtml(item.name)}</div>
                <div class="fb-date">${formattedDate}</div>
              </div>
            </div>
            <span class="fb-badge ${badgeClass}">${escapeHtml(item.category)}</span>
          </div>
          <div class="fb-rating" title="${item.rating} out of 5 stars">${stars}</div>
          <div class="fb-message">${escapeHtml(item.message)}</div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Task 1 & 4: Form Submission Flow ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateClientForm()) {
      showToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    submitBtn.disabled = true;
    btnText.textContent = 'Submitting...';
    btnSpinner.classList.remove('hidden');

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      rating: parseInt(ratingInput.value),
      category: categoryInput.value,
      message: messageInput.value.trim()
    };

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Success!', result.message, 'success');

        // Reset form
        form.reset();
        selectedRating = 0;
        ratingInput.value = '';
        highlightStars(0, 'active');
        
        // Refresh feed & stats
        await fetchFeedbackData();
        await fetchStats();
      } else {
        if (result.errors) {
          Object.keys(result.errors).forEach(fieldName => {
            setFieldError(fieldName, result.errors[fieldName]);
          });
        }
        showToast('Submission Failed', result.message || 'Please check your input.', 'error');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showToast('Network Error', 'Could not reach backend API server.', 'error');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Submit Feedback';
      btnSpinner.classList.add('hidden');
    }
  });

  // Filter & Sort Change Events
  if (filterCategorySelect) {
    filterCategorySelect.addEventListener('change', () => fetchFeedbackData());
  }

  if (sortBySelect) {
    sortBySelect.addEventListener('change', () => fetchFeedbackData());
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchFeedbackData();
      fetchStats();
    });
  }

  // Initial Data Load
  fetchFeedbackData();
  fetchStats();
});
