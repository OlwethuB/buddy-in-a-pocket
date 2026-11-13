
// =========================================================
// SCREEN 4 — FLASHCARD QUIZ
// File: js/flashcard.js
// =========================================================

window.flashcard = {
    render() {
        return `
      <section class="stack" aria-labelledby="flashcard-title">
        <div class="page-heading">
          <p class="eyebrow">ACTIVE RECALL</p>
          <h1 id="flashcard-title">Learn a little. Remember more.</h1>
          <p class="muted">Try answering from memory before revealing the back of each card.</p>
        </div>

        <section class="card stack">
          <div class="row" style="display:flex;justify-content:space-between;gap:12px;align-items:center">
            <strong id="card-count">Card 1 of 10</strong>
            <span class="pill">Study practice</span>
          </div>

          <div class="progress-track" role="progressbar"
            id="card-progress" aria-label="Flashcard progress"
            aria-valuemin="0" aria-valuemax="10" aria-valuenow="1">
            <div id="card-progress-fill" class="progress-fill" style="width:10%"></div>
          </div>

          <button id="flashcard" class="flashcard"
            aria-label="Flashcard. Press Enter or Space to reveal the answer.">
            <span>
              <span id="card-side" class="eyebrow">QUESTION</span>
              <h2 id="card-text">What is active recall?</h2>
              <span id="card-hint" class="flashcard-hint">Click, tap, Enter or Space to flip</span>
            </span>
          </button>

          <p id="card-feedback" aria-live="polite" class="help-text"></p>

          <div class="button-row">
            <button id="card-prev" class="button button-secondary">← Previous</button>
            <button id="card-flip" class="button button-primary">Tap to flip</button>
            <button id="card-next" class="button button-secondary">Next →</button>
          </div>

          <button id="card-restart" class="button button-quiet">Restart the deck</button>
        </section>

        <section class="card">
          <h2>Create flashcards from your notes</h2>
          <p class="muted">The mock backend turns each line into a revision prompt. It does not verify academic accuracy.</p>
          <form id="notes-form">
            <div class="field">
              <label for="study-notes">Paste notes or key terms</label>
              <textarea id="study-notes" maxlength="4000"
                placeholder="Active recall is retrieving information from memory…"></textarea>
            </div>
            <button class="button button-primary" type="submit">Generate demo cards</button>
          </form>
          <p id="notes-error" class="error-message" role="alert" hidden></p>
        </section>
      </section>`;
    },

    afterRender() {
        const app = window.BuddyApp;
        const s = app.state;
        let index = 0;
        let flipped = false;

        const flashcard = document.getElementById("flashcard");
        const text = document.getElementById("card-text");
        const side = document.getElementById("card-side");
        const hint = document.getElementById("card-hint");
        const count = document.getElementById("card-count");
        const progress = document.getElementById("card-progress");
        const fill = document.getElementById("card-progress-fill");
        const feedback = document.getElementById("card-feedback");

        function draw() {
            const cards = s.cards;
            if (!cards.length) return;

            index = Math.max(0, Math.min(index, cards.length - 1));
            const card = cards[index];

            text.textContent = flipped ? card.answer : card.question;
            side.textContent = flipped ? "ANSWER" : "QUESTION";
            hint.textContent = flipped ? "Tap to return to the question" : "Tap to reveal the answer";
            count.textContent = `Card ${index + 1} of ${cards.length}`;
            progress.setAttribute("aria-valuemax", cards.length);
            progress.setAttribute("aria-valuenow", index + 1);
            fill.style.width = `${((index + 1) / cards.length) * 100}%`;
            feedback.textContent = "";

            document.getElementById("card-prev").disabled = index === 0;
            document.getElementById("card-next").textContent =
                index === cards.length - 1 ? "Finish deck ✓" : "Next →";
        }

        function flip() {
            flipped = !flipped;
            draw();
            app.announce(flipped ? "Answer revealed." : "Question shown.");
        }

        flashcard.addEventListener("click", flip);
        document.getElementById("card-flip").addEventListener("click", flip);

        flashcard.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                flip();
            }
        });

        document.getElementById("card-prev").addEventListener("click", () => {
            index--;
            flipped = false;
            draw();
        });

        document.getElementById("card-next").addEventListener("click", () => {
            if (index === s.cards.length - 1) {
                feedback.textContent = "You've reached the end of this deck. You can restart or review any card.";
                app.announce("Flashcard deck complete.");
            } else {
                index++;
                flipped = false;
                draw();
            }
        });

        document.getElementById("card-restart").addEventListener("click", () => {
            index = 0;
            flipped = false;
            draw();
            flashcard.focus();
        });

        document.getElementById("notes-form").addEventListener("submit", async event => {
            event.preventDefault();
            const error = document.getElementById("notes-error");
            error.hidden = true;

            try {
                const generated = await window.BuddyAI.generateCards(
                    document.getElementById("study-notes").value
                );

                s.cards = generated;
                app.save();
                index = 0;
                flipped = false;
                draw();
                app.announce(`${generated.length} demo flashcards generated.`);
            } catch (err) {
                error.textContent = err.message;
                error.hidden = false;
            }
        });

        // Prefill the revision generator when opened from a saved note.
        const savedSource = sessionStorage.getItem("buddy-revision-prefill");

        if (savedSource) {
            document.getElementById("study-notes").value = savedSource;
            sessionStorage.removeItem("buddy-revision-prefill");
        }

        draw();
    }
};
