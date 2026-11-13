// =========================================================
// SCREEN 1 & 10 — WELCOME / SETTINGS
// File: js/settings.js
// Single screen that serves as both welcome (first visit)
// and settings (return visits).
// =========================================================

window.settings = {
  render() {
    const app = window.BuddyApp;
    const currentTone = app.state.tone || "balanced";
    const currentPeriod =
      localStorage.getItem("buddy-study-period") || "morning";
    const currentWeekend =
      localStorage.getItem("buddy-weekend-pref") || "both";
    const welcomed = localStorage.getItem("buddy-pocket-prototype-v1-welcomed");

    const toneOptions = [
      {
        id: "gentle",
        label: "Gentle",
        desc: "Patient and reassuring",
        svg: `<path d="M12 21c-4-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-4 7-8 10z"/>`
      },
      {
        id: "balanced",
        label: "Balanced",
        desc: "Supportive and practical",
        svg: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`
      },
      {
        id: "honest",
        label: "Brutally Honest",
        desc: "Direct, without insults",
        svg: `<path d="M4 12h16M12 4v16"/>`
      }
    ];

    const periodOptions = [
      { id: "earlyMorning", label: "Early morning", range: "05:00–07:00" },
      { id: "morning", label: "Morning", range: "07:00–12:00" },
      { id: "afternoon", label: "Afternoon", range: "12:00–17:00" },
      { id: "evening", label: "Evening", range: "17:00–20:00" },
      { id: "night", label: "Night", range: "20:00–23:00" },
      { id: "twilight", label: "Twilight zone", range: "23:00–05:00" }
    ];

    const weekendOptions = [
      { id: "both", label: "Both days", desc: "Saturday & Sunday" },
      { id: "saturday", label: "Saturday only", desc: "Sat" },
      { id: "sunday", label: "Sunday only", desc: "Sun" },
      { id: "weekendsOnly", label: "Weekends only", desc: "No weekdays" },
      { id: "none", label: "Weekdays only", desc: "Don't use weekends" }
    ];

    return `
      <section class="stack">
        <div class="page-heading">
          <p class="eyebrow">${welcomed ? "YOUR PREFERENCES" : "WELCOME TO BUDDY"}</p>
          <h1>${welcomed ? "Make Buddy feel right for you." : "Let's set Buddy up for you."}</h1>
          <p class="muted">
            ${welcomed
              ? "You can change these preferences whenever you need to."
              : "Choose how Buddy should support you. You can change this any time in Settings."}
          </p>
        </div>

        <section class="card">
          <h2>Buddy's tone</h2>
          <div class="option-blocks" role="group" aria-label="Buddy tone">
            ${toneOptions.map(o => `
              <button type="button"
                class="option-block ${currentTone === o.id ? "selected" : ""}"
                data-tone="${o.id}"
                aria-pressed="${currentTone === o.id}">
                <span class="option-block__icon">
                  <svg aria-hidden="true" width="26" height="26"
                       viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="1.7"
                       stroke-linecap="round" stroke-linejoin="round">
                    ${o.svg}
                  </svg>
                </span>
                <span class="option-block__body">
                  <strong>${o.label}</strong>
                  <small>${o.desc}</small>
                </span>
              </button>`).join("")}
          </div>
        </section>

        <section class="card">
          <h2>Preferred study period</h2>
          <p class="muted">Buddy will default to this period when planning sessions.</p>
          <div class="option-blocks option-blocks--compact"
               role="group" aria-label="Preferred study period">
            ${periodOptions.map(o => `
              <button type="button"
                class="option-block ${currentPeriod === o.id ? "selected" : ""}"
                data-period="${o.id}"
                aria-pressed="${currentPeriod === o.id}">
                <span class="option-block__body">
                  <strong>${o.label}</strong>
                  <small>${o.range}</small>
                </span>
              </button>`).join("")}
          </div>
        </section>

        <section class="card">
          <h2>Weekend study</h2>
          <p class="muted">Should Buddy schedule sessions on weekends?</p>
          <div class="option-blocks option-blocks--compact"
               role="group" aria-label="Weekend study preference">
            ${weekendOptions.map(o => `
              <button type="button"
                class="option-block ${currentWeekend === o.id ? "selected" : ""}"
                data-weekend="${o.id}"
                aria-pressed="${currentWeekend === o.id}">
                <span class="option-block__body">
                  <strong>${o.label}</strong>
                  <small>${o.desc}</small>
                </span>
              </button>`).join("")}
          </div>
        </section>

        <section class="card">
          <div class="button-row">
            <button class="button button-primary" id="save-settings">
              Save preferences
            </button>
            <button class="button button-secondary" id="reset-settings">
              Reset customisation
            </button>
          </div>
          <p id="settings-status" role="status" class="success-message"></p>

          ${!welcomed ? `
            <div class="button-row" style="margin-top:16px">
              <button class="button button-primary button-block" id="welcome-continue">
                Continue to dashboard
              </button>
            </div>
          ` : ""}
        </section>

        <section class="soft-card">
          <h2>What reset means</h2>
          <p>Reset restores Buddy's default tone and study preferences. It does not erase your notes, timetable, study history or mood check-ins.</p>
        </section>

        <div id="settings-modal-host" class="modal-host" hidden></div>
      </section>`;
  },

  afterRender() {
    const app = window.BuddyApp;
    const status = document.getElementById("settings-status");
    const modalHost = document.getElementById("settings-modal-host");

    let selectedTone = app.state.tone || "balanced";
    let selectedPeriod = localStorage.getItem("buddy-study-period") || "morning";
    let selectedWeekend = localStorage.getItem("buddy-weekend-pref") || "both";

    function setTone(id) {
      selectedTone = id;
      document.querySelectorAll("[data-tone]").forEach(btn => {
        const on = btn.dataset.tone === id;
        btn.classList.toggle("selected", on);
        btn.setAttribute("aria-pressed", String(on));
      });
    }

    function setPeriod(id) {
      selectedPeriod = id;
      document.querySelectorAll("[data-period]").forEach(btn => {
        const on = btn.dataset.period === id;
        btn.classList.toggle("selected", on);
        btn.setAttribute("aria-pressed", String(on));
      });
    }

    function setWeekend(id) {
      selectedWeekend = id;
      document.querySelectorAll("[data-weekend]").forEach(btn => {
        const on = btn.dataset.weekend === id;
        btn.classList.toggle("selected", on);
        btn.setAttribute("aria-pressed", String(on));
      });
    }

    let pendingTone = null;

    function clearPendingTone() {
      document.querySelectorAll("[data-tone]").forEach(btn => {
        btn.classList.remove("pending");
        btn.removeAttribute("aria-busy");
      });
      pendingTone = null;
    }

    document.querySelectorAll("[data-tone]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.tone;
        if (id === selectedTone) return;

        if (id === "honest" && app.state.tone !== "honest") {
          clearPendingTone();
          pendingTone = id;
          btn.classList.add("pending");
          btn.setAttribute("aria-busy", "true");

          openConfirmToneModal(
            () => {
              setTone(id);
              clearPendingTone();
              closeModal();
              app.announce("Brutally Honest tone selected.");
            },
            () => {
              clearPendingTone();
              closeModal();
              app.announce("Tone change cancelled.");
            }
          );
          return;
        }

        setTone(id);
        app.announce("Tone preference updated.");
      });
    });

    document.querySelectorAll("[data-period]").forEach(btn => {
      btn.addEventListener("click", () => setPeriod(btn.dataset.period));
    });

    document.querySelectorAll("[data-weekend]").forEach(btn => {
      btn.addEventListener("click", () => setWeekend(btn.dataset.weekend));
    });

    function closeModal() {
      modalHost.hidden = true;
      modalHost.replaceChildren();
    }

    function openModal({ title, body, primaryLabel, onPrimary, onCancel, danger = false }) {
      modalHost.replaceChildren();
      modalHost.hidden = false;

      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";

      const panel = document.createElement("div");
      panel.className = "modal";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", "settings-modal-title");

      const h = document.createElement("h2");
      h.id = "settings-modal-title";
      h.textContent = title;

      const content = document.createElement("div");
      content.className = "modal-body";
      content.innerHTML = body;

      const actions = document.createElement("div");
      actions.className = "button-row";

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "button button-secondary";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => {
        if (typeof onCancel === "function") onCancel();
        else closeModal();
      });

      const primary = document.createElement("button");
      primary.type = "button";
      primary.className = "button " + (danger ? "button-danger" : "button-primary");
      primary.textContent = primaryLabel;
      primary.addEventListener("click", () => onPrimary());

      actions.append(cancel, primary);
      panel.append(h, content, actions);
      modalHost.append(backdrop, panel);
      cancel.focus();
    }

    function openConfirmToneModal(onConfirm, onCancel) {
      openModal({
        title: "Use Brutally Honest tone?",
        body: `<p>Buddy will be straightforward — not insulting. You can switch back at any time.</p>`,
        primaryLabel: "Use this tone",
        onPrimary() { onConfirm(); },
        onCancel
      });
    }

    document.getElementById("save-settings").addEventListener("click", () => {
      app.state.tone = selectedTone;
      localStorage.setItem("buddy-study-period", selectedPeriod);
      localStorage.setItem("buddy-weekend-pref", selectedWeekend);
      app.save();
      status.textContent = "Your preferences have been saved.";
      app.announce(status.textContent);
    });

    document.getElementById("reset-settings").addEventListener("click", () => {
      openModal({
        title: "Reset customisation?",
        body: `<p>This restores default tone and study preferences. Your notes, timetable, study history and mood check-ins are kept.</p>`,
        primaryLabel: "Reset preferences",
        danger: true,
        onPrimary() {
          app.state.tone = "balanced";
          app.state.sessionMinutes = 25;
          localStorage.setItem("buddy-study-period", "morning");
          localStorage.setItem("buddy-weekend-pref", "both");
          app.save();

          setTone("balanced");
          setPeriod("morning");
          setWeekend("both");

          status.textContent =
            "Customisation restored to defaults. Your study data has been kept.";
          app.announce(status.textContent);
          closeModal();
        }
      });
    });

    const welcomeContinue = document.getElementById("welcome-continue");
    if (welcomeContinue) {
      welcomeContinue.addEventListener("click", () => {
        app.state.tone = selectedTone;
        localStorage.setItem("buddy-study-period", selectedPeriod);
        localStorage.setItem("buddy-weekend-pref", selectedWeekend);
        app.save();
        localStorage.setItem("buddy-pocket-prototype-v1-welcomed", "true");
        app.goTo(2);
      });
    }
  }
};
