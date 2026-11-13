// =========================================================
// SCREEN 5 — POST-SESSION MOOD CHECK-IN
// File: js/mood.js
// =========================================================

window.mood = {
  render() {
    const s = window.BuddyApp.state;

    const icon = {
      good: `<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>`,
      okay: `<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg>`,
      low: `<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/></svg>`
    };

    return `
      <section class="stack" aria-labelledby="mood-title">
        <div class="page-heading">
          <p class="eyebrow">PAUSE AND REFLECT</p>
          <h1 id="mood-title">How are you feeling after that session?</h1>
          <p class="muted">There's no right or wrong answer. This is just a moment to check in with yourself.</p>
        </div>

        <section class="card stack">
          <div class="buddy-illustration" aria-hidden="true">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 21c-4-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-4 7-8 10z"/>
            </svg>
          </div>

          <div id="mood-options" class="mood-options" role="group" aria-label="Choose how you feel">
            <button class="mood-option" data-mood="good" aria-pressed="false">
              <span class="emoji">${icon.good}</span>
              <strong>Good</strong>
              <small>Feeling okay</small>
            </button>
            <button class="mood-option" data-mood="okay" aria-pressed="false">
              <span class="emoji">${icon.okay}</span>
              <strong>Okay</strong>
              <small>Somewhere in between</small>
            </button>
            <button class="mood-option" data-mood="low" aria-pressed="false">
              <span class="emoji">${icon.low}</span>
              <strong>Not great</strong>
              <small>Could use some care</small>
            </button>
          </div>

          <p id="mood-response" class="success-message" aria-live="polite" hidden></p>

          <div class="button-row">
            <button id="mood-save" class="button button-primary" disabled>Save check-in</button>
            <button class="button button-secondary" data-screen="2">Skip for now</button>
          </div>

          <p class="help-text">
            Mood check-ins are optional. In this prototype, entries are stored
            only in this browser and are not sent to a person or AI service.
          </p>
        </section>

        <section class="card">
          <h2>Your recent reflections</h2>
          <p class="muted">These are personal reflections, not a diagnosis or mental-health assessment.</p>
          <div class="schedule-list" id="mood-history">
            ${s.moodEntries.length
        ? s.moodEntries.slice(-5).reverse().map(entry => `
                <article class="schedule-item">
                  <strong>${new Date(entry.date).toLocaleDateString()}</strong>
                  <span>${({ good: "Good", okay: "Okay", low: "Not great" })[entry.mood]}</span>
                </article>
              `).join("")
        : "<p>No check-ins yet. You can choose to record one above.</p>"}
          </div>
        </section>

        <section class="soft-card">
          <h2>One thing to remember</h2>
          <p>You showed up for yourself today. Your progress doesn't have to be perfect to count.</p>
          <button class="button button-primary" data-screen="2">Back to dashboard</button>
        </section>
      </section>`;
  },

  afterRender() {
    const app = window.BuddyApp;
    let selectedMood = null;

    const toneMessages = {
      gentle: {
        good: "That's lovely to hear. Notice what helped you feel good today.",
        okay: "Okay is a completely valid place to be. You don't need to force anything.",
        low: "Thank you for checking in. Please be gentle with yourself — a break or a kind word might help."
      },
      balanced: {
        good: "I'm glad you're feeling good. Notice what helped you get here.",
        okay: "Okay is a valid place to be. You don't have to force a different feeling.",
        low: "Thank you for checking in. Consider a break or talking with someone you trust if that would help."
      },
      honest: {
        good: "Good — you did the work. Now build on the moment while you have momentum.",
        okay: "Okay means you showed up. That's enough for today. Let's make tomorrow count.",
        low: "Studying while feeling low is hard. Take the break you need — no guilt, just reset."
      }
    };

    function toneMessage(mood) {
      const tone = window.BuddyApp.state.tone || "balanced";
      const set = toneMessages[tone] || toneMessages.balanced;
      return set[mood];
    }

    document.querySelectorAll("[data-mood]").forEach(button => {
      button.addEventListener("click", () => {
        selectedMood = button.dataset.mood;

        document.querySelectorAll("[data-mood]").forEach(other => {
          other.setAttribute("aria-pressed", String(other === button));
        });

        const response = document.getElementById("mood-response");
        response.textContent = toneMessage(selectedMood);
        response.hidden = false;
        document.getElementById("mood-save").disabled = false;
      });
    });

    document.getElementById("mood-save").addEventListener("click", () => {
      if (!selectedMood) return;

      app.state.moodEntries.push({
        mood: selectedMood,
        date: new Date().toISOString()
      });

      app.state.moodEntries = app.state.moodEntries.slice(-30);
      app.save();
      app.announce("Mood check-in saved.");

      app.goTo(2);
    });
  }
};