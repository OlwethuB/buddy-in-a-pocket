// =========================================================
// SHARED APPLICATION CONTROLLER
// File: js/app.js
// =========================================================

window.BuddyApp = (() => {
    const STORAGE_KEY = "buddy-pocket-prototype-v1";

    const defaults = {
        tone: "balanced",
        sessions: 0,
        streak: 3,
        sessionMinutes: 25,
        totalMinutes: 0,
        moodEntries: [],
        lastVisit: null,
        modules: ["Psychology 101"],
        schedule: [],
        cards: [
            { id: "1", question: "What is active recall?", answer: "Retrieving information from memory instead of only rereading it." },
            { id: "2", question: "Why use spaced repetition?", answer: "It spreads review over time to support long-term retention." },
            { id: "3", question: "What is a study session goal?", answer: "A specific, manageable task to complete in a set period." },
            { id: "4", question: "What is a study timetable for?", answer: "To allocate realistic time to modules, revision and deadlines." },
            { id: "5", question: "What is active learning?", answer: "Engaging with material through recall, explanation and practice." },
            { id: "6", question: "What is a useful study break?", answer: "A short pause that lets you rest before returning to work." },
            { id: "7", question: "Why break large tasks into steps?", answer: "Smaller steps make it easier to start and monitor progress." },
            { id: "8", question: "What should a weekly review do?", answer: "Reflect on progress and help you plan the next week." },
            { id: "9", question: "What is a realistic study goal?", answer: "A clear task that fits your available time and energy." },
            { id: "10", question: "Why reflect after studying?", answer: "To notice what worked and decide what to adjust next time." }
        ]
    };

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return saved ? { ...defaults, ...saved } : { ...defaults };
        } catch {
            return { ...defaults };
        }
    }

    const state = loadState();
    let currentScreen = 1;

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            announce("Your browser could not save progress. You can still use the prototype.");
        }
    }

    function announce(message) {
        const region = document.getElementById("announcer");
        if (region) region.textContent = message;
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function getRenderers() {
        return {
            1: window.settings,
            2: window.dashboard,
            3: window.conversation,
            4: window.flashcard,
            5: window.mood,
            6: window.accessibility,
            7: window.timetable,
            8: window.notes,
            9: window.community,
            10: window.settings
        };
    }

    // Force-scroll every scrollable ancestor to the top. Mobile Safari does
    // not honour window.scrollTo when the scroller is #main-content or <body>,
    // so we touch all of them and then bring #screen-root into view.
    function scrollToTop() {
        const main = document.getElementById("main-content");
        if (main) main.scrollTop = 0;

        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);

        const root = document.getElementById("screen-root");
        if (root) root.scrollIntoView({ block: "start", behavior: "auto" });
    }

    function goTo(screen) {
        const number = Number(screen);
        if (!Number.isInteger(number) || number < 1 || number > 10) return;

        const renderer = getRenderers()[number];
        if (!renderer) {
            const root = document.getElementById("screen-root");
            if (root) {
                root.innerHTML = `
                    <section class="card">
                        <h2>This screen has not loaded</h2>
                        <p>The script for screen <strong>${number}</strong> is missing or failed to load.</p>
                        <p>Check the browser console for an error in that screen's JavaScript file, then reload.</p>
                    </section>`;
            }
            announce(`Screen ${number} could not be opened because it has not loaded.`);
            return;
        }

        currentScreen = number;
        render();

        const main = document.getElementById("main-content");
        if (main) {
            main.setAttribute("aria-label", `Screen ${number}`);
            main.focus({ preventScroll: true });
        }

        scrollToTop();
    }

    function render() {
        const root = document.getElementById("screen-root");
        if (!root) return;

        // Close any modal overlay left over from the previous screen so it
        // can't intercept clicks on the new screen's navigation.
        document.querySelectorAll(".modal-host").forEach(host => {
            host.hidden = true;
            host.replaceChildren();
        });

        const renderer = getRenderers()[currentScreen];
        if (!renderer) {
            root.innerHTML = "<p>Screen unavailable.</p>";
            return;
        }

        try {
            root.innerHTML = renderer.render();
        } catch (err) {
            console.error("Screen render failed:", err);
            root.innerHTML = `
                <section class="card">
                    <h2>Something went wrong on this screen</h2>
                    <p>${escapeHTML(err.message || String(err))}</p>
                </section>`;
            return;
        }

        document.querySelectorAll("[data-screen]").forEach(button => {
            const active = Number(button.dataset.screen) === currentScreen;
            button.classList.toggle("active", active);

            if (button.classList.contains("nav-item")) {
                if (active) button.setAttribute("aria-current", "page");
                else button.removeAttribute("aria-current");
            }
        });

        if (typeof renderer.afterRender === "function") {
            try {
                const result = renderer.afterRender();
                if (result && typeof result.catch === "function") {
                    result.catch(err => {
                        console.error("afterRender (async) failed:", err);
                        announce("This screen loaded but some interactions may be unavailable. Check the console.");
                    });
                }
            } catch (err) {
                console.error("afterRender failed:", err);
                announce("This screen loaded but some interactions may be unavailable. Check the console.");
            }
        }
    }

    function startSession(minutes = state.sessionMinutes) {
        const duration = Number(minutes);

        try {
            state.sessionMinutes = duration;
            save();
            window.BuddyTimer.start(duration);
            announce(`Study session started for ${duration} minutes.`);
            goTo(3);
        } catch (error) {
            announce(error.message);
        }
    }

    function endSession() {
        window.BuddyTimer.finish();
        state.sessions += 1;
        state.totalMinutes += state.sessionMinutes;
        save();
        announce("Session logged.");
        goTo(5);
    }

    function cancelSession() {
        window.BuddyTimer.finish();
        announce("Session cancelled. No penalty.");
        goTo(2);
    }

    document.addEventListener("click", event => {
        // If a visible modal overlay is intercepting clicks, don't navigate
        // from a backdrop tap.
        const openModal = document.querySelector(".modal-host:not([hidden])");
        if (openModal && event.target.classList.contains("modal-backdrop")) {
            return;
        }

        const navigation = event.target.closest("[data-screen]");
        if (navigation) {
            if (navigation.disabled) return;
            event.preventDefault();
            event.stopPropagation();

            const target = Number(navigation.dataset.screen);
            if (Number.isInteger(target) && target >= 1 && target <= 10) {
                goTo(target);
            }
            return;
        }

        const start = event.target.closest("[data-start-session]");
        if (start) startSession(start.dataset.startSession || state.sessionMinutes);

        const end = event.target.closest("[data-end-session]");
        if (end) endSession();

        const cancel = event.target.closest("[data-cancel-session]");
        if (cancel) cancelSession();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && currentScreen === 5) {
            goTo(2);
        }
    });

    function init() {
        const now = new Date();
        const previous = state.lastVisit ? new Date(state.lastVisit) : null;

        if (previous && !Number.isNaN(previous.getTime())) {
            const elapsed = Math.floor((now - previous) / 86400000);
            state.daysAway = Math.max(0, elapsed);
        } else {
            state.daysAway = 0;
        }

        state.lastVisit = now.toISOString();
        save();

        if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
            navigator.serviceWorker.register("./service-worker.js")
                .catch(error => {
                    console.warn("Offline support could not be registered:", error);
                });
        }

        if (localStorage.getItem(STORAGE_KEY + "-welcomed")) {
            goTo(2);
        } else {
            goTo(1);
        }
    }

    document.addEventListener("DOMContentLoaded", init);

    return {
        state,
        save,
        announce,
        escapeHTML,
        goTo,
        startSession,
        endSession,
        cancelSession
    };
})();