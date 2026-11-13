// =========================================================
// SCHEDULE MANAGER
// File: js/schedule.js
// =========================================================

window.BuddySchedule = (() => {
  const STORAGE_KEY = "buddy-pocket-schedule-v1";

  const periods = {
    earlyMorning: { label: "Early morning", start: "05:00", end: "07:00" },
    morning: { label: "Morning", start: "07:00", end: "12:00" },
    afternoon: { label: "Afternoon", start: "12:00", end: "17:00" },
    evening: { label: "Evening", start: "17:00", end: "20:00" },
    night: { label: "Night", start: "20:00", end: "23:00" },
    twilight: { label: "Twilight zone", start: "23:00", end: "05:00" }
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  let sessions = load();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  function create(data) {
    const duration = Number(data.duration);
    if (!data.module?.trim()) throw new Error("Enter a module name.");
    if (!Number.isFinite(duration) || duration < 5 || duration > 90) {
      throw new Error("Choose a duration between 5 and 90 minutes.");
    }

    const date = data.date || new Date().toLocaleDateString("en-CA");
    const time = data.time || "09:00";

    const session = {
      id: crypto.randomUUID(),
      module: data.module.trim(),
      date,
      time,
      duration,
      period: data.period || "morning",
      priority: Number(data.priority || 3),
      task: data.task?.trim() || "Review notes and practise recall",
      status: "planned",
      createdAt: new Date().toISOString()
    };

    sessions.push(session);
    save();
    return session;
  }

  function update(id, changes) {
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) throw new Error("This session could not be found.");

    if ("duration" in changes) {
      const d = Number(changes.duration);
      if (!Number.isFinite(d) || d < 5 || d > 90) {
        throw new Error("Choose a duration between 5 and 90 minutes.");
      }
      changes.duration = d;
    }
    if ("priority" in changes) {
      changes.priority = Number(changes.priority);
    }

    sessions[index] = { ...sessions[index], ...changes, id };
    save();
    return sessions[index];
  }

  function cancel(id) {
    const session = sessions.find(s => s.id === id);
    if (!session) throw new Error("This session could not be found.");
    session.status = "cancelled";
    save();
  }

  function undoCancel(id) {
    return update(id, { status: "planned" });
  }

  function remove(id) {
    sessions = sessions.filter(s => s.id !== id);
    save();
  }

  function list() {
    return [...sessions].sort((a, b) =>
      b.priority - a.priority ||
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
  }

  function getPeriods() { return periods; }

  function formMarkup({ idPrefix = "plan", showGenerate = true } = {}) {
    const p = idPrefix;
    const savedPeriod = localStorage.getItem("buddy-study-period") || "morning";

    return `
      <form id="${p}-form" class="stack" novalidate>
        <div class="field">
          <label for="${p}-module">Module</label>
          <input id="${p}-module" required maxlength="120"
                 placeholder="e.g. Psychology 101">
        </div>

        <div class="field">
          <label for="${p}-task">Study task <span class="muted">(optional)</span></label>
          <input id="${p}-task" maxlength="200"
                 placeholder="e.g. Review lecture 3">
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="${p}-period">Study period</label>
            <select id="${p}-period">
              ${Object.entries(periods).map(([key, val]) =>
                `<option value="${key}" ${key === savedPeriod ? "selected" : ""}>${val.label} (${val.start}–${val.end})</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label for="${p}-duration">Duration</label>
            <select id="${p}-duration">
              ${[10, 15, 25, 30, 45, 60, 90].map(n =>
                `<option value="${n}" ${n === 25 ? "selected" : ""}>${n} minutes</option>`
              ).join("")}
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="${p}-date">Date <span class="muted">(optional)</span></label>
            <input id="${p}-date" type="date">
          </div>
          <div class="field">
            <label for="${p}-time">Start time <span class="muted">(optional)</span></label>
            <input id="${p}-time" type="time">
          </div>
        </div>

        <div class="field">
          <label for="${p}-priority">Priority</label>
          <select id="${p}-priority">
            <option value="5">Urgent — must do this week</option>
            <option value="4">High — important</option>
            <option value="3" selected>Normal — routine study</option>
            <option value="2">Low — if there's time</option>
            <option value="1">Someday — optional</option>
          </select>
        </div>

        <div class="field">
          <label for="${p}-hours">
            Hours available this week
            <span class="muted">(used by "Generate plan")</span>
          </label>
          <input id="${p}-hours" type="number" min="1" max="40" step="1" value="5">
        </div>

        <div class="button-row">
          <button class="button button-primary" type="submit" data-action="customize">
            Add to timetable
          </button>
          ${showGenerate ? `
          <button class="button button-secondary" type="button" data-action="generate">
            Generate full week
          </button>` : ""}
        </div>

        <p id="${p}-error" class="error-message" role="alert" hidden></p>
      </form>`;
  }

  return {
    create, update, cancel, undoCancel, remove, list,
    getPeriods, formMarkup
  };
})();
