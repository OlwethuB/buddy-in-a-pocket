// =========================================================
// MOCK AI BACKEND
// File: js/ai.js
// No external API or API key required.
// =========================================================

window.BuddyAI = (() => {
  const wait = (ms = 300) =>
    new Promise(resolve => setTimeout(resolve, ms));

  const replies = {
    gentle: [
      "That's okay. We can take this one small step at a time.",
      "You don't need to figure everything out today. Let's start small.",
      "I'm glad you checked in. What feels manageable right now?"
    ],
    balanced: [
      "Let's make this practical. What's the first task we can finish?",
      "You have a starting point. Let's turn it into a short study session.",
      "A little progress is better than waiting for the perfect moment."
    ],
    honest: [
      "Waiting for motivation can keep you stuck. Let's choose one task and begin.",
      "You may not finish everything today, but you can make useful progress now.",
      "Let's be realistic about your time and make a plan you can actually follow."
    ]
  };

  const MAX_SESSIONS = 40;       // hard upper bound across the whole plan
  const MAX_PER_MODULE_PER_DAY = 3;
  const MAX_WEEKS = 4;           // how many weeks ahead the plan may span
  const MIN_SESSION_MIN = 10;
  const MAX_SESSION_MIN = 90;

  const DAY_INDEX = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
    Friday: 4, Saturday: 5, Sunday: 6
  };

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function getTone() {
    return window.BuddyApp?.state.tone || "balanced";
  }

  async function respond(message) {
    await wait();

    const text = message.trim().toLowerCase();
    const tone = getTone();

    if (/suicid|kill myself|end my life|hurt myself/.test(text)) {
      return {
        text: "I'm sorry things feel this difficult. I'm a study companion, not a crisis service. If you may be in immediate danger, contact emergency services or go to the nearest emergency department. In South Africa, you can also contact SADAG at 0800 567 567. Would you like to pause studying and seek support?",
        crisis: true
      };
    }

    if (/lonely|alone|homesick|miss home/.test(text)) {
      return {
        text: "Being away from familiar people can be difficult. You don't have to solve everything through studying. Would a small study task, a message to someone you trust, or a break feel most manageable?",
        crisis: false
      };
    }

    if (/tired|exhausted|overwhelmed|stressed|anxious/.test(text)) {
      return {
        text: "It sounds like a lot is on your plate. We can make the next step smaller. Would you prefer a 5-minute start, a short break, or help choosing one priority?",
        crisis: false
      };
    }

    if (/schedule|timetable|plan|organis/.test(text)) {
      return {
        text: "Let's plan around your actual week. Tell me your modules, upcoming deadlines, and the hours you have available. We'll start with the most urgent task.",
        crisis: false
      };
    }

    if (/don't know|dont know|where.*start|confused/.test(text)) {
      return {
        text: "No problem. Name one module you're working on. I'll help you break it into a small first task.",
        crisis: false
      };
    }

    return {
      text: pick(replies[tone] || replies.balanced),
      crisis: false
    };
  }

  /**
   * Build a weekly (or multi-week) study plan starting from TODAY.
   * If the plan doesn't fit in the remaining days of this week,
   * it continues into next weeks (up to MAX_WEEKS).
   *
   * Priority is persistent — every session uses `options.priority`.
   * Per-module-per-day cap is MAX_PER_MODULE_PER_DAY (3).
   *
   * @param {string} modules
   * @param {number|string} hours 1–40 per week
   * @param {object} [options]
   * @param {number} [options.duration=25]
   * @param {string} [options.period="morning"]
   * @param {number} [options.priority=3]
   * @param {string} [options.includeWeekends="both"]
   *   "both" | "weekendsOnly" | "saturday" | "sunday" | "none"
   * @returns {Promise<Array<{ day, date, time, module, duration, task, priority }>>}
   */
  async function createSchedule(modules, hours, options = {}) {
    await wait(450);

    const cleanModules = String(modules || "")
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (!cleanModules.length) {
      throw new Error("Please enter at least one module.");
    }

    const availableHours = Number(hours);
    if (!Number.isFinite(availableHours) || availableHours < 1 || availableHours > 40) {
      throw new Error("Enter between 1 and 40 available study hours.");
    }

    const requestedDuration = Number(options.duration) || 25;
    const duration = Math.min(
      MAX_SESSION_MIN,
      Math.max(MIN_SESSION_MIN, requestedDuration)
    );

    // Persistent priority — every session gets this exact value
    const priority = Math.min(5, Math.max(1, Number(options.priority) || 3));

    const totalMinutes = Math.round(availableHours * 60);
    const rawSessions = Math.round(totalMinutes / duration);
    const sessionCount = Math.min(
      MAX_SESSIONS,
      Math.max(cleanModules.length, rawSessions)
    );

    // Resolve allowed days from the weekend preference
    const weekendPref = options.includeWeekends || "both";
    const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let allowedDays;
    if (weekendPref === "none") {
      allowedDays = weekdayNames;
    } else if (weekendPref === "weekendsOnly") {
      allowedDays = ["Saturday", "Sunday"];
    } else if (weekendPref === "saturday") {
      allowedDays = [...weekdayNames, "Saturday"];
    } else if (weekendPref === "sunday") {
      allowedDays = [...weekdayNames, "Sunday"];
    } else {
      allowedDays = [...weekdayNames, "Saturday", "Sunday"];
    }

    if (!allowedDays.length) {
      throw new Error("No study days available. Please choose a weekend option in Settings.");
    }

    // Build a rolling date window from today, up to MAX_WEEKS weeks ahead.
    // Each entry: { iso, dayName, weekIndex }
    const today = new Date();
    const todayDow = (today.getDay() + 6) % 7; // Mon = 0
    const dateWindow = [];

    for (let week = 0; week < MAX_WEEKS; week++) {
      // For the first week, only include days on/after today
      const startOffset = week === 0 ? todayDow : 0;
      allowedDays
        .filter(d => DAY_INDEX[d] >= startOffset || week > 0)
        .forEach(dayName => {
          const delta = (week * 7) + (DAY_INDEX[dayName] - todayDow);
          const d = new Date(today);
          d.setDate(today.getDate() + delta);
          dateWindow.push({
            iso: d.toLocaleDateString("en-CA"),
            dayName,
            weekIndex: week
          });
        });
    }

    if (!dateWindow.length) {
      throw new Error(
        "Not enough days left this week. Try a wider weekend setting or generate again next week."
      );
    }

    // Track per-module-per-day session count
    const dayModuleCount = {}; // key: `${iso}|${module}` -> number

    function canPlace(isoDate, module) {
      const key = `${isoDate}|${module}`;
      return (dayModuleCount[key] || 0) < MAX_PER_MODULE_PER_DAY;
    }

    function place(isoDate, module) {
      const key = `${isoDate}|${module}`;
      dayModuleCount[key] = (dayModuleCount[key] || 0) + 1;
    }

    // Prepare slot pools
    const slotPool = startHoursFor(options.period);
    const tasks = taskList();

    // Track how many sessions each date has (for start-time offset)
    const dateSlotCount = {};

    const results = [];

    let placed = 0;
    let moduleCursor = 0;
    let windowCursor = 0;

    // Try to place all sessions; scan the window repeatedly until done
    // or we've made a full pass with no progress (means we're truly capped).
    let safety = 0;
    while (placed < sessionCount && safety < 5000) {
      safety++;
      const slot = dateWindow[windowCursor % dateWindow.length];
      const module = cleanModules[moduleCursor % cleanModules.length];

      if (canPlace(slot.iso, module)) {
        const idxOnThisDate = dateSlotCount[slot.iso] || 0;
        dateSlotCount[slot.iso] = idxOnThisDate + 1;

        const baseHour = slotPool[Math.min(idxOnThisDate, slotPool.length - 1)];
        const hour = baseHour + Math.floor(Math.random() * 2);
        const time = `${String(((hour + 24) % 24)).padStart(2, "0")}:00`;

        const task = tasks[Math.floor(Math.random() * tasks.length)];

        results.push({
          day: slot.dayName,
          date: slot.iso,
          time,
          module,
          duration,
          task,
          priority
        });

        place(slot.iso, module);
        placed++;
      }

      // Advance cursors
      windowCursor++;
      moduleCursor++;
    }

    if (placed < sessionCount) {
      throw new Error(
        `Could only schedule ${placed} of ${sessionCount} sessions within ${MAX_WEEKS} weeks ` +
        `with the ${MAX_PER_MODULE_PER_DAY}-per-module-per-day cap. ` +
        `Try reducing hours or adding more modules.`
      );
    }

    // Sort by date + time for a cleaner plan
    results.sort((a, b) =>
      a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    );

    return results;
  }

  function startHoursFor(period) {
    const map = {
      earlyMorning: [5, 6, 7],
      morning: [7, 8, 9, 10, 11],
      afternoon: [12, 13, 14, 15, 16],
      evening: [17, 18, 19],
      night: [20, 21, 22],
      twilight: [23, 0, 1]
    };
    return map[period] || [7, 9, 11, 14, 16, 18];
  }

  function taskList() {
    return [
      "Review notes and key concepts",
      "Practise recall or past questions",
      "Summarise the chapter in your own words",
      "Work through practice problems",
      "Re-read and annotate lecture slides",
      "Build a mind map for the topic"
    ];
  }

  // ---- Flashcard generators (structured notes only) ------------------

  async function generateCards(notes) {
    await wait(400);

    const clean = String(notes || "").trim();
    if (!clean) throw new Error("Enter some notes or key terms first.");

    const parsers = [
      parseQAPairs,
      parseFrontBack,
      parseABPairs,
      parsePipeSeparated,
      parseTabSeparated
    ];

    for (const parser of parsers) {
      const cards = parser(clean);
      if (cards.length > 0) {
        return cards.map((c, i) => ({
          id: `generated-${Date.now()}-${i}`,
          question: c.question,
          answer: c.answer
        }));
      }
    }

    throw new Error(
      "I couldn't find a question–answer pattern in your notes.\n\n" +
      "Use one of these formats:\n" +
      "  Q: What is X?\n  A: X is ...\n\n" +
      "  Front: ...\n  Back: ...\n\n" +
      "  Term | Definition (one pair per line)\n\n" +
      "  Or paste two columns separated by tabs."
    );
  }

  function parseQAPairs(text) {
    const cards = [];
    const re = /(?:^|\n)\s*(?:Q|Question)\s*:\s*([\s\S]*?)\s*\n\s*(?:A|Answer)\s*:\s*([\s\S]*?)(?=\n\s*(?:Q|Question)\s*:|$)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const q = m[1].trim().replace(/\s+/g, " ");
      const a = m[2].trim().replace(/\s+/g, " ");
      if (q && a) cards.push({ question: q, answer: a });
    }
    return cards;
  }

  function parseFrontBack(text) {
    const cards = [];
    const re = /(?:^|\n)\s*Front\s*:\s*([\s\S]*?)\s*\n\s*Back\s*:\s*([\s\S]*?)(?=\n\s*Front\s*:|$)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const q = m[1].trim().replace(/\s+/g, " ");
      const a = m[2].trim().replace(/\s+/g, " ");
      if (q && a) cards.push({ question: q, answer: a });
    }
    return cards;
  }

  function parseABPairs(text) {
    const cards = [];
    const re = /(?:^|\n)\s*A\s*:\s*([\s\S]*?)\s*\n\s*B\s*:\s*([\s\S]*?)(?=\n\s*A\s*:|$)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const q = m[1].trim().replace(/\s+/g, " ");
      const a = m[2].trim().replace(/\s+/g, " ");
      if (q && a) cards.push({ question: q, answer: a });
    }
    return cards;
  }

  function parsePipeSeparated(text) {
    const cards = [];
    text.split(/\n+/).forEach(line => {
      const parts = line.split("|");
      if (parts.length === 2) {
        const q = parts[0].trim();
        const a = parts[1].trim();
        if (q && a && q.length > 1 && a.length > 1) {
          cards.push({ question: q, answer: a });
        }
      }
    });
    return cards;
  }

  function parseTabSeparated(text) {
    const cards = [];
    text.split(/\n+/).forEach(line => {
      const parts = line.split("\t");
      if (parts.length === 2) {
        const q = parts[0].trim();
        const a = parts[1].trim();
        if (q && a) cards.push({ question: q, answer: a });
      }
    });
    return cards;
  }

  async function getQuietCheckIn(daysAway) {
    await wait(200);
    if (daysAway >= 3) {
      return "I noticed you've been away for a little while. Want to try a 10-minute session and ease back into your routine?";
    }
    return "Welcome back! What would feel useful to work on today?";
  }

  return {
    respond,
    createSchedule,
    generateCards,
    getQuietCheckIn
  };
})();
