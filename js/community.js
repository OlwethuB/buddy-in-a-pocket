// =========================================================
// SCREEN 9 — STUDY COMMUNITY
// File: js/community.js
// Local mock: pairing, cohort insights, campus groups,
// plus joined groups with an update/chat block and search.
// =========================================================

window.community = {
  render() {
    return `
      <section class="stack">
        <div class="page-heading">
          <p class="eyebrow">STUDY, TOGETHER</p>
          <h1>You don't have to build a routine alone.</h1>
          <p class="muted">Connection without competition or exposure of personal mood data.</p>
        </div>

        <section class="card">
          <h2>Study-buddy pairing</h2>
          <p class="muted">Share weekly session counts, not mood entries or quiz answers.</p>
          <button class="button button-primary" id="open-pair">Connect a study buddy</button>
          <p id="pair-status" role="status" class="success-message"></p>
        </section>

        <section class="card">
          <h2>Anonymous cohort insights</h2>
          <p>Example module: Psychology 101</p>
          <div class="stats">
            <div class="stat-card">
              <span class="stat-label">Cohort average</span>
              <strong class="stat-value">72%</strong>
            </div>
            <div class="stat-card">
              <span class="stat-label">Your demo score</span>
              <strong class="stat-value">81%</strong>
            </div>
          </div>
          <p class="help-text">Illustrative figures only. They are not collected from actual students.</p>
        </section>

        <section class="card">
          <h2>Find a group or pair</h2>
          <div class="field">
            <label for="group-search">Search by name or module</label>
            <input id="group-search" type="search" placeholder="e.g. Psychology">
          </div>
          <div id="group-list" class="schedule-list"></div>
        </section>

        <section class="card">
          <h2>Your joined communities</h2>
          <p class="muted">These are demo groups saved on this device only.</p>
          <div id="joined-list" class="schedule-list"></div>
        </section>

        <div id="community-modal-host" class="modal-host" hidden></div>
      </section>`;
  },

  afterRender() {
    const app = window.BuddyApp;

    const DEMO_PAIR_KEY = "buddy-demo-pair";
    const DEMO_GROUPS_KEY = "buddy-demo-groups";

    const DEMO_GROUPS = [
      {
        name: "Psychology Study Circle",
        module: "Psychology 101",
        members: 18,
        updates: [
          "We meet on Tuesday evenings. Topic this week: memory and recall.",
          "New shared flashcard set uploaded by a member."
        ]
      },
      {
        name: "First-Year Mathematics",
        module: "Mathematics",
        members: 24,
        updates: [
          "Focus this week: derivatives.",
          "Practice question of the week posted in the group chat."
        ]
      },
      {
        name: "Biology Revision Room",
        module: "Biology",
        members: 15,
        updates: [
          "Lab report Q&A in the chat on Thursday.",
          "Reminder: check the pinned glossary."
        ]
      }
    ];

    const status = document.getElementById("pair-status");
    const groupList = document.getElementById("group-list");
    const joinedList = document.getElementById("joined-list");
    const searchInput = document.getElementById("group-search");
    const modalHost = document.getElementById("community-modal-host");

    // ---- modal helpers ------------------------------------------------
    function closeModal() {
      modalHost.hidden = true;
      modalHost.replaceChildren();
    }

    function openModal({ title, body, primaryLabel, onPrimary }) {
      modalHost.replaceChildren();
      modalHost.hidden = false;

      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";

      const panel = document.createElement("div");
      panel.className = "modal";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", "community-modal-title");

      const h = document.createElement("h2");
      h.id = "community-modal-title";
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
      cancel.addEventListener("click", closeModal);

      const primary = document.createElement("button");
      primary.type = "button";
      primary.className = "button button-primary";
      primary.textContent = primaryLabel;
      primary.addEventListener("click", () => onPrimary(content));

      actions.append(cancel, primary);
      panel.append(h, content, actions);
      modalHost.append(backdrop, panel);
      panel.querySelector("input, select")?.focus();
    }

    // ---- pairing ------------------------------------------------------
    document.getElementById("open-pair").addEventListener("click", () => {
      openModal({
        title: "Connect a study buddy",
        body: `
          <p>Enter an invite code. This prototype saves the pairing on
             this device only — no other student is contacted.</p>
          <div class="field">
            <label for="pair-code">Invite code</label>
            <input id="pair-code" maxlength="40" placeholder="Enter a demo invite code">
          </div>
          <p id="pair-error" class="error-message" role="alert" hidden></p>`,
        primaryLabel: "Connect",
        onPrimary(content) {
          const code = content.querySelector("#pair-code").value.trim();
          const err = content.querySelector("#pair-error");
          if (!code) {
            err.textContent = "Enter an invite code first.";
            err.hidden = false;
            return;
          }
          localStorage.setItem(DEMO_PAIR_KEY, code);
          closeModal();
          status.textContent =
            `Demo pairing saved (code "${code}"). No other student has been contacted.`;
        }
      });
    });

    // ---- group search + list ----------------------------------------
    function getJoined() {
      try { return JSON.parse(localStorage.getItem(DEMO_GROUPS_KEY)) || []; }
      catch { return []; }
    }

    function setJoined(list) {
      localStorage.setItem(DEMO_GROUPS_KEY, JSON.stringify(list));
    }

    function renderGroups() {
      const query = (searchInput.value || "").toLowerCase();
      const joined = getJoined();

      groupList.replaceChildren();

      const matches = DEMO_GROUPS.filter(g =>
        !query ||
        g.name.toLowerCase().includes(query) ||
        g.module.toLowerCase().includes(query)
      );

      if (!matches.length) {
        groupList.textContent = "No groups match that search.";
        return;
      }

      matches.forEach(group => {
        const card = document.createElement("article");
        card.className = "schedule-item schedule-item--wide";

        const info = document.createElement("div");
        info.className = "schedule-item__details";
        const title = document.createElement("strong");
        title.textContent = group.name;
        const details = document.createElement("p");
        details.className = "muted";
        details.textContent = `${group.module} · ${group.members} demo members`;
        info.append(title, details);

        const actions = document.createElement("div");
        actions.className = "schedule-item__actions";

        const join = document.createElement("button");
        join.type = "button";
        join.className = "button button-secondary";
        const isJoined = joined.includes(group.name);
        join.textContent = isJoined ? "Leave" : "Join";
        join.addEventListener("click", () => {
          const current = getJoined();
          if (current.includes(group.name)) {
            setJoined(current.filter(n => n !== group.name));
            app.announce(`Left ${group.name}.`);
          } else {
            setJoined([...current, group.name]);
            app.announce(`Joined ${group.name}.`);
          }
          renderGroups();
          renderJoined();
        });

        actions.append(join);
        card.append(info, actions);
        groupList.appendChild(card);
      });
    }

    function renderJoined() {
      const joined = getJoined();
      joinedList.replaceChildren();

      if (!joined.length) {
        joinedList.textContent = "You haven't joined a group yet. Use the search above.";
        return;
      }

      joined.forEach(name => {
        const group = DEMO_GROUPS.find(g => g.name === name);
        if (!group) return;

        const card = document.createElement("article");
        card.className = "schedule-item schedule-item--wide";

        const info = document.createElement("div");
        info.className = "schedule-item__details";
        const title = document.createElement("strong");
        title.textContent = group.name;
        const sub = document.createElement("p");
        sub.className = "muted";
        sub.textContent = `${group.module} · ${group.members} demo members`;

        // update / chat block
        const updates = document.createElement("div");
        updates.className = "chat-update-block";
        updates.setAttribute("role", "log");
        updates.setAttribute("aria-label", `Updates for ${group.name}`);
        group.updates.forEach(text => {
          const bubble = document.createElement("p");
          bubble.className = "chat-update";
          bubble.textContent = text;
          updates.appendChild(bubble);
        });

        info.append(title, sub, updates);

        const actions = document.createElement("div");
        actions.className = "schedule-item__actions";
        const open = document.createElement("button");
        open.type = "button";
        open.className = "button button-secondary";
        open.textContent = "Post an update";
        open.addEventListener("click", () => {
          openModal({
            title: `Post to ${group.name}`,
            body: `
              <p>Demo only. Your message is stored on this device.</p>
              <div class="field">
                <label for="community-update">Message</label>
                <textarea id="community-update" maxlength="400"
                  placeholder="Share a study tip or question…"></textarea>
              </div>
              <p id="update-error" class="error-message" role="alert" hidden></p>`,
            primaryLabel: "Post",
            onPrimary(content) {
              const text = content.querySelector("#community-update").value.trim();
              const err = content.querySelector("#update-error");
              if (!text) {
                err.textContent = "Write something first.";
                err.hidden = false;
                return;
              }
              group.updates.push(`You: ${text}`);
              closeModal();
              renderJoined();
              app.announce("Update posted to the demo group.");
            }
          });
        });
        actions.append(open);

        card.append(info, actions);
        joinedList.appendChild(card);
      });
    }

    searchInput.addEventListener("input", renderGroups);
    renderGroups();
    renderJoined();
  }
};