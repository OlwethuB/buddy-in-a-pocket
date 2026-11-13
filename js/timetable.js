// =========================================================
// SCREEN 7 — MY TIMETABLE
// File: js/timetable.js
// =========================================================

const PRIORITY_META = {
  5: { label: "Urgent", color: "#9e3434", bg: "#fbe9e9" },
  4: { label: "High", color: "#a35c00", bg: "#fdf1e0" },
  3: { label: "Normal", color: "#176b61", bg: "#e3f3ee" },
  2: { label: "Low", color: "#3a6ea5", bg: "#e8f0fa" },
  1: { label: "Someday", color: "#5a7078", bg: "#eef2f4" }
};

function priorityMeta(p) {
  return PRIORITY_META[p] || PRIORITY_META[3];
}

window.timetable = {
  render() {
    const mgr = window.BuddySchedule;

    if (!mgr || typeof mgr.formMarkup !== "function") {
      return `
        <section class="card">
          <h2>Timetable failed to load</h2>
          <p>The schedule module did not load correctly. Reload the page.</p>
          <p class="help-text">If this keeps happening, unregister the service worker in DevTools → Application → Service Workers, then reload.</p>
        </section>`;
    }

    const sharedForm = mgr.formMarkup({ idPrefix: "tbl" });

    return `
      <section class="stack">
        <div class="page-heading">
          <p class="eyebrow">YOUR WEEK, YOUR WAY</p>
          <h1>My study timetable</h1>
          <p class="muted">Prioritise what matters. Change your plan when life changes.</p>
        </div>

        <section class="card">
          <h2>Add a study session</h2>
          <p class="muted">
            Dates and times are optional. Every session is saved to the same
            store used by the dashboard.
          </p>
          ${sharedForm}
        </section>

        <section class="card">
          <div class="calendar-header">
            <h2>Planned sessions</h2>
            <div class="week-nav" role="group" aria-label="Change week">
              <button type="button" class="week-nav__btn" id="plan-prev-week" aria-label="Previous week">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span class="week-nav__label" id="plan-week-label" aria-live="polite">This week</span>
              <button type="button" class="week-nav__btn" id="plan-next-week" aria-label="Next week">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
          <div id="calendar-grid" class="calendar-grid" aria-label="Weekly plan"></div>
          <p class="help-text">Click a day to see and manage its sessions.</p>
        </section>

        <!-- Inline modal host (hidden until needed) -->
        <div id="tbl-modal-host" class="modal-host" hidden></div>
      </section>`;
  },

  afterRender() {
    const app = window.BuddyApp;
    const mgr = window.BuddySchedule;

    const form = document.getElementById("tbl-form");
    const errorEl = document.getElementById("tbl-error");
    const customize = form.querySelector('[data-action="customize"]');
    const generate = form.querySelector('[data-action="generate"]');

    let weekOffset = 0;

    function readForm() {
      return {
        module: document.getElementById("tbl-module").value,
        task: document.getElementById("tbl-task").value,
        date: document.getElementById("tbl-date").value || undefined,
        time: document.getElementById("tbl-time").value || undefined,
        period: document.getElementById("tbl-period").value,
        duration: document.getElementById("tbl-duration").value,
        priority: document.getElementById("tbl-priority").value
      };
    }

    function clearError() {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    const host = document.getElementById("tbl-modal-host");

    function closeModal() {
      host.hidden = true;
      host.replaceChildren();
    }

    function openModal({ title, body, primaryLabel, onPrimary, danger = false }) {
      host.replaceChildren();
      host.hidden = false;

      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";

      const panel = document.createElement("div");
      panel.className = "modal";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", "modal-title");

      const h = document.createElement("h2");
      h.id = "modal-title";
      h.textContent = title;

      const content = document.createElement("div");
      content.className = "modal-body";
      content.innerHTML = body;

      const actions = document.createElement("div");
      actions.className = "button-row";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "button button-secondary";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", closeModal);

      const primaryBtn = document.createElement("button");
      primaryBtn.type = "button";
      primaryBtn.className = "button " + (danger ? "button-danger" : "button-primary");
      primaryBtn.textContent = primaryLabel;
      primaryBtn.addEventListener("click", () => onPrimary(content));

      actions.append(cancelBtn, primaryBtn);
      panel.append(h, content, actions);
      host.append(backdrop, panel);

      panel.querySelector("input, select")?.focus();
    }

    function getWeekDays(offset = 0) {
      const today = new Date();
      const dow = (today.getDay() + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - dow + offset * 7);

      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = d.toLocaleDateString("en-CA");
        return {
          iso,
          label: d.toLocaleDateString("en-ZA", { weekday: "short" }),
          dayNum: d.getDate(),
          isToday: iso === new Date().toLocaleDateString("en-CA")
        };
      });
    }

    function renderCalendar() {
      const grid = document.getElementById("calendar-grid");
      const weekLabel = document.getElementById("plan-week-label");
      grid.replaceChildren();

      const days = getWeekDays(weekOffset);
      const sessions = mgr.list();

      weekLabel.textContent = weekOffset === 0
        ? "This week"
        : weekOffset > 0
          ? `+${weekOffset} week${weekOffset > 1 ? "s" : ""}`
          : `${weekOffset} week${weekOffset < -1 ? "s" : ""}`;

      days.forEach(day => {
        const allDaySessions = sessions.filter(s => s.date === day.iso);
        const activeSessions = allDaySessions.filter(s => s.status !== "cancelled");

        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-day" + (day.isToday ? " calendar-day--today" : "");
        cell.setAttribute(
          "aria-label",
          `${day.label} ${day.dayNum}, ${activeSessions.length} active session${activeSessions.length === 1 ? "" : "s"}`
        );

        const head = document.createElement("div");
        head.className = "calendar-day__head";
        head.innerHTML = `<span class="calendar-day__label">${day.label}</span>
                          <span class="calendar-day__num">${day.dayNum}</span>`;

        const body = document.createElement("div");
        body.className = "calendar-day__body";

        const visible = activeSessions.slice(0, 3);
        visible.forEach(session => {
          const meta = priorityMeta(session.priority);
          const chip = document.createElement("div");
          chip.className = "calendar-chip";
          chip.style.background = meta.bg;
          chip.style.borderLeftColor = meta.color;
          chip.textContent = `${session.time} · ${session.module}`;
          body.appendChild(chip);
        });

        if (activeSessions.length > 3) {
          const more = document.createElement("div");
          more.className = "calendar-more";
          more.textContent = `+${activeSessions.length - 3} more`;
          body.appendChild(more);
        }

        if (activeSessions.length === 0) {
          const empty = document.createElement("div");
          empty.className = "calendar-empty";
          empty.textContent = "—";
          body.appendChild(empty);
        }

        cell.append(head, body);
        cell.addEventListener("click", () => openDayModal(day, allDaySessions));
        grid.appendChild(cell);
      });
    }

    function openDayModal(day, daySessions) {
      const body = daySessions.length
        ? daySessions.map(session => {
            const meta = priorityMeta(session.priority);
            const isCancelled = session.status === "cancelled";
            return `
              <article class="schedule-item schedule-item--wide" style="border-left:4px solid ${meta.color}">
                <div class="schedule-item__details">
                  <strong>${window.BuddyApp.escapeHTML(session.module)}</strong>
                  <p class="muted">${session.time} · ${session.duration} min</p>
                  <p>${window.BuddyApp.escapeHTML(session.task)}</p>
                  <p class="pill" data-priority="${isCancelled ? "cancelled" : session.priority}">
                    ${isCancelled ? "Cancelled" : meta.label}
                  </p>
                  <div class="button-row" style="margin-top:8px">
                    <button type="button" class="button button-secondary" data-edit="${session.id}">Edit</button>
                    ${!isCancelled
                      ? `<button type="button" class="button button-quiet" data-cancel="${session.id}">Cancel</button>`
                      : `<button type="button" class="button button-quiet" data-restore="${session.id}">Restore</button>
                         <button type="button" class="button button-danger" data-delete="${session.id}">Delete</button>`}
                  </div>
                </div>
              </article>`;
          }).join("")
        : `<p class="muted">No sessions scheduled on ${day.label} ${day.dayNum}.</p>`;

      openModal({
        title: `${day.label} ${day.dayNum}`,
        body,
        primaryLabel: "Close",
        onPrimary() { closeModal(); }
      });

      host.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = mgr.list().find(x => x.id === btn.dataset.edit);
          if (s) { closeModal(); editSession(s); }
        });
      });
      host.querySelectorAll("[data-cancel]").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = mgr.list().find(x => x.id === btn.dataset.cancel);
          if (s) { closeModal(); cancelSession(s); }
        });
      });
      host.querySelectorAll("[data-restore]").forEach(btn => {
        btn.addEventListener("click", () => {
          mgr.undoCancel(btn.dataset.restore);
          closeModal();
          renderCalendar();
          app.announce("Session restored.");
        });
      });
      host.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = mgr.list().find(x => x.id === btn.dataset.delete);
          if (s) { closeModal(); deleteSession(s); }
        });
      });
    }

    function editSession(session) {
      const periods = mgr.getPeriods();
      const body = `
        <div class="field">
          <label for="edit-module">Module</label>
          <input id="edit-module" value="${window.BuddyApp.escapeHTML(session.module)}">
        </div>
        <div class="field">
          <label for="edit-task">Study task</label>
          <input id="edit-task" value="${window.BuddyApp.escapeHTML(session.task)}">
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="edit-period">Study period</label>
            <select id="edit-period">
              ${Object.entries(periods).map(([k, v]) =>
                `<option value="${k}" ${session.period === k ? "selected" : ""}>${v.label}</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label for="edit-duration">Duration</label>
            <select id="edit-duration">
              ${[10, 15, 25, 30, 45, 60, 90].map(n =>
                `<option value="${n}" ${session.duration === n ? "selected" : ""}>${n} minutes</option>`
              ).join("")}
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="edit-date">Date <span class="muted">(optional)</span></label>
            <input id="edit-date" type="date" value="${session.date}">
          </div>
          <div class="field">
            <label for="edit-time">Start time <span class="muted">(optional)</span></label>
            <input id="edit-time" type="time" value="${session.time}">
          </div>
        </div>
        <div class="field">
          <label for="edit-priority">Priority</label>
          <select id="edit-priority">
            <option value="5" ${session.priority === 5 ? "selected" : ""}>Urgent</option>
            <option value="4" ${session.priority === 4 ? "selected" : ""}>High</option>
            <option value="3" ${session.priority === 3 ? "selected" : ""}>Normal</option>
            <option value="2" ${session.priority === 2 ? "selected" : ""}>Low</option>
            <option value="1" ${session.priority === 1 ? "selected" : ""}>Someday</option>
          </select>
        </div>
        <p id="edit-error" class="error-message" role="alert" hidden></p>`;

      openModal({
        title: "Edit session",
        body,
        primaryLabel: "Save changes",
        onPrimary(content) {
          const err = content.querySelector("#edit-error");
          try {
            mgr.update(session.id, {
              module: content.querySelector("#edit-module").value,
              task: content.querySelector("#edit-task").value,
              period: content.querySelector("#edit-period").value,
              duration: content.querySelector("#edit-duration").value,
              date: content.querySelector("#edit-date").value,
              time: content.querySelector("#edit-time").value,
              priority: content.querySelector("#edit-priority").value
            });
            closeModal();
            renderCalendar();
            app.announce("Session updated.");
          } catch (e) {
            err.textContent = e.message;
            err.hidden = false;
          }
        }
      });
    }

    function cancelSession(session) {
      openModal({
        title: "Cancel session?",
        body: `<p>You can undo this at any time. No penalty.</p>`,
        primaryLabel: "Cancel session",
        danger: true,
        onPrimary() {
          mgr.cancel(session.id);
          closeModal();
          renderCalendar();
          app.announce("Session cancelled. You can undo this.");
        }
      });
    }

    function deleteSession(session) {
      openModal({
        title: "Delete permanently?",
        body: `<p>This cannot be undone. The session will be removed from your timetable.</p>`,
        primaryLabel: "Delete",
        danger: true,
        onPrimary() {
          mgr.remove(session.id);
          closeModal();
          renderCalendar();
          app.announce("Session deleted.");
        }
      });
    }

    customize.addEventListener("click", event => {
      event.preventDefault();
      clearError();
      try {
        mgr.create(readForm());
        renderCalendar();
        app.announce("Study session added to your timetable.");
        form.reset();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });

    if (generate) {
      generate.addEventListener("click", async () => {
        clearError();
        const data = readForm();
        if (!data.module.trim()) {
          errorEl.textContent = "Enter at least one module to generate a plan.";
          errorEl.hidden = false;
          return;
        }
        const hoursValue = Number(document.getElementById("tbl-hours").value);
        if (!Number.isFinite(hoursValue) || hoursValue < 1 || hoursValue > 40) {
          errorEl.textContent = "Enter between 1 and 40 available study hours.";
          errorEl.hidden = false;
          return;
        }

        const hours = Number(document.getElementById("tbl-hours").value) || 5;
        const duration = document.getElementById("tbl-duration").value;
        const period = document.getElementById("tbl-period").value;
        const priority = document.getElementById("tbl-priority").value;

        const preview = Math.min(20, Math.ceil((hours * 60) / Number(duration)));

        openModal({
          title: "Generate full week?",
          body: `
            <p>This will add up to <strong>${preview} sessions</strong> to your timetable, spread across the week.</p>
            <p class="help-text">Module: <strong>${window.BuddyApp.escapeHTML(data.module)}</strong><br>
               Duration: ${duration} min · Period: ${period} · Hours: ${hours}</p>
            <p class="muted">You can edit or cancel individual sessions afterwards.</p>`,
          primaryLabel: `Generate ${preview} sessions`,
          onPrimary: async () => {
            closeModal();
            try {
              const includeWeekends =
                localStorage.getItem("buddy-weekend-pref") || "both";

              // Save the user's period as the new default
              localStorage.setItem("buddy-study-period", period);

              const schedule = await window.BuddyAI.createSchedule(
                data.module,
                String(hours),
                { duration, period, priority, includeWeekends }
              );

              schedule.forEach(item => {
                mgr.create({
                  module: item.module,
                  task: item.task,
                  duration: item.duration,
                  period: period,
                  priority: item.priority || 3,
                  date: item.date,
                  time: item.time
                });
              });

              renderCalendar();
              app.announce(`Generated ${schedule.length} sessions.`);
            } catch (err) {
              errorEl.textContent = err.message;
              errorEl.hidden = false;
            }
          }
        });
      });
    }

    document.getElementById("plan-prev-week").addEventListener("click", () => {
      weekOffset -= 1;
      renderCalendar();
    });

    document.getElementById("plan-next-week").addEventListener("click", () => {
      weekOffset += 1;
      renderCalendar();
    });

    renderCalendar();
  }
};
