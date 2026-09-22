# Level 5: Final Touch & Review - CodeNova Solutions & Feedback Hub

A full-stack web application featuring a corporate IT landing page layout (**CodeNova Solutions** theme) integrated with a dynamic feedback form, SQLite persistent storage, real-time community feed analytics, live filtering & sorting, and backend input validation.

---

## 🚀 Features & Tasks Completed

- **Task 1: Basic Styling & UI Readability Improvement**
  - Designed responsive corporate layout with top contact bar, sticky header navbar, hero section with glowing tech visual, floating 16+ years experience badge, about section with 1M+ customer badge, 4-card services grid, and community feedback hub.
  - Distinct category badges (Praise = green, Bug Report = red, Feature Request = purple, General = blue).
  - High contrast typography, star rating animations, and toast notification popups.

- **Task 2: Ensure Navigation Links Function Correctly**
  - Interactive header navbar with active link highlight on scroll (`#home`, `#about`, `#services`, `#feedback-hub`, `#analytics`, `#contact`).
  - Smooth scrolling behavior (`html { scroll-behavior: smooth; }`).

- **Task 3: Verify Feedback Data Storage & Display Accuracy**
  - Persistent SQLite storage (`feedback.db`) utilizing Node.js `node:sqlite`.
  - Backend validation preventing empty or malformed inputs.
  - Live category filtering (All, General, Bug Report, Feature Request, Praise) and sorting (Newest, Oldest, Highest Rating, Lowest Rating).
  - Real-time rating breakdown analytics and average star rating calculation.

- **Task 4: Complete Feedback Flow Testing**
  - Full automated test suite in `test-api.js` covering 6 API test cases:
    1. Initial GET feedback retrieval.
    2. Backend validation rejection (HTTP 400).
    3. Valid feedback creation & persistence (HTTP 201).
    4. Category filtering query.
    5. Rating sorting query.
    6. Analytics & stats metrics.

---

## 📁 Project Structure

```text
.
├── package.json          # Node.js dependencies and scripts
├── server.js             # Express backend server REST endpoints & validation
├── db.js                 # SQLite database helper module & persistence
├── test-api.js           # Automated test suite (6 test cases)
├── feedback.db           # SQLite database file
├── README.md             # Project documentation
└── public/               # Frontend static assets
    ├── index.html        # CodeNova frontpage layout & feedback hub
    ├── style.css         # Responsive styling, navigation, & theme colors
    └── app.js            # Client-side JavaScript (nav, validation, fetch API)
```

---

## 🛠️ Quick Start & Testing

### 1. Start Server
Run the Express server locally:
```bash
npm start
```
Or with `cmd`:
```bash
cmd /c npm start
```
Then open your browser and navigate to:
**`http://localhost:3000`**

### 2. Run Automated Tests
Execute the 6 API & validation test suites:
```bash
npm test
```
Or with `cmd`:
```bash
cmd /c npm test
```

---

## 🧪 Tech Stack
- **Backend**: Node.js, Express, SQLite (`node:sqlite`), CORS
- **Frontend**: HTML5, CSS3 (Flexbox/Grid, Animations), Vanilla JavaScript (ES6+ Fetch API)
