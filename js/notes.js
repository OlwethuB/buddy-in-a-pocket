// =========================================================
// SCREEN 8 — NOTES & STUDY LIBRARY
// File: js/notes.js
// Text notes and file storage using IndexedDB.
// Delete confirmation uses an inline modal, not confirm().
// =========================================================

window.notes = {
  render() {
    const modules = window.BuddyApp.state.modules || [];

    return `
      <section class="stack">
        <div class="page-heading">
          <p class="eyebrow">YOUR STUDY LIBRARY</p>
          <h1>Keep your learning in one place.</h1>
          <p class="muted">Save notes, lecture documents and revision resources by module.</p>
        </div>

        <section class="card">
          <h2>Add a resource</h2>
          <form id="notes-save-form">
            <div class="field">
              <label for="resource-title">Title</label>
              <input id="resource-title" required maxlength="160"
                placeholder="e.g. Lecture 4 — Memory">
            </div>

            <div class="field">
              <label for="resource-module">Module</label>
              <input id="resource-module" list="module-options"
                placeholder="e.g. Psychology 101">
              <datalist id="module-options">
                ${modules.map(m => `<option value="${window.BuddyApp.escapeHTML(m)}"></option>`).join("")}
              </datalist>
            </div>

            <div class="field">
              <label for="resource-text">Type or paste notes</label>
              <textarea id="resource-text" rows="6" maxlength="100000"
                placeholder="Your notes can be saved exactly as entered."></textarea>
            </div>

            <div class="field">
              <label for="resource-file">Or attach a document or image</label>
              <input id="resource-file" type="file"
                accept=".txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                multiple>
              <small class="help-text">
                Text files can be read directly. PDF, Word and image attachments
                are stored as files; extraction requires a suitable parser or OCR.
              </small>
            </div>

            <button type="submit" class="button button-primary">
              Save to library
            </button>
          </form>
          <p id="library-error" role="alert" class="error-message" hidden></p>
          <p id="library-status" role="status" class="success-message"></p>
        </section>

        <section class="card">
          <h2>Saved resources</h2>
          <div id="resource-list" class="schedule-list"></div>
        </section>

        <div id="notes-modal-host" class="modal-host" hidden></div>
      </section>`;
  },

  async afterRender() {
    const app = window.BuddyApp;
    const DB_NAME = "buddy-pocket-library";
    const STORE = "resources";

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: "id" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async function put(resource) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(resource);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      });
    }

    async function getAll() {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const request = tx.objectStore(STORE).getAll();
        request.onsuccess = () => { db.close(); resolve(request.result); };
        request.onerror = () => { db.close(); reject(request.error); };
      });
    }

    async function remove(id) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      });
    }

    const list = document.getElementById("resource-list");
    const modalHost = document.getElementById("notes-modal-host");

    function closeNotesModal() {
      modalHost.hidden = true;
      modalHost.replaceChildren();
    }

    function openDeleteModal(resource) {
      modalHost.replaceChildren();
      modalHost.hidden = false;

      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";

      const panel = document.createElement("div");
      panel.className = "modal";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", "notes-modal-title");

      const h = document.createElement("h2");
      h.id = "notes-modal-title";
      h.textContent = "Delete this resource?";

      const p = document.createElement("p");
      p.textContent = `"${resource.title}" will be removed from your library. This cannot be undone.`;

      const actions = document.createElement("div");
      actions.className = "button-row";

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "button button-secondary";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", closeNotesModal);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "button button-danger";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        del.disabled = true;
        try {
          await remove(resource.id);
          closeNotesModal();
          await refresh();
          app.announce("Resource deleted.");
        } catch {
          del.disabled = false;
          p.textContent = "The resource could not be deleted. Please try again.";
        }
      });

      actions.append(cancel, del);
      panel.append(h, p, actions);
      modalHost.append(backdrop, panel);
      cancel.focus();
    }

    function openPreview(resource) {
      modalHost.replaceChildren();
      modalHost.hidden = false;

      let objectUrl = null;

      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.addEventListener("click", cleanupAndClose);

      const panel = document.createElement("div");
      panel.className = "modal";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");

      const h = document.createElement("h2");
      h.textContent = resource.title || "Preview";

      const body = document.createElement("div");
      body.className = "modal-body";

      function cleanupAndClose() {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        closeNotesModal();
      }

      if (resource.blob) {
        objectUrl = URL.createObjectURL(resource.blob);
        const type = resource.mimeType || resource.blob.type || "";

        if (type.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = objectUrl;
          img.alt = resource.title || "Saved image";
          img.style.maxWidth = "100%";
          img.style.borderRadius = "8px";
          body.appendChild(img);
        } else if (type === "application/pdf") {
          const frame = document.createElement("iframe");
          frame.src = objectUrl;
          frame.style.width = "100%";
          frame.style.height = "60vh";
          frame.style.border = "0";
          body.appendChild(frame);
        } else if (type.startsWith("text/")) {
          const pre = document.createElement("pre");
          pre.style.maxHeight = "50vh";
          pre.style.overflow = "auto";
          pre.style.whiteSpace = "pre-wrap";
          pre.style.fontSize = "0.85rem";
          pre.textContent = resource.text || "(empty)";
          body.appendChild(pre);
        } else {
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = resource.fileName || "resource";
          link.textContent = `Download ${resource.fileName || "file"}`;
          link.className = "button button-primary";
          body.appendChild(link);
        }
      } else {
        const pre = document.createElement("pre");
        pre.style.maxHeight = "50vh";
        pre.style.overflow = "auto";
        pre.style.whiteSpace = "pre-wrap";
        pre.style.fontSize = "0.85rem";
        pre.textContent = resource.text || "(empty)";
        body.appendChild(pre);
      }

      const actions = document.createElement("div");
      actions.className = "button-row";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "button button-secondary";
      close.textContent = "Close";
      close.addEventListener("click", cleanupAndClose);
      actions.appendChild(close);

      panel.append(h, body, actions);
      modalHost.append(backdrop, panel);
      close.focus();
    }

    async function refresh() {
      list.replaceChildren();

      const resources = await getAll();

      if (!resources.length) {
        list.textContent = "No saved resources yet.";
        return;
      }

      resources.forEach(resource => {
        const card = document.createElement("article");
        card.className = "schedule-item schedule-item--wide";

        const info = document.createElement("div");
        info.className = "schedule-item__details";

        const title = document.createElement("strong");
        title.textContent = resource.title;

        const module = document.createElement("p");
        module.className = "muted";
        module.textContent = resource.module || "Uncategorised";

        const details = document.createElement("p");
        details.textContent = resource.fileName
          ? `Attachment: ${resource.fileName}`
          : "Text note";

        info.append(title, module, details);

        const actions = document.createElement("div");
        actions.className = "schedule-item__actions";

        // Always provide View
        const view = document.createElement("button");
        view.type = "button";
        view.className = "button button-secondary";
        view.textContent = "View";
        view.addEventListener("click", () => openPreview(resource));
        actions.appendChild(view);

        // Create revision cards — only for text notes
        if (resource.text && resource.text.trim()) {
          const makeCards = document.createElement("button");
          makeCards.type = "button";
          makeCards.className = "button button-primary";
          makeCards.textContent = "Create revision cards";
          makeCards.addEventListener("click", () => {
            sessionStorage.setItem("buddy-revision-prefill", resource.text);
            app.goTo(4);
          });
          actions.appendChild(makeCards);
        }

        const del = document.createElement("button");
        del.type = "button";
        del.className = "button button-secondary";
        del.textContent = "Delete";
        del.addEventListener("click", () => openDeleteModal(resource));

        actions.appendChild(del);
        card.append(info, actions);
        list.appendChild(card);
      });
    }

    document.getElementById("notes-save-form").addEventListener("submit", async event => {
      event.preventDefault();

      const error = document.getElementById("library-error");
      const status = document.getElementById("library-status");
      error.hidden = true;
      status.textContent = "";

      const title = document.getElementById("resource-title").value.trim();
      const module = document.getElementById("resource-module").value.trim();
      const text = document.getElementById("resource-text").value;
      const files = [...document.getElementById("resource-file").files];

      if (!text.trim() && files.length === 0) {
        error.textContent = "Add some notes or choose a file before saving.";
        error.hidden = false;
        return;
      }

      try {
        const resources = [];

        if (text.length) {
          resources.push({
            id: crypto.randomUUID(),
            title,
            module,
            text,
            fileName: "",
            createdAt: new Date().toISOString()
          });
        }

        for (const file of files) {
          resources.push({
            id: crypto.randomUUID(),
            title: title || file.name,
            module,
            text: file.type === "text/plain" ? await file.text() : "",
            fileName: file.name,
            mimeType: file.type,
            blob: file,
            createdAt: new Date().toISOString()
          });
        }

        for (const resource of resources) {
          await put(resource);
        }

        event.target.reset();
        status.textContent = "Your resource has been saved in this browser.";
        await refresh();
      } catch {
        error.textContent = "The resource could not be saved. Check your available browser storage.";
        error.hidden = false;
      }
    });

    try {
      await refresh();
    } catch {
      document.getElementById("library-error").textContent =
        "Your browser could not open the local study library.";
      document.getElementById("library-error").hidden = false;
    }
  }
};
