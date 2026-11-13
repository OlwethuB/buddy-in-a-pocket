// =========================================================
// SCREEN 3 — CONVERSATIONAL CHECK-IN
// File: js/conversation.js
// =========================================================

window.conversation = {
  render() {
    const s = window.BuddyApp.state;
    const returning = (s.daysAway || 0) >= 3;
    const tone = s.tone || "balanced";

    const greetByTone = {
      gentle: {
        returning: "I noticed you've been away for a little while. Want to try a 10-minute session and ease back into your routine?",
        fresh: "Hi! How are you finding your studies today? We can make the next step smaller if you need to."
      },
      balanced: {
        returning: "I noticed you've been away for a little while. Want to try a 10-minute session and ease back into your routine?",
        fresh: "Hi! How are you finding your studies today? We can make the next step smaller if you need to."
      },
      honest: {
        returning: "You've been away a while. The work hasn't moved. Want to try a 10-minute session and get back into it?",
        fresh: "Let's not overthink this. What's the one thing you can start with today?"
      }
    };

    const greet = greetByTone[tone] || greetByTone.balanced;
    const greeting = returning ? greet.returning : greet.fresh;

    const buddyMark = `<svg aria-hidden="true" width="16" height="16"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
      style="vertical-align:-2px;margin-right:4px">
      <path d="M12 21c-4-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-4 7-8 10z"/>
    </svg>`;

    return `
      <section class="stack" aria-labelledby="chat-title">
        <div class="page-heading">
          <p class="eyebrow">A MOMENT WITH BUDDY</p>
          <h1 id="chat-title">Let's figure out your next step.</h1>
          <p class="muted">You can talk about studying, planning or getting started.</p>
        </div>

        <section class="card chat-panel">
          <div>
            <span class="pill">${buddyMark} Buddy · Mock AI</span>
            <p class="help-text">Responses are simulated for this prototype.</p>
          </div>

          <div class="chat-messages" id="chat-messages"
               role="log" aria-label="Conversation with Buddy"
               aria-live="polite" aria-relevant="additions">
            <div class="chat-message buddy">
              <strong>Buddy</strong><br>
              ${greeting}
            </div>
          </div>

          <div class="button-row">
            <button class="button button-primary" data-start-session="10">
              Yes, let's do 10 minutes
            </button>
            <button class="button button-secondary" id="chat-later">
              Maybe later
            </button>
          </div>

          <form id="chat-form" class="chat-form">
            <label for="chat-input" class="sr-only">Your message to Buddy</label>
            <input id="chat-input" maxlength="500"
              placeholder="Tell Buddy what's on your mind…"
              autocomplete="off" required>
            <button class="button button-primary" type="submit">Send</button>
          </form>

          <p id="chat-status" class="help-text" aria-live="polite"></p>
        </section>

        <section class="card" aria-labelledby="timer-title">
          <p class="eyebrow">YOUR FOCUS SESSION</p>
          <h2 id="timer-title">Time remaining</h2>
          <p id="session-timer" class="stat-value" aria-label="Session time remaining">Ready when you are</p>
          <p class="muted">The timer keeps running in the background and recovers if the tab is suspended.</p>
          <div class="button-row">
            <button class="button button-primary" data-end-session>Finish session</button>
            <button class="button button-quiet" data-cancel-session>Cancel without penalty</button>
          </div>
        </section>
      </section>`;
  },

  afterRender() {
    const app = window.BuddyApp;
    const messages = document.getElementById("chat-messages");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const status = document.getElementById("chat-status");

    if (window.BuddyTimer) window.BuddyTimer.resume();

    function addMessage(text, who) {
      const bubble = document.createElement("div");
      bubble.className = `chat-message ${who}`;

      const label = document.createElement("strong");
      label.textContent = who === "buddy" ? "Buddy" : "You";

      const content = document.createElement("p");
      content.textContent = text;

      bubble.append(label, document.createElement("br"), content);
      messages.appendChild(bubble);
      bubble.scrollIntoView({ block: "nearest", behavior: "auto" });
    }

    const laterByTone = {
      gentle: "No problem. I'll be here when you're ready.",
      balanced: "No problem. I'll be here when you're ready.",
      honest: "Fine. When you're ready, come back and start with one small task."
    };

    document.getElementById("chat-later").addEventListener("click", () => {
      const tone = window.BuddyApp.state.tone || "balanced";
      addMessage(laterByTone[tone] || laterByTone.balanced, "buddy");
      app.announce("You can return to your study routine whenever you are ready.");
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      addMessage(message, "user");
      input.value = "";
      input.disabled = true;
      form.querySelector("button").disabled = true;
      status.textContent = "Buddy is preparing a demo response…";

      try {
        const result = await window.BuddyAI.respond(message);
        addMessage(result.text, "buddy");

        if (result.crisis) {
          const notice = document.createElement("p");
          notice.className = "error-message";
          notice.textContent = "This prototype is not a crisis service. Contact emergency services if you are in immediate danger. In South Africa, SADAG can be reached at 0800 567 567.";
          messages.appendChild(notice);
        }

        status.textContent = "Demo response received.";
      } catch {
        status.textContent = "The demo response could not be generated. Please try again.";
      } finally {
        input.disabled = false;
        form.querySelector("button").disabled = false;
        input.focus();
      }
    });
  }
};
