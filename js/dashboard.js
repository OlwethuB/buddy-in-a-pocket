// =========================================================
// SCREEN 2 — DASHBOARD
// File: js/dashboard.js
// =========================================================

window.dashboard = {
  render() {
    const app = window.BuddyApp;
    const s = app.state;
    const e = app.escapeHTML;

    const hourly = window.BuddyContent.getCurrent();
    const content = hourly.item;
    const hourlyText = typeof content === "string"
      ? content
      : content.ref ? `${content.ref} — ${content.theme}` : content.q;

    const hourlyCard = `
        <section class="card hourly-card" aria-labelledby="hourly-title">
            <p class="eyebrow">YOUR HOURLY PAUSE</p>
            <h2 id="hourly-title">${e(hourly.title)}</h2>
            <p>${e(hourlyText)}</p>
            <p class="help-text">A fresh thought at the start of each hour.</p>
            ${hourly.category === "riddles"
        ? `<button type="button" class="button button-secondary"
                     id="reveal-riddle">Reveal answer</button>
                   <p id="riddle-answer" hidden>${e(content.a)}</p>`
        : ""}
        </section>`;

    return `
      <section class="stack" aria-labelledby="dashboard-title">
        <div class="page-heading">
          <p class="eyebrow">YOUR SPACE</p>
          <h1 id="dashboard-title">Small steps make big changes.</h1>
          <p class="muted">Welcome back. Let's make today manageable.</p>
        </div>

        <div class="stats">
          <article class="card stat-card">
            <span class="stat-label">Study streak</span>
            <strong class="stat-value">${s.streak} days</strong>
            <small>Every return is a fresh start.</small>
          </article>
          <article class="card stat-card">
            <span class="stat-label">Session length</span>
            <strong class="stat-value">${s.sessionMinutes} min</strong>
            <small>Choose a realistic duration.</small>
          </article>
          <article class="card stat-card">
            <span class="stat-label">Sessions completed</span>
            <strong class="stat-value">${s.sessions}</strong>
            <small>${s.totalMinutes} total study minutes</small>
          </article>
        </div>

        <div class="hero hero-grid">
          <div>
            <p class="eyebrow">YOUR NEXT SMALL STEP</p>
            <h2>Ready to focus?</h2>
            <p>Choose one task. I'll help you make a start.</p>

            <div class="field">
              <label for="session-length">Study session length</label>
              <select id="session-length">
                ${[5, 10, 15, 25, 45, 60, 90].map(n =>
      `<option value="${n}" ${s.sessionMinutes === n ? "selected" : ""}>${n} minutes</option>`
    ).join("")}
              </select>
            </div>

            <button class="button button-primary button-block" id="dashboard-start">
              Start Session
            </button>
          </div>
          <div class="buddy-illustration" aria-hidden="true">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.2" stroke-linecap="round"
                 stroke-linejoin="round">
              <path d="M12 21c-4-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-4 7-8 10z"/>
            </svg>
          </div>
        </div>

        ${hourlyCard}

        <div class="grid-2">
          <article class="card quick-card">
            <span class="quick-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
            </span>
            <h2>Build your weekly plan</h2>
            <p class="muted">Plan around your modules and available time.</p>
            <button class="button button-secondary" data-screen="7">
              Create a schedule
            </button>
          </article>

          <article class="card quick-card">
            <span class="quick-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M7 9h6M7 13h6"/></svg>
            </span>
            <h2>Practise active recall</h2>
            <p class="muted">Review your flashcards one at a time.</p>
            <button class="button button-secondary" data-screen="4">Open flashcards</button>
          </article>

          <article class="card quick-card">
            <span class="quick-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <h2>Check in with Buddy</h2>
            <p class="muted">Talk through what is on your mind.</p>
            <button class="button button-secondary" data-screen="3">Start a check-in</button>
          </article>

          <article class="card quick-card">
            <span class="quick-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
            </span>
            <h2>Notice how you're feeling</h2>
            <p class="muted">Reflect after a study session.</p>
            <button class="button button-secondary" data-screen="5">Mood check-in</button>
          </article>
        </div>

        <p class="help-text">Prototype note: your progress is stored locally in this browser, not in a student account.</p>
      </section>`;
  },

  afterRender() {
    const app = window.BuddyApp;

    document.getElementById("dashboard-start").addEventListener("click", () => {
      const minutes = Number(document.getElementById("session-length").value);
      app.startSession(minutes);
    });

    const reveal = document.getElementById("reveal-riddle");
    if (reveal) {
      reveal.addEventListener("click", () => {
        const answer = document.getElementById("riddle-answer");
        answer.hidden = false;
        reveal.hidden = true;
      });
    }
  }
};
