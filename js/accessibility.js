// =========================================================
// SCREEN 6 — ACCESSIBILITY / WCAG DEMONSTRATION
// File: js/accessibility.js
// =========================================================

window.accessibility = {
  render() {
    const pourIcon = (path) => `
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

    return `
      <section class="stack" aria-labelledby="access-title">
        <div class="page-heading">
          <p class="eyebrow">DESIGNED FOR MORE STUDENTS</p>
          <h1 id="access-title">Accessibility is part of the experience.</h1>
          <p class="muted">Try the example below. Leave the module name empty to see a helpful error.</p>
        </div>

        <section class="card">
          <h2>Example: helpful form validation</h2>
          <form id="module-form" novalidate>
            <div class="field">
              <label for="module-name">What module are you studying?</label>
              <input id="module-name" name="module"
                autocomplete="off" aria-describedby="module-help"
                placeholder="e.g. Psychology 101">
              <small id="module-help" class="help-text">
                Enter a module name to continue.
              </small>
            </div>

            <p id="module-error" class="error-message" role="alert" hidden></p>
            <p id="module-success" class="success-message" role="status" hidden></p>

            <button class="button button-primary" type="submit">Continue</button>
          </form>
        </section>

        <section class="grid-2">
          <article class="card">
            <h2>POUR principles</h2>
            <ul class="pour-list">
              <li>
                ${pourIcon('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')}
                <div><strong>Perceivable</strong><p>Text, labels and feedback can be perceived. Colour is not the only way information is communicated.</p></div>
              </li>
              <li>
                ${pourIcon('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/>')}
                <div><strong>Operable</strong><p>Buttons and form controls work with a keyboard, with visible focus indicators.</p></div>
              </li>
              <li>
                ${pourIcon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')}
                <div><strong>Understandable</strong><p>Instructions and error messages use plain language and predictable behaviour.</p></div>
              </li>
              <li>
                ${pourIcon('<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>')}
                <div><strong>Robust</strong><p>Semantic HTML and appropriate status messages support assistive technologies.</p></div>
              </li>
            </ul>
          </article>

          <article class="card">
            <h2>Relevant HTML example</h2>
            <div class="code-example">
              <code>&lt;label for="module-name"&gt;
  What module are you studying?
&lt;/label&gt;

&lt;input id="module-name"
  aria-describedby="module-help"&gt;

&lt;p role="alert"&gt;
  I didn't catch that — could you
  type your module name again?
&lt;/p&gt;</code>
            </div>
            <p class="help-text">The actual form above uses a label, an associated help message and a live error message.</p>
          </article>
        </section>

        <section class="soft-card">
          <h2>What this demo does not prove</h2>
          <p>Visual examples alone cannot certify WCAG conformance. Test keyboard-only operation, contrast, zoom, screen readers and the complete user journey before making a compliance claim.</p>
        </section>
      </section>`;
  },

  afterRender() {
    const app = window.BuddyApp;
    const form = document.getElementById("module-form");
    const input = document.getElementById("module-name");
    const error = document.getElementById("module-error");
    const success = document.getElementById("module-success");

    form.addEventListener("submit", event => {
      event.preventDefault();
      error.hidden = true;
      success.hidden = true;
      input.removeAttribute("aria-invalid");

      const value = input.value.trim();

      if (!value) {
        error.textContent = "I didn't catch that — could you type your module name again?";
        error.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", "module-help module-error");
        input.focus();
        app.announce(error.textContent);
        return;
      }

      input.setAttribute("aria-describedby", "module-help");
      success.textContent = `Great, your module is "${value}". You can now plan a study session for it.`;
      success.hidden = false;
      app.announce(success.textContent);
    });
  }
};