
// =========================================================
// TIMESTAMP-BASED STUDY TIMER
// File: js/timer.js
// Recovers correctly after tab suspension or device sleep.
// =========================================================

window.BuddyTimer = (() => {
  const KEY = "buddy-pocket-active-timer";
  let interval = null;

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }

  function write(timer) {
    localStorage.setItem(KEY, JSON.stringify(timer));
  }

  function clear() {
    localStorage.removeItem(KEY);
    if (interval) clearInterval(interval);
    interval = null;
  }

  function remaining() {
    const timer = read();
    if (!timer) return 0;

    return Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  }

  function format(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function paint() {
    const timer = read();
    const seconds = remaining();
    const display = document.getElementById("session-timer");

    if (display && timer) {
      display.textContent = format(seconds);
      display.setAttribute("aria-label", `${format(seconds)} remaining`);
    }

    if (timer && seconds === 0) {
      clear();
      window.BuddyApp.announce("Your planned study time is complete.");
      document.dispatchEvent(new CustomEvent("buddy:timer-complete"));
    }
  }

  function start(minutes) {
    const duration = Number(minutes);

    if (!Number.isFinite(duration) || duration < 1 || duration > 90) {
      throw new Error("Choose a session between 1 and 90 minutes.");
    }

    clear();

    write({
      startedAt: Date.now(),
      endsAt: Date.now() + duration * 60_000,
      durationMinutes: duration
    });

    paint();
    interval = setInterval(paint, 1000);
    return true;
  }

  function resume() {
    const timer = read();
    if (!timer) return;

    if (remaining() <= 0) {
      paint();
      return;
    }

    if (interval) clearInterval(interval);
    paint();
    interval = setInterval(paint, 1000);
  }

  function finish() {
    clear();
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resume();
  });

  window.addEventListener("pageshow", resume);

  return { start, resume, finish, remaining, format };
})();
