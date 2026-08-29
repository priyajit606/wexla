(() => {
  "use strict";

  // ============================================================
  // WEXLA — CLIENT-SIDE SYSTEM
  // ============================================================

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const DB_KEY = "wexla_users_v1";
  const SESSION_KEY = "wexla_session_v1";
  const PHOTO_KEY = "wexla_photos_v1";
  const MISSION_KEY = "wexla_missions_v2";
  const MEDIA_DB = "wexla_media_v2";

  const state = {
    user: null,
    entity: "Solo",
    theme: localStorage.getItem("wexla_theme") || "dark",
    game: null,
    gameCleanup: null
  };

  // ============================================================
  // DATA
  // ============================================================

  const tasks = [];

  const games = [
    ["snake", "3D Neon Snake Battle", "✦", "Arrow keys / WASD / swipe", "Collect energy nodes and avoid the trail."],
    ["flappy", "Flappy Bird: Evolution", "◈", "Space / tap", "Fly through the cyber gates."],
    ["racing", "Cyber Drag Racing", "▰", "A/D or ←/→", "Dodge traffic and survive the highway."],
    ["fruit", "Fruit Ninja: Slice Master", "✧", "Drag / pointer", "Slice falling fruit; avoid hazards."],
    ["runner", "Endless Parkour Runner", "➤", "Space / tap", "Jump over barriers and survive."],
    ["ttt", "Tic-Tac-Toe AI", "×", "Click / tap", "Beat the adaptive neon AI."],
    ["tetris", "Tetris Neon Grid", "▦", "Arrows / ↑ rotate", "Clear rows to score."],
    ["invaders", "Space Invaders: Galaxy Defender", "☄", "Arrows + Space", "Defend the city from invaders."],
    ["breakout", "Breakout Brick Smasher", "◆", "Mouse / arrows", "Smash every neon brick."],
    ["pacman", "Pacman Cyber Run", "●", "Arrow keys", "Collect nodes while avoiding hunters."]
  ];

  // ============================================================
  // STORAGE
  // ============================================================

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  // ============================================================
  // MONEY / LOCALIZATION
  // ============================================================

  function money(value) {
    const india = state.user?.country === "India";

    return new Intl.NumberFormat(
      india ? "en-IN" : "en-US",
      {
        style: "currency",
        currency: india ? "INR" : "USD",
        maximumFractionDigits: 0
      }
    ).format(value);
  }

  // ============================================================
  // TOAST
  // ============================================================

  function toast(message) {
    const element = $("#toast");

    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      element.classList.remove("show");
    }, 2600);
  }

  // ============================================================
  // BOOT
  // ============================================================

  function boot() {
    setTimeout(() => {
      $("#bootScreen")?.classList.add("hidden");

      const savedSession = getSession();

      if (savedSession) {
        const user = getUsers().find(
          (item) => item.id === savedSession.id
        );

        if (user) {
          state.user = user;
          enterApp();
          return;
        }
      }

      $("#authGate")?.classList.remove("hidden");
    }, 900);
  }

  // ============================================================
  // ENTER APPLICATION
  // ============================================================

  function enterApp() {
    $("#authGate")?.classList.add("hidden");
    $("#app")?.classList.remove("hidden");

    applyTheme();
    renderProfile();
    renderTasks();
    renderPhotos();
    renderGames();
    updateBudget();
    startAmbientBackground();
  }

  // ============================================================
  // THEME
  // ============================================================

  function applyTheme() {
    document.body.classList.toggle(
      "light-theme",
      state.theme === "light"
    );

    $$("[data-theme]").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.theme === state.theme
      );
    });
  }

  // ============================================================
  // PROFILE
  // ============================================================

  function setAvatar(element, user) {
    if (!element || !user) return;

    if (user.avatar) {
      element.innerHTML = `
        <img
          src="${user.avatar}"
          alt="Profile"
        >
      `;
    } else {
      element.textContent =
        user.username.charAt(0).toUpperCase();
    }
  }

  function renderProfile() {
    if (!state.user) return;

    $("#profileUsername").value = state.user.username;
    $("#profileEmail").value = state.user.email;
    $("#profileCountry").value = state.user.country;
    $("#profileEntity").value = state.user.entity;

    setAvatar($("#profileBtn"), state.user);
    setAvatar($("#profileAvatar"), state.user);
  }

  // ============================================================
  // TASKS
  // ============================================================

  function renderTasks() {
    const search =
      ($("#taskSearch")?.value || "").toLowerCase();

    const maximumBudget =
      Number($("#budgetSlider")?.value || 10000);

    const filtered = tasks.filter((task) => {
      const searchable = (
        task.title +
        " " +
        task.desc +
        " " +
        task.tags.join(" ")
      ).toLowerCase();

      return (
        searchable.includes(search) &&
        task.budget <= maximumBudget
      );
    });

    const grid = $("#taskGrid");

    if (!grid) return;

    if (!filtered.length) {
      grid.innerHTML = `
        <article class="task-card glass">
          <h4>No matching missions</h4>
          <p>
            Try a broader search or increase the regional budget.
          </p>
        </article>
      `;
    } else {
      grid.innerHTML = filtered.map((task) => `
        <article class="task-card glass">
          <span>
            ${escapeHTML(task.tags[0])} / INCOMING
          </span>

          <strong class="task-budget">
            ${money(task.budget)}
          </strong>

          <h4>
            ${escapeHTML(task.title)}
          </h4>

          <p>
            ${escapeHTML(task.desc)}
          </p>

          <div>
            ${task.tags.map((tag) => `
              <span class="tag">${escapeHTML(tag)}</span>
            `).join("")}
          </div>
        </article>
      `).join("");
    }

    const counter = $("#taskCount");

    if (counter) {
      counter.textContent =
        `${String(filtered.length).padStart(2, "0")} MATCHES`;
    }
  }

  // ============================================================
  // BUDGET
  // ============================================================

  function updateBudget() {
    const slider = $("#budgetSlider");
    const output = $("#budgetValue");

    if (!slider || !output) return;

    const value = Number(slider.value);

    output.textContent = money(value);

    const labels = $$(".range-labels span");

    if (labels.length >= 2) {
      labels[0].textContent = money(50);
      labels[1].textContent = money(10000);
    }
  }

  // ============================================================
  // PHOTO GALLERY
  // ============================================================

  function getPhotos() {
    try {
      return JSON.parse(
        localStorage.getItem(PHOTO_KEY) || "[]"
      );
    } catch {
      return [];
    }
  }

  function renderPhotos() {
    let photos = getPhotos();

    const search =
      ($("#photoSearch")?.value || "").toLowerCase();

    if (search) {
      photos = photos.filter((photo) => {
        return (
          photo.title +
          " " +
          photo.desc
        ).toLowerCase().includes(search);
      });
    }

    const gallery = $("#photoGallery");

    if (!gallery) return;

    if (!photos.length) {
      gallery.innerHTML = `
        <div class="task-card glass">
          <h4>Gallery is quiet.</h4>
          <p>
            Upload the first visual asset to activate
            this exchange.
          </p>
        </div>
      `;

      return;
    }

    gallery.innerHTML = photos.map((photo, index) => `
      <article class="photo-card">

        <img
          src="${photo.data}"
          alt="${escapeHTML(photo.title)}"
        >

        <div class="photo-info">

          <strong>
            ${escapeHTML(photo.title)}
          </strong>

          <p>
            ${escapeHTML(
              photo.desc || "Community visual asset"
            )}
          </p>

          <button
            class="install-btn"
            data-photo="${index}"
          >
            INSTALL / DOWNLOAD
          </button>

        </div>

      </article>
    `).join("");

    $$("#photoGallery .install-btn")
      .forEach((button) => {
        button.onclick = () => {
          const photo =
            photos[Number(button.dataset.photo)];

          downloadPhoto(photo);
        };
      });
  }

  function downloadPhoto(photo) {
    if (!photo) return;

    const link = document.createElement("a");

    link.href = photo.data;
    link.download =
      (photo.title || "wexla-asset")
        .replace(/\s+/g, "-") +
      ".png";

    link.click();

    toast("Asset acquisition started.");
  }

  // ============================================================
  // GAME CARDS
  // ============================================================

  function renderGames() {
    const grid = $("#gameGrid");

    if (!grid) return;

    grid.innerHTML = games.map((game) => `
      <article
        class="game-card glass"
        data-game="${game[0]}"
      >

        <div class="game-art">
          ${game[2]}
        </div>

        <span>
          ${game[0].toUpperCase()} / ARCADE
        </span>

        <h3>
          ${escapeHTML(game[1])}
        </h3>

        <p>
          ${escapeHTML(game[4])}
        </p>

      </article>
    `).join("");

    $$(".game-card").forEach((card) => {
      card.onclick = () => {
        launchGame(card.dataset.game);
      };
    });
  }

  // ============================================================
  // MODALS
  // ============================================================

  function openModal(selector) {
    $(selector)?.classList.add("open");
  }

  function closeModal(selector) {
    $(selector)?.classList.remove("open");
  }

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  function setupAuthentication() {

    $$("[data-auth-tab]").forEach((button) => {

      button.onclick = () => {

        $$("[data-auth-tab]")
          .forEach((item) => {
            item.classList.toggle(
              "active",
              item === button
            );
          });

        const login =
          button.dataset.authTab === "login";

        $("#loginForm")?.classList.toggle(
          "hidden",
          !login
        );

        $("#registerForm")?.classList.toggle(
          "hidden",
          login
        );
      };

    });

    // Account type switch
    $$(".switch-option").forEach((button) => {

      button.onclick = () => {

        $$(".switch-option")
          .forEach((item) => {
            item.classList.remove("active");
          });

        button.classList.add("active");

        state.entity = button.dataset.entity;
      };

    });

    // Registration
    $("#registerForm")?.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const error = $("#registerError");

        const username =
          $("#regUsername").value.trim();

        const email =
          $("#regEmail").value.trim().toLowerCase();

        const password =
          $("#regPassword").value;

        const country =
          $("#regCountry").value;

        const phone =
          $("#regPhone").value.trim();

        const existingUsers = getUsers();

        if (
          existingUsers.some(
            (user) =>
              user.username.toLowerCase() ===
              username.toLowerCase()
          )
        ) {
          error.textContent =
            "IDENTITY REJECTED: username already exists.";

          return;
        }

        if (
          existingUsers.some(
            (user) => user.email === email
          )
        ) {
          error.textContent =
            "IDENTITY REJECTED: email already exists.";

          return;
        }

        if (
          !/^[A-Za-z0-9_.-]{3,24}$/.test(username)
        ) {
          error.textContent =
            "Username must contain 3–24 valid characters.";

          return;
        }

        if (
          !/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(password)
        ) {
          error.textContent =
            "Password requires 8+ characters with letters and numbers.";

          return;
        }

        if (!country) {
          error.textContent =
            "Please select your country.";

          return;
        }

        const user = {
          id: crypto.randomUUID(),
          username,
          email,
          password,
          country,
          phone,
          entity: state.entity,
          avatar: null,
          created: Date.now()
        };

        existingUsers.push(user);

        saveUsers(existingUsers);

        state.user = user;

        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            id: user.id
          })
        );

        error.textContent = "";

        toast("Identity registered.");

        enterApp();
      }
    );

    // Login
    $("#loginForm")?.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const identity =
          $("#loginIdentity")
            .value
            .trim()
            .toLowerCase();

        const password =
          $("#loginPassword").value;

        const user =
          getUsers().find(
            (item) =>
              (
                item.username.toLowerCase() ===
                identity ||
                item.email === identity
              ) &&
              item.password === password
          );

        if (!user) {
          $("#loginError").textContent =
            "ACCESS DENIED: identity or password mismatch.";

          return;
        }

        $("#loginError").textContent = "";

        state.user = user;

        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            id: user.id
          })
        );

        toast("Authentication verified.");

        enterApp();
      }
    );
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  function setupNavigation() {

    $$("[data-nav]").forEach((button) => {

      button.onclick = (event) => {

        event.preventDefault();

        const pageName =
          button.dataset.nav;

        $$(".page").forEach((page) => {
          page.classList.remove("active");
        });

        $(`#${pageName}Page`)
          ?.classList.add("active");

        $$(".nav-btn").forEach((item) => {
          item.classList.toggle(
            "active",
            item.dataset.nav === pageName
          );
        });

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      };

    });

    // Profile panel
    $("#profileBtn")?.addEventListener(
      "click",
      () => {
        $("#profilePanel")
          ?.classList.add("open");

        $("#panelBackdrop")
          ?.classList.add("open");
      }
    );

    function closeProfile() {
      $("#profilePanel")
        ?.classList.remove("open");

      $("#panelBackdrop")
        ?.classList.remove("open");
    }

    $$("[data-close-profile]").forEach(
      (button) => {
        button.onclick = closeProfile;
      }
    );

    $("#profileClose")?.addEventListener(
      "click",
      closeProfile
    );

    $("#panelBackdrop")?.addEventListener(
      "click",
      closeProfile
    );

    // Profile photo
    $("#avatarInput")?.addEventListener(
      "change",
      (event) => {

        const file =
          event.target.files[0];

        if (!file) return;

        const reader =
          new FileReader();

        reader.onload = () => {

          state.user.avatar =
            reader.result;

          const allUsers = getUsers();

          const index =
            allUsers.findIndex(
              (user) =>
                user.id === state.user.id
            );

          if (index !== -1) {
            allUsers[index] = state.user;
            saveUsers(allUsers);
          }

          renderProfile();

          toast("Profile visual updated.");
        };

        reader.readAsDataURL(file);
      }
    );

    // Theme
    $$("[data-theme]").forEach((button) => {

      button.onclick = () => {

        state.theme =
          button.dataset.theme;

        localStorage.setItem(
          "wexla_theme",
          state.theme
        );

        applyTheme();
      };

    });

    // Logout
    $("#logoutBtn")?.addEventListener(
      "click",
      () => {
        localStorage.removeItem(
          SESSION_KEY
        );

        location.reload();
      }
    );
  }

  // ============================================================
  // HOME
  // ============================================================

  function setupHome() {
    $("#taskSearch")?.addEventListener("input", renderTasks);

    $("#budgetSlider")?.addEventListener("input", () => {
      updateBudget();
      renderTasks();
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("#taskSearch")?.focus();
      }
    });

    $$(".service-card").forEach((card) => {
      card.onclick = () => {
        const title = card.dataset.service;
        $("#serviceTitle").textContent = title;
        $("#servicePhone").value = state.user?.phone || "";
        $("#serviceEmail").value = state.user?.email || "";
        $("#serviceBudget").value = $("#budgetSlider")?.value || 500;
        $("#serviceDesc").value = "";
        $("#serviceError").textContent = "";
        $("#serviceIdeaPhoto").value = "";
        $("#servicePreview")?.classList.add("hidden");
        const ideaWrap = $("#serviceIdeaWrap");
        ideaWrap?.classList.toggle("hidden", !["Making Apps", "Making 2D Games"].includes(title));
        openModal("#serviceModal");
      };
    });

    $("#serviceIdeaPhoto")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      const preview = $("#servicePreview");
      if (!file || !preview) return;
      if (!file.type.startsWith("image/")) {
        event.target.value = "";
        preview.classList.add("hidden");
        toast("Please select an image file.");
        return;
      }
      try {
        const dataUrl = await imageToDataURL(file, 900, .72);
        preview.innerHTML = `<img src="${dataUrl}" alt="Idea preview"><span>IDEA PREVIEW READY</span>`;
        preview.classList.remove("hidden");
      } catch {
        preview.classList.add("hidden");
        toast("Could not preview that image.");
      }
    });

    $$('[data-close-modal]').forEach((button) => {
      button.onclick = () => closeModal("#serviceModal");
    });

    $("#serviceForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const budget = Number($("#serviceBudget").value);
      const phone = $("#servicePhone").value.trim();
      const email = $("#serviceEmail").value.trim().toLowerCase();
      const description = $("#serviceDesc").value.trim();
      const title = $("#serviceTitle").textContent.trim();
      const error = $("#serviceError");

      if (!phone || !email || !description) {
        error.textContent = "CONTACT NO, EMAIL and WORK DESCRIPTION are required.";
        return;
      }
      if (budget < 50 || budget > 10000) {
        error.textContent = "Budget must be between 50 and 10,000.";
        return;
      }

      error.textContent = "";
      try {
        let imageBlob = null;
        const ideaFile = $("#serviceIdeaPhoto")?.files?.[0];
        if (ideaFile && ["Making Apps", "Making 2D Games"].includes(title)) {
          imageBlob = await imageToBlob(ideaFile, 1000, .76);
        }

        const mission = {
          id: crypto.randomUUID(),
          title,
          desc: description,
          budget,
          phone,
          email,
          owner: state.user?.username || "Wexla Client",
          ownerId: state.user?.id || null,
          created: Date.now(),
          imageBlob
        };

        await putMission(mission);
        closeModal("#serviceModal");
        event.target.reset();
        $("#serviceIdeaWrap")?.classList.add("hidden");
        $("#servicePreview")?.classList.add("hidden");
        renderTasks();
        toast("Incoming mission published successfully.");
      } catch (err) {
        console.error(err);
        error.textContent = "Mission could not be saved. Please try a smaller image.";
      }
    });

    $$('[data-photo-tab]').forEach((button) => {
      button.onclick = () => {
        $$('[data-photo-tab]').forEach((item) => item.classList.toggle('active', item === button));
        $("#photoUploadPane")?.classList.toggle("hidden", button.dataset.photoTab !== "upload");
        $("#photoSearchPane")?.classList.toggle("hidden", button.dataset.photoTab !== "search");
        renderPhotos();
      };
    });

    $("#photoSearch")?.addEventListener("input", renderPhotos);

    $("#photoFile")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      const dropzone = document.querySelector(".dropzone");
      if (file && dropzone) {
        const text = dropzone.querySelector("strong");
        if (text) text.textContent = file.name;
      }
    });

    $("#photoForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const file = $("#photoFile")?.files?.[0];
      if (!file) {
        toast("Select a photo first.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast("Please select an image.");
        return;
      }

      try {
        const blob = await imageToBlob(file, 1600, .82);
        const photo = {
          id: crypto.randomUUID(),
          title: $("#photoTitle").value.trim(),
          desc: $("#photoDescription").value.trim(),
          blob,
          owner: state.user?.username || "Wexla Creator",
          created: Date.now()
        };
        await putPhoto(photo);
        event.target.reset();
        const text = document.querySelector(".dropzone strong");
        if (text) text.textContent = "SELECT A LOCAL PHOTO";
        await renderPhotos();
        toast("Visual asset published to the gallery.");
      } catch (err) {
        console.error(err);
        toast("Photo could not be saved. Try a smaller image.");
      }
    });

    $$('[data-close-mission]').forEach((button) => {
      button.onclick = () => closeModal("#missionModal");
    });

    $("#missionModal")?.addEventListener("click", (event) => {
      if (event.target.id === "missionModal") closeModal("#missionModal");
    });
  }

  // ============================================================
  // LOCAL-FIRST MEDIA DATABASE
  // ============================================================

  function openMediaDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const request = indexedDB.open(MEDIA_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "id" });
        if (!db.objectStoreNames.contains("missions")) db.createObjectStore("missions", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function idbPut(storeName, value) {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => { db.close(); resolve(value); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function idbGetAll(storeName) {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => { db.close(); resolve(request.result || []); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  }

  async function idbGet(storeName, id) {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).get(id);
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  }

  async function putPhoto(photo) { return idbPut("photos", photo); }
  async function putMission(mission) { return idbPut("missions", mission); }

  function imageToBlob(file, maxSize = 1600, quality = .82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Image decode failed"));
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext("2d", { alpha: false });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", quality);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function imageToDataURL(file, maxSize = 900, quality = .72) {
    return imageToBlob(file, maxSize, quality).then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    }));
  }

  function blobURL(blob) {
    return blob instanceof Blob ? URL.createObjectURL(blob) : String(blob || "");
  }

  async function migrateOldPhotos() {
    let old = [];
    try { old = JSON.parse(localStorage.getItem(PHOTO_KEY) || "[]"); } catch { old = []; }
    if (!old.length) return;
    try {
      const current = await idbGetAll("photos");
      if (current.length) return;
      for (const item of old) {
        if (!item.data) continue;
        try {
          const response = await fetch(item.data);
          const blob = await response.blob();
          await putPhoto({ id: item.id || crypto.randomUUID(), title: item.title || "Untitled", desc: item.desc || "", blob, owner: item.owner || "Wexla Creator", created: Date.now() });
        } catch {}
      }
      localStorage.removeItem(PHOTO_KEY);
    } catch {}
  }

  async function getGalleryPhotos() {
    await migrateOldPhotos();
    try { return await idbGetAll("photos"); } catch { return []; }
  }

  // ============================================================
  // INCOMING MISSIONS
  // ============================================================

  async function getMissions() {
    try { return (await idbGetAll("missions")).sort((a, b) => b.created - a.created); }
    catch { return []; }
  }

  function missionMatches(mission, search, maximumBudget) {
    const searchable = `${mission.title} ${mission.desc} ${mission.email} ${mission.owner}`.toLowerCase();
    return searchable.includes(search) && mission.budget <= maximumBudget;
  }

  async function renderTasks() {
    const grid = $("#taskGrid");
    if (!grid) return;
    const search = ($("#taskSearch")?.value || "").trim().toLowerCase();
    const maximumBudget = Number($("#budgetSlider")?.value || 10000);
    const missions = (await getMissions()).filter((mission) => missionMatches(mission, search, maximumBudget));

    if (!missions.length) {
      grid.innerHTML = `<article class="task-card glass empty-mission"><span>INCOMING / 00</span><h4>No incoming missions yet.</h4><p>Choose Website, PPT, Video Editing, Apps or 2D Games above to publish the first client requirement.</p></article>`;
    } else {
      grid.innerHTML = missions.map((mission) => `
        <article class="task-card mission-card glass" data-mission-id="${escapeHTML(mission.id)}">
          <div class="mission-card-thumb"><span>${escapeHTML((mission.title || "MISSION").slice(0, 1).toUpperCase())}</span></div>
          <div class="mission-card-copy">
            <span>${escapeHTML(mission.title)} / INCOMING</span>
            <strong class="task-budget">${money(mission.budget)}</strong>
            <h4>${escapeHTML(mission.desc.slice(0, 78))}${mission.desc.length > 78 ? "…" : ""}</h4>
            <p>CLIENT: ${escapeHTML(mission.email)}</p>
            <div><span class="tag">${escapeHTML(mission.owner || "CLIENT")}</span><span class="tag">OPEN BRIEF</span></div>
          </div>
        </article>
      `).join("");
    }

    const counter = $("#taskCount");
    if (counter) counter.textContent = `${String(missions.length).padStart(2, "0")} MATCHES`;

    $$(".mission-card").forEach((card) => {
      card.onclick = () => openMission(card.dataset.missionId);
    });
  }

  async function openMission(id) {
    const mission = await idbGet("missions", id);
    if (!mission) return;
    $("#missionType").textContent = `${mission.title.toUpperCase()} / INCOMING MISSION`;
    $("#missionTitle").textContent = "Client requirement";
    $("#missionDescription").textContent = mission.desc;
    $("#missionEmail").textContent = mission.email;
    $("#missionPhone").textContent = mission.phone;
    $("#missionBudget").textContent = money(mission.budget);

    const thumb = $("#missionThumb");
    if (thumb._objectUrl) URL.revokeObjectURL(thumb._objectUrl);
    if (mission.imageBlob) {
      thumb._objectUrl = blobURL(mission.imageBlob);
      thumb.src = thumb._objectUrl;
      thumb.classList.remove("hidden");
    } else {
      thumb._objectUrl = "";
      thumb.removeAttribute("src");
      thumb.classList.add("hidden");
    }
    openModal("#missionModal");
  }

  // ============================================================
  // PHOTO GALLERY OVERRIDE — IndexedDB + touch friendly
  // ============================================================

  async function renderPhotos() {
    const gallery = $("#photoGallery");
    if (!gallery) return;
    const search = ($("#photoSearch")?.value || "").trim().toLowerCase();
    const photos = (await getGalleryPhotos()).filter((photo) => `${photo.title} ${photo.desc}`.toLowerCase().includes(search));
    gallery.innerHTML = "";

    if (!photos.length) {
      gallery.innerHTML = `<div class="task-card glass"><h4>Gallery is quiet.</h4><p>Upload the first visual asset to activate this exchange.</p></div>`;
      return;
    }

    photos.forEach((photo) => {
      const card = document.createElement("article");
      card.className = "photo-card";
      const image = document.createElement("img");
      image.alt = photo.title || "Wexla asset";
      image.src = blobURL(photo.blob);
      const info = document.createElement("div");
      info.className = "photo-info";
      const title = document.createElement("strong");
      title.textContent = photo.title || "Untitled";
      const desc = document.createElement("p");
      desc.textContent = photo.desc || "Community visual asset";
      const owner = document.createElement("small");
      owner.textContent = `UPLOADED BY ${photo.owner || "CREATOR"}`;
      const button = document.createElement("button");
      button.className = "install-btn";
      button.textContent = "INSTALL / DOWNLOAD";
      button.onclick = () => downloadPhoto(photo);
      info.append(title, desc, owner, button);
      card.append(image, info);
      gallery.append(card);
    });
  }

  function downloadPhoto(photo) {
    if (!photo) return;
    const url = photo.blob instanceof Blob ? URL.createObjectURL(photo.blob) : photo.data;
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(photo.title || "wexla-asset").replace(/[^a-z0-9_-]+/gi, "-")}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (photo.blob instanceof Blob) setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Asset acquisition started.");
  }

  // ============================================================
  // MOBILE GAME CONTROLLER
  // ============================================================

  function setupMobileGameControls() {
    const controls = $("#mobileGameControls");
    if (!controls) return;
    controls.addEventListener("pointerdown", (event) => {
      const button = event.target.closest("[data-key]");
      if (!button) return;
      event.preventDefault();
      const key = button.dataset.key;
      window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      button.classList.add("pressed");
    });
    const release = (event) => {
      const button = event.target.closest?.("[data-key]");
      if (!button) return;
      const key = button.dataset.key;
      window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      button.classList.remove("pressed");
    };
    controls.addEventListener("pointerup", release);
    controls.addEventListener("pointercancel", release);
    controls.addEventListener("pointerleave", release);
  }

  // ============================================================
  // AMBIENT PARTICLES
  // ============================================================

  function startAmbientBackground() {

    const canvas =
      $("#ambientCanvas");

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    let particles = [];

    function resize() {

      canvas.width =
        window.innerWidth *
        devicePixelRatio;

      canvas.height =
        window.innerHeight *
        devicePixelRatio;

      ctx.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
      );

      particles =
        Array.from(
          { length: 55 },
          () => ({
            x: Math.random() *
              window.innerWidth,

            y: Math.random() *
              window.innerHeight,

            speed:
              (Math.random() - 0.5) *
              0.25,

            radius:
              Math.random() * 1.7 + 0.4
          })
        );
    }

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    function animate() {

      ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      ctx.fillStyle =
        "rgba(0,246,255,.45)";

      particles.forEach((particle) => {

        particle.y += particle.speed;

        if (particle.y < 0)
          particle.y =
            window.innerHeight;

        if (particle.y >
          window.innerHeight)
          particle.y = 0;

        ctx.beginPath();

        ctx.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        );

        ctx.fill();
      });

      requestAnimationFrame(
        animate
      );
    }

    animate();
  }

  // ============================================================
  // GAME ENGINE
  // ============================================================

  function launchGame(id) {

    if (state.gameCleanup) {
      state.gameCleanup();
    }

    state.game = id;

    const game =
      games.find((item) => item[0] === id);

    if (!game) return;

    $("#gameTitle").textContent =
      game[1];

    $("#gameHint").textContent =
      game[3];

    $("#gameScore").textContent =
      "SCORE 0";

    openModal("#gameModal");

    resizeGameCanvas();

    startGame(id);
  }

  function resizeGameCanvas() {

    const canvas =
      $("#gameCanvas");

    if (!canvas) return;

    const ratio =
      window.devicePixelRatio || 1;

    const rect =
      canvas.getBoundingClientRect();

    canvas.width =
      rect.width * ratio;

    canvas.height =
      rect.height * ratio;

    const ctx =
      canvas.getContext("2d");

    ctx.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );
  }

  function gameScore(value) {
    $("#gameScore").textContent =
      "SCORE " + Math.floor(value);
  }

  function startGame(id) {

    const canvas =
      $("#gameCanvas");

    const ctx =
      canvas.getContext("2d");

    const width =
      () => canvas.clientWidth;

    const height =
      () => canvas.clientHeight;

    let animationFrame;

    const keys = {};

    const pointer = {
      x: 0,
      y: 0,
      down: false
    };

    const keyDown = (event) => {
      keys[event.key.toLowerCase()] = true;

      if (event.key === " ") {
        keys.space = true;
      }
    };

    const keyUp = (event) => {
      keys[event.key.toLowerCase()] = false;

      if (event.key === " ") {
        keys.space = false;
      }
    };

    const pointerDown = (event) => {

      pointer.down = true;

      const rect =
        canvas.getBoundingClientRect();

      pointer.x =
        event.clientX - rect.left;

      pointer.y =
        event.clientY - rect.top;
    };

    const pointerMove = (event) => {

      const rect =
        canvas.getBoundingClientRect();

      pointer.x =
        event.clientX - rect.left;

      pointer.y =
        event.clientY - rect.top;
    };

    window.addEventListener(
      "keydown",
      keyDown
    );

    window.addEventListener(
      "keyup",
      keyUp
    );

    canvas.addEventListener(
      "pointerdown",
      pointerDown
    );

    canvas.addEventListener(
      "pointermove",
      pointerMove
    );

    function cleanup() {

      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "keydown",
        keyDown
      );

      window.removeEventListener(
        "keyup",
        keyUp
      );

      canvas.removeEventListener(
        "pointerdown",
        pointerDown
      );

      canvas.removeEventListener(
        "pointermove",
        pointerMove
      );
    }

    state.gameCleanup =
      cleanup;

    function background() {

      const w = width();
      const h = height();

      ctx.fillStyle =
        "#03060c";

      ctx.fillRect(
        0,
        0,
        w,
        h
      );

      ctx.strokeStyle =
        "rgba(0,246,255,.06)";

      for (
        let x = 0;
        x < w;
        x += 40
      ) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (
        let y = 0;
        y < h;
        y += 40
      ) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // ========================================================
    // TIC TAC TOE
    // ========================================================

    if (id === "ttt") {

      let board =
        Array(9).fill("");

      let gameOver = false;

      function winner() {

        const combinations = [
          [0,1,2],
          [3,4,5],
          [6,7,8],
          [0,3,6],
          [1,4,7],
          [2,5,8],
          [0,4,8],
          [2,4,6]
        ];

        for (const combination of combinations) {

          const [a,b,c] =
            combination;

          if (
            board[a] &&
            board[a] === board[b] &&
            board[b] === board[c]
          ) {
            return board[a];
          }
        }

        if (board.every(Boolean))
          return "DRAW";

        return null;
      }

      function aiMove() {

        if (gameOver) return;

        const empty =
          board
            .map((value,index) =>
              value ? null : index
            )
            .filter(
              (value) =>
                value !== null
            );

        if (!empty.length) return;

        // Try to win
        for (const index of empty) {

          board[index] = "O";

          if (winner() === "O")
            return;

          board[index] = "";
        }

        // Block player
        for (const index of empty) {

          board[index] = "X";

          if (winner() === "X") {
            board[index] = "O";
            return;
          }

          board[index] = "";
        }

        if (!board[4]) {
          board[4] = "O";
          return;
        }

        const random =
          empty[
            Math.floor(
              Math.random() *
              empty.length
            )
          ];

        board[random] = "O";
      }

      const click =
        (event) => {

          if (gameOver) return;

          const rect =
            canvas.getBoundingClientRect();

          const x =
            event.clientX -
            rect.left;

          const y =
            event.clientY -
            rect.top;

          const size =
            Math.min(width(), height()) /
            3;

          const offsetX =
            (width() - size * 3) / 2;

          const offsetY =
            (height() - size * 3) / 2;

          const col =
            Math.floor(
              (x - offsetX) / size
            );

          const row =
            Math.floor(
              (y - offsetY) / size
            );

          const index =
            row * 3 + col;

          if (
            index < 0 ||
            index > 8 ||
            board[index]
          ) return;

          board[index] = "X";

          if (winner()) {
            gameOver = true;
            return;
          }

          setTimeout(() => {

            aiMove();

            if (winner()) {
              gameOver = true;
            }

          }, 220);
        };

      canvas.addEventListener(
        "pointerdown",
        click
      );

      state.gameCleanup = () => {
        cleanup();

        canvas.removeEventListener(
          "pointerdown",
          click
        );
      };

      function draw() {

        background();

        const size =
          Math.min(width(), height()) /
          3;

        const ox =
          (width() - size * 3) / 2;

        const oy =
          (height() - size * 3) / 2;

        ctx.strokeStyle =
          "rgba(0,246,255,.6)";

        ctx.lineWidth = 2;

        for (let i = 1; i < 3; i++) {

          ctx.beginPath();

          ctx.moveTo(
            ox + i * size,
            oy
          );

          ctx.lineTo(
            ox + i * size,
            oy + size * 3
          );

          ctx.moveTo(
            ox,
            oy + i * size
          );

          ctx.lineTo(
            ox + size * 3,
            oy + i * size
          );

          ctx.stroke();
        }

        board.forEach((value,index) => {

          if (!value) return;

          ctx.fillStyle =
            value === "X"
              ? "#00f6ff"
              : "#ff3fb4";

          ctx.font =
            `900 ${size * .55}px Segoe UI`;

          ctx.textAlign =
            "center";

          ctx.fillText(
            value,
            ox + (index % 3 + .5) * size,
            oy +
              (Math.floor(index / 3) + .68) *
              size
          );
        });

        ctx.textAlign = "left";

        const result =
          winner();

        if (result) {

          gameOver = true;

          ctx.fillStyle =
            "#00f6ff";

          ctx.font =
            "900 20px Segoe UI";

          ctx.fillText(
            result === "DRAW"
              ? "DRAW"
              : result + " WINS",
            width() / 2 - 40,
            height() - 25
          );

          gameScore(
            result === "X"
              ? 100
              : 0
          );
        }

        animationFrame =
          requestAnimationFrame(draw);
      }

      draw();

      return;
    }

    // ========================================================
    // SNAKE
    // ========================================================

    if (id === "snake") {

      const grid = 20;

      let snake = [
        {x:8,y:8},
        {x:7,y:8},
        {x:6,y:8}
      ];

      let direction =
        {x:1,y:0};

      let nextDirection =
        {x:1,y:0};

      let food =
        {x:14,y:9};

      let points = 0;
      let lastTime = 0;

      function placeFood() {

        food = {
          x:
            Math.floor(
              Math.random() * grid
            ),

          y:
            Math.floor(
              Math.random() * grid
            )
        };
      }

      const directionKey =
        (event) => {

          const key =
            event.key.toLowerCase();

          if (
            key === "arrowup" ||
            key === "w"
          ) {
            if (direction.y === 0)
              nextDirection =
                {x:0,y:-1};
          }

          if (
            key === "arrowdown" ||
            key === "s"
          ) {
            if (direction.y === 0)
              nextDirection =
                {x:0,y:1};
          }

          if (
            key === "arrowleft" ||
            key === "a"
          ) {
            if (direction.x === 0)
              nextDirection =
                {x:-1,y:0};
          }

          if (
            key === "arrowright" ||
            key === "d"
          ) {
            if (direction.x === 0)
              nextDirection =
                {x:1,y:0};
          }
        };

      window.addEventListener(
        "keydown",
        directionKey
      );

      state.gameCleanup = () => {
        cleanup();

        window.removeEventListener(
          "keydown",
          directionKey
        );
      };

      function draw(time) {

        if (
          time - lastTime < 100
        ) {
          animationFrame =
            requestAnimationFrame(draw);

          return;
        }

        lastTime = time;

        direction =
          nextDirection;

        const head = {
          x:
            snake[0].x +
            direction.x,

          y:
            snake[0].y +
            direction.y
        };

        const collision =
          head.x < 0 ||
          head.y < 0 ||
          head.x >= grid ||
          head.y >= grid ||
          snake.some(
            (part) =>
              part.x === head.x &&
              part.y === head.y
          );

        if (collision) {

          snake = [
            {x:8,y:8},
            {x:7,y:8},
            {x:6,y:8}
          ];

          direction =
            {x:1,y:0};

          nextDirection =
            {x:1,y:0};

          points = 0;

          placeFood();
        } else {

          snake.unshift(head);

          if (
            head.x === food.x &&
            head.y === food.y
          ) {

            points += 10;

            gameScore(points);

            placeFood();

          } else {
            snake.pop();
          }
        }

        background();

        const cell =
          Math.min(
            width(),
            height()
          ) / grid;

        const offsetX =
          (width() - cell * grid) / 2;

        const offsetY =
          (height() - cell * grid) / 2;

        snake.forEach(
          (part,index) => {

            ctx.fillStyle =
              index === 0
                ? "#ffffff"
                : "#00b9d0";

            ctx.shadowBlur = 16;

            ctx.shadowColor =
              "#00f6ff";

            ctx.fillRect(
              offsetX +
                part.x * cell + 2,

              offsetY +
                part.y * cell + 2,

              cell - 4,
              cell - 4
            );
          }
        );

        ctx.shadowBlur = 0;

        ctx.fillStyle =
          "#ff3fb4";

        ctx.beginPath();

        ctx.arc(
          offsetX +
            (food.x + .5) * cell,

          offsetY +
            (food.y + .5) * cell,

          cell * .35,
          0,
          Math.PI * 2
        );

        ctx.fill();

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // FLAPPY
    // ========================================================

    if (id === "flappy") {

      let y = height() / 2;
      let velocity = 0;

      const gravity = .45;

      let obstacles = [];
      let frame = 0;
      let points = 0;

      function draw() {

        background();

        velocity += gravity;
        y += velocity;

        if (
          keys.space ||
          pointer.down
        ) {
          velocity = -7;
          pointer.down = false;
        }

        frame++;

        if (frame % 85 === 0) {

          const gap = 145;

          const top =
            60 +
            Math.random() *
            (
              height() -
              gap -
              120
            );

          obstacles.push({
            x: width() + 20,
            top,
            gap,
            passed: false
          });
        }

        obstacles.forEach(
          (obstacle) => {
            obstacle.x -= 3.2;
          }
        );

        obstacles =
          obstacles.filter(
            (obstacle) =>
              obstacle.x > -80
          );

        obstacles.forEach(
          (obstacle) => {

            ctx.fillStyle =
              "#00d8c8";

            ctx.shadowBlur = 12;
            ctx.shadowColor =
              "#00f6ff";

            ctx.fillRect(
              obstacle.x,
              0,
              48,
              obstacle.top
            );

            ctx.fillRect(
              obstacle.x,
              obstacle.top +
                obstacle.gap,
              48,
              height()
            );
          }
        );

        ctx.shadowBlur = 0;

        ctx.fillStyle =
          "#ffe45e";

        ctx.beginPath();

        ctx.arc(
          110,
          y,
          17,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#ff8a3d";

        ctx.fillRect(
          124,
          y - 4,
          15,
          8
        );

        for (const obstacle of obstacles) {

          if (
            127 >
              obstacle.x &&
            93 <
              obstacle.x + 48 &&
            (
              y - 17 <
                obstacle.top ||
              y + 17 >
                obstacle.top +
                obstacle.gap
            )
          ) {
            y = height() / 2;
            obstacles = [];
            points = 0;
          }

          if (
            !obstacle.passed &&
            obstacle.x < 110
          ) {

            obstacle.passed = true;

            points++;

            gameScore(
              points * 10
            );
          }
        }

        if (
          y > height() ||
          y < 0
        ) {
          y = height() / 2;
          velocity = 0;
        }

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // CYBER RACING
    // ========================================================

    if (id === "racing") {

      let lane = 1;
      let roadOffset = 0;
      let points = 0;
      let cars = [];
      let frame = 0;

      function draw() {

        background();

        const w = width();
        const h = height();

        const center =
          w / 2;

        const roadWidth =
          Math.min(
            w * .72,
            620
          );

        ctx.fillStyle =
          "#20242c";

        ctx.fillRect(
          center -
            roadWidth / 2,
          0,
          roadWidth,
          h
        );

        // Lane dividers
        ctx.strokeStyle =
          "#ffffff";

        ctx.lineWidth = 3;

        ctx.setLineDash([
          30,
          25
        ]);

        for (let i = 1; i < 3; i++) {

          ctx.beginPath();

          ctx.moveTo(
            center -
              roadWidth / 2 +
              i *
              roadWidth / 3,

            -50 +
              roadOffset
          );

          ctx.lineTo(
            center -
              roadWidth / 2 +
              i *
              roadWidth / 3,

            h +
              roadOffset
          );

          ctx.stroke();
        }

        ctx.setLineDash([]);

        // Curbs
        for (
          let y = -40;
          y < h;
          y += 65
        ) {

          ctx.fillStyle =
            (
              Math.floor(
                (y + roadOffset) /
                65
              ) % 2
            )
              ? "#ffffff"
              : "#e33";

          ctx.fillRect(
            center -
              roadWidth / 2 -
              12,

            y +
              roadOffset,

            12,
            32
          );

          ctx.fillRect(
            center +
              roadWidth / 2,

            y +
              roadOffset,

            12,
            32
          );
        }

        if (
          keys.arrowleft ||
          keys.a
        ) {
          lane -= .04;
        }

        if (
          keys.arrowright ||
          keys.d
        ) {
          lane += .04;
        }

        lane =
          Math.max(
            0,
            Math.min(2,lane)
          );

        frame++;

        if (frame % 80 === 0) {

          cars.push({
            lane:
              Math.floor(
                Math.random() * 3
              ),

            y: -80
          });
        }

        cars.forEach(
          (car) => {
            car.y += 5;
          }
        );

        cars =
          cars.filter(
            (car) =>
              car.y <
              h + 100
          );

        cars.forEach(
          (car) => {

            ctx.fillStyle =
              "#ff405e";

            ctx.fillRect(
              center -
                roadWidth / 2 +
                car.lane *
                roadWidth / 3 +
                roadWidth / 6 -
                20,

              car.y,

              40,
              65
            );
          }
        );

        ctx.fillStyle =
          "#00f6ff";

        ctx.shadowBlur = 18;
        ctx.shadowColor =
          "#00f6ff";

        ctx.fillRect(
          center -
            roadWidth / 2 +
            lane *
            roadWidth / 3 +
            roadWidth / 6 -
            22,

          h - 110,

          44,
          75
        );

        ctx.shadowBlur = 0;

        roadOffset =
          (roadOffset + 4) %
          65;

        points++;

        gameScore(
          Math.floor(points / 10)
        );

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // FRUIT NINJA
    // ========================================================

    if (id === "fruit") {

      let fruits = [];
      let points = 0;
      let trail = [];

      function spawnFruit() {

        fruits.push({
          x:
            30 +
            Math.random() *
            (width() - 60),

          y:
            height() + 20,

          velocity:
            -9 -
            Math.random() * 5,

          radius: 16,

          hue:
            Math.random() * 360
        });
      }

      function draw() {

        background();

        if (
          Math.random() < .035
        ) {
          spawnFruit();
        }

        fruits.forEach(
          (fruit) => {

            fruit.velocity += .2;

            fruit.y +=
              fruit.velocity;
          }
        );

        fruits =
          fruits.filter(
            (fruit) =>
              fruit.y <
              height() + 60
          );

        fruits.forEach(
          (fruit) => {

            ctx.fillStyle =
              `hsl(${fruit.hue},90%,60%)`;

            ctx.shadowBlur = 18;

            ctx.shadowColor =
              ctx.fillStyle;

            ctx.beginPath();

            ctx.arc(
              fruit.x,
              fruit.y,
              fruit.radius,
              0,
              Math.PI * 2
            );

            ctx.fill();
          }
        );

        ctx.shadowBlur = 0;

        if (pointer.down) {

          trail.push({
            x: pointer.x,
            y: pointer.y
          });

          fruits =
            fruits.filter(
              (fruit) => {

                const distance =
                  Math.hypot(
                    fruit.x -
                      pointer.x,

                    fruit.y -
                      pointer.y
                  );

                if (distance < 45) {

                  points += 10;

                  gameScore(points);

                  return false;
                }

                return true;
              }
            );
        }

        if (trail.length > 12) {
          trail.shift();
        }

        ctx.strokeStyle =
          "#ffffff";

        ctx.lineWidth = 3;

        ctx.beginPath();

        trail.forEach(
          (point,index) => {

            if (index) {
              ctx.lineTo(
                point.x,
                point.y
              );
            } else {
              ctx.moveTo(
                point.x,
                point.y
              );
            }
          }
        );

        ctx.stroke();

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // PARKOUR RUNNER
    // ========================================================

    if (id === "runner") {

      let playerY =
        height() - 70;

      let velocity = 0;

      const ground =
        () => height() - 45;

      let obstacles = [];
      let points = 0;
      let frame = 0;

      function draw() {

        background();

        velocity += .65;

        playerY += velocity;

        if (
          playerY >
          ground()
        ) {
          playerY =
            ground();

          velocity = 0;
        }

        if (
          (
            keys.space ||
            pointer.down
          ) &&
          playerY === ground()
        ) {
          velocity = -12;
          pointer.down = false;
        }

        frame++;

        if (
          frame % 90 === 0
        ) {
          obstacles.push({
            x:
              width() + 20,

            width:
              25 +
              Math.random() * 25,

            height:
              35 +
              Math.random() * 45
          });
        }

        obstacles.forEach(
          (obstacle) => {
            obstacle.x -= 5;
          }
        );

        obstacles =
          obstacles.filter(
            (obstacle) =>
              obstacle.x > -60
          );

        ctx.fillStyle =
          "#00f6ff";

        ctx.fillRect(
          70,
          playerY - 30,
          30,
          30
        );

        ctx.fillStyle =
          "#ff3fb4";

        obstacles.forEach(
          (obstacle) => {

            ctx.fillRect(
              obstacle.x,
              ground() -
                obstacle.height,

              obstacle.width,
              obstacle.height
            );
          }
        );

        if (
          obstacles.some(
            (obstacle) =>
              obstacle.x < 100 &&
              obstacle.x +
                obstacle.width >
                70 &&
              playerY >
                ground() -
                obstacle.height
          )
        ) {
          obstacles = [];
        }

        ctx.strokeStyle =
          "#536078";

        ctx.beginPath();

        ctx.moveTo(
          0,
          ground() + 1
        );

        ctx.lineTo(
          width(),
          ground() + 1
        );

        ctx.stroke();

        points++;

        gameScore(
          Math.floor(points / 10)
        );

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // SPACE INVADERS
    // ========================================================

    if (id === "invaders") {

      let ships = [];
      let bullets = [];
      let player =
        width() / 2;

      let points = 0;
      let frame = 0;

      for (
        let row = 0;
        row < 3;
        row++
      ) {

        for (
          let col = 0;
          col < 8;
          col++
        ) {

          ships.push({
            x:
              100 +
              col * 55,

            y:
              60 +
              row * 38
          });
        }
      }

      function draw() {

        background();

        if (
          keys.arrowleft ||
          keys.a
        ) {
          player -= 6;
        }

        if (
          keys.arrowright ||
          keys.d
        ) {
          player += 6;
        }

        player =
          Math.max(
            20,
            Math.min(
              width() - 20,
              player
            )
          );

        if (
          keys.space &&
          frame % 12 === 0
        ) {

          bullets.push({
            x: player,
            y: height() - 55
          });
        }

        bullets.forEach(
          (bullet) => {
            bullet.y -= 8;
          }
        );

        bullets =
          bullets.filter(
            (bullet) =>
              bullet.y > 0
          );

        ships =
          ships.filter(
            (ship) => {

              for (
                const bullet of bullets
              ) {

                if (
                  Math.hypot(
                    bullet.x -
                      ship.x,

                    bullet.y -
                      ship.y
                  ) < 18
                ) {

                  bullet.hit = true;

                  points += 10;

                  gameScore(points);

                  return false;
                }
              }

              return true;
            }
          );

        bullets =
          bullets.filter(
            (bullet) =>
              !bullet.hit
          );

        ctx.fillStyle =
          "#00f6ff";

        ctx.fillRect(
          player - 22,
          height() - 40,
          44,
          12
        );

        ctx.fillStyle =
          "#ff3fb4";

        ships.forEach(
          (ship) => {

            ctx.beginPath();

            ctx.arc(
              ship.x,
              ship.y,
              12,
              0,
              Math.PI * 2
            );

            ctx.fill();
          }
        );

        ctx.fillStyle =
          "#ffffff";

        bullets.forEach(
          (bullet) => {

            ctx.fillRect(
              bullet.x - 2,
              bullet.y,
              4,
              10
            );
          }
        );

        frame++;

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // BREAKOUT
    // ========================================================

    if (id === "breakout") {

      let paddleX =
        width() / 2;

      let ballX =
        width() / 2;

      let ballY =
        height() - 70;

      let velocityX = 4;
      let velocityY = -4;

      let points = 0;

      const bricks = [];

      for (
        let row = 0;
        row < 5;
        row++
      ) {

        for (
          let column = 0;
          column < 10;
          column++
        ) {

          bricks.push({
            x:
              20 +
              column *
              ((width() - 40) / 10),

            y:
              35 +
              row * 24,

            width:
              (width() - 55) / 10,

            height: 17,

            active: true
          });
        }
      }

      function draw() {

        background();

        if (
          keys.arrowleft ||
          keys.a
        ) {
          paddleX -= 7;
        }

        if (
          keys.arrowright ||
          keys.d
        ) {
          paddleX += 7;
        }

        paddleX =
          Math.max(
            50,
            Math.min(
              width() - 50,
              paddleX
            )
          );

        ballX += velocityX;
        ballY += velocityY;

        if (
          ballX < 8 ||
          ballX >
            width() - 8
        ) {
          velocityX *= -1;
        }

        if (ballY < 8) {
          velocityY *= -1;
        }

        if (
          ballY >
            height() - 45 &&
          ballX >
            paddleX - 50 &&
          ballX <
            paddleX + 50
        ) {
          velocityY =
            -Math.abs(
              velocityY
            );
        }

        if (
          ballY >
            height() + 30
        ) {

          ballX =
            paddleX;

          ballY =
            height() - 70;

          velocityY = -4;
        }

        bricks.forEach(
          (brick) => {

            if (
              brick.active &&
              ballX > brick.x &&
              ballX <
                brick.x +
                brick.width &&
              ballY > brick.y &&
              ballY <
                brick.y +
                brick.height
            ) {

              brick.active =
                false;

              velocityY *= -1;

              points += 10;

              gameScore(points);
            }
          }
        );

        ctx.fillStyle =
          "#00f6ff";

        ctx.fillRect(
          paddleX - 50,
          height() - 25,
          100,
          10
        );

        bricks.forEach(
          (brick) => {

            if (!brick.active)
              return;

            ctx.fillStyle =
              "#9b5cff";

            ctx.fillRect(
              brick.x,
              brick.y,
              brick.width,
              brick.height
            );
          }
        );

        ctx.fillStyle =
          "#ffffff";

        ctx.beginPath();

        ctx.arc(
          ballX,
          ballY,
          7,
          0,
          Math.PI * 2
        );

        ctx.fill();

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // PACMAN CYBER RUN
    // ========================================================

    if (id === "pacman") {

      const player = {
        x: width() / 2,
        y: height() / 2
      };

      let dots = [];

      for (
        let i = 0;
        i < 55;
        i++
      ) {

        dots.push({
          x:
            30 +
            Math.random() *
            (width() - 60),

          y:
            30 +
            Math.random() *
            (height() - 60)
        });
      }

      const ghosts = [
        {
          x: 80,
          y: 80
        },
        {
          x: width() - 80,
          y: 80
        },
        {
          x: width() - 80,
          y: height() - 80
        }
      ];

      let points = 0;

      function draw() {

        background();

        if (keys.arrowup)
          player.y -= 4;

        if (keys.arrowdown)
          player.y += 4;

        if (keys.arrowleft)
          player.x -= 4;

        if (keys.arrowright)
          player.x += 4;

        player.x =
          (player.x + width()) %
          width();

        player.y =
          (player.y + height()) %
          height();

        ghosts.forEach(
          (ghost) => {

            ghost.x +=
              (
                player.x >
                ghost.x
                  ? 1
                  : -1
              ) * 1.7;

            ghost.y +=
              (
                player.y >
                ghost.y
                  ? 1
                  : -1
              ) * 1.7;
          }
        );

        dots =
          dots.filter(
            (dot) => {

              if (
                Math.hypot(
                  dot.x -
                    player.x,

                  dot.y -
                    player.y
                ) < 15
              ) {

                points += 10;

                gameScore(points);

                return false;
              }

              return true;
            }
          );

        ctx.fillStyle =
          "#ffe45e";

        ctx.beginPath();

        ctx.arc(
          player.x,
          player.y,
          15,
          .25,
          Math.PI * 1.75
        );

        ctx.lineTo(
          player.x,
          player.y
        );

        ctx.fill();

        ctx.fillStyle =
          "#ffffff";

        dots.forEach(
          (dot) => {

            ctx.beginPath();

            ctx.arc(
              dot.x,
              dot.y,
              3,
              0,
              Math.PI * 2
            );

            ctx.fill();
          }
        );

        const colors = [
          "#ff3fb4",
          "#00f6ff",
          "#9b5cff"
        ];

        ghosts.forEach(
          (ghost,index) => {

            ctx.fillStyle =
              colors[index];

            ctx.beginPath();

            ctx.arc(
              ghost.x,
              ghost.y,
              14,
              Math.PI,
              0
            );

            ctx.lineTo(
              ghost.x + 14,
              ghost.y + 14
            );

            ctx.lineTo(
              ghost.x + 7,
              ghost.y + 8
            );

            ctx.lineTo(
              ghost.x,
              ghost.y + 14
            );

            ctx.lineTo(
              ghost.x - 7,
              ghost.y + 8
            );

            ctx.lineTo(
              ghost.x - 14,
              ghost.y + 14
            );

            ctx.fill();
          }
        );

        animationFrame =
          requestAnimationFrame(draw);
      }

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }

    // ========================================================
    // TETRIS
    // ========================================================

    if (id === "tetris") {

      const columns = 10;
      const rows = 20;

      let board =
        Array.from(
          {length: rows},
          () =>
            Array(columns).fill(0)
        );

      const shapes = [
        [[1,1,1,1]],
        [[1,1],[1,1]],
        [[1,1,0],[0,1,1]],
        [[1,0,0],[1,1,1]]
      ];

      let piece;

      let points = 0;
      let lastDrop = 0;

      function newPiece() {

        piece = {
          x:
            Math.floor(
              columns / 2
            ) - 1,

          y: 0,

          shape:
            shapes[
              Math.floor(
                Math.random() *
                shapes.length
              )
            ]
        };
      }

      function collision(
        px = piece.x,
        py = piece.y,
        shape = piece.shape
      ) {

        return shape.some(
          (row,y) =>
            row.some(
              (value,x) =>
                value &&
                (
                  py + y >= rows ||
                  px + x < 0 ||
                  px + x >= columns ||
                  board[py + y]?.[
                    px + x
                  ]
                )
            )
        );
      }

      function mergePiece() {

        piece.shape.forEach(
          (row,y) => {

            row.forEach(
              (value,x) => {

                if (value) {

                  board[
                    piece.y + y
                  ][
                    piece.x + x
                  ] = 1;
                }
              }
            );
          }
        );

        board =
          board.filter(
            (row) =>
              row.some(
                (value) =>
                  !value
              )
          );

        while (
          board.length <
          rows
        ) {
          board.unshift(
            Array(columns).fill(0)
          );
        }

        points += 100;

        gameScore(points);

        newPiece();
      }

      function rotate() {

        const rotated =
          piece.shape[0].map(
            (_,index) =>
              piece.shape
                .map(
                  (row) =>
                    row[index]
                )
                .reverse()
          );

        if (
          !collision(
            piece.x,
            piece.y,
            rotated
          )
        ) {
          piece.shape =
            rotated;
        }
      }

      const controls =
        (event) => {

          if (
            event.key ===
            "ArrowLeft"
          ) {

            if (
              !collision(
                piece.x - 1
              )
            ) {
              piece.x--;
            }
          }

          if (
            event.key ===
            "ArrowRight"
          ) {

            if (
              !collision(
                piece.x + 1
              )
            ) {
              piece.x++;
            }
          }

          if (
            event.key ===
            "ArrowDown"
          ) {

            if (
              !collision(
                piece.x,
                piece.y + 1
              )
            ) {
              piece.y++;
            }
          }

          if (
            event.key ===
            "ArrowUp"
          ) {
            rotate();
          }
        };

      window.addEventListener(
        "keydown",
        controls
      );

      state.gameCleanup = () => {
        cleanup();

        window.removeEventListener(
          "keydown",
          controls
        );
      };

      function draw(time) {

        if (
          time -
          lastDrop >
          450
        ) {

          if (
            !collision(
              piece.x,
              piece.y + 1
            )
          ) {
            piece.y++;
          } else {
            mergePiece();
          }

          lastDrop = time;
        }

        background();

        const cellSize =
          Math.min(
            (width() - 30) /
              columns,

            (height() - 30) /
              rows
          );

        const offsetX =
          (
            width() -
            cellSize *
              columns
          ) / 2;

        const offsetY =
          (
            height() -
            cellSize *
              rows
          ) / 2;

        board.forEach(
          (row,y) => {

            row.forEach(
              (value,x) => {

                if (!value)
                  return;

                ctx.fillStyle =
                  "#9b5cff";

                ctx.fillRect(
                  offsetX +
                    x *
                    cellSize +
                    1,

                  offsetY +
                    y *
                    cellSize +
                    1,

                  cellSize - 2,
                  cellSize - 2
                );
              }
            );
          }
        );

        piece.shape.forEach(
          (row,y) => {

            row.forEach(
              (value,x) => {

                if (!value)
                  return;

                ctx.fillStyle =
                  "#00f6ff";

                ctx.fillRect(
                  offsetX +
                    (piece.x + x) *
                    cellSize +
                    1,

                  offsetY +
                    (piece.y + y) *
                    cellSize +
                    1,

                  cellSize - 2,
                  cellSize - 2
                );
              }
            );
          }
        );

        animationFrame =
          requestAnimationFrame(draw);
      }

      newPiece();

      animationFrame =
        requestAnimationFrame(draw);

      return;
    }
  }

  // ============================================================
  // GAME MODAL
  // ============================================================

  $("#restartGame")?.addEventListener(
    "click",
    () => {

      if (state.game) {
        launchGame(
          state.game
        );
      }
    }
  );

  $$("[data-close-game]")
    .forEach((button) => {

      button.onclick = () => {

        closeModal(
          "#gameModal"
        );

        if (
          state.gameCleanup
        ) {
          state.gameCleanup();
        }
      };

    });

  // ============================================================
  // INITIALIZE
  // ============================================================

  setupAuthentication();
  setupNavigation();
  setupHome();
  setupMobileGameControls();
  boot();

})();