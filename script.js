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
    startCloudListeners();
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
  // FIREBASE FIRESTORE — CLOUD DATA LAYER
  // ============================================================

  const firebaseReady = (async () => {
    const [
      firebaseApp,
      firebaseFirestore
    ] = await Promise.all([
      import(
        "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
      ),
      import(
        "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
      )
    ]);

    const firebaseConfig = {
      apiKey: "AIzaSyCDVwvbF4MtlQRyMODlRjKKxHKdwKAAnyI",
      authDomain: "://firebaseapp.com",
      projectId: "wexla-c0d95",
      storageBucket: "wexla-c0d95.firebasestorage.app",
      messagingSenderId: "1014259811373",
      appId: "1:1014259811373:web:5135926a7b68f38f9ea4a4",
      measurementId: "G-CZV54GE36L"
    };

    const app =
      firebaseApp.initializeApp(firebaseConfig);

    const db =
      firebaseFirestore.getFirestore(app);

    return {
      db,
      collection: firebaseFirestore.collection,
      doc: firebaseFirestore.doc,
      setDoc: firebaseFirestore.setDoc,
      getDocs: firebaseFirestore.getDocs,
      query: firebaseFirestore.query,
      orderBy: firebaseFirestore.orderBy,
      onSnapshot: firebaseFirestore.onSnapshot
    };
  })();

  // ============================================================
  // FIREBASE CLOUD STATE
  // ============================================================

  const cloudState = {
    missions: [],
    photos: [],
    missionUnsubscribe: null,
    photoUnsubscribe: null,
    listenersStarted: false
  };

  // ============================================================
  // FIREBASE ERROR HANDLING
  // ============================================================

  function firebaseErrorMessage(error) {
    if (!error) {
      return "Cloud operation failed.";
    }

    const code =
      error.code ||
      error.message ||
      "";

    if (
      code.includes("permission-denied") ||
      code.includes("PERMISSION_DENIED")
    ) {
      return "Firebase permission denied. Check your Firestore Rules.";
    }

    if (
      code.includes("failed-precondition")
    ) {
      return "Firebase needs an index or configuration update.";
    }

    if (
      code.includes("unavailable")
    ) {
      return "Firebase is temporarily unavailable. Check your internet connection.";
    }

    if (
      code.includes("network")
    ) {
      return "Network error. Please check your internet connection.";
    }

    return (
      error.message ||
      "Cloud operation failed."
    );
  }

  function showCloudImageError(error, fallback) {
    if (
      error?.message ===
      "IMAGE_TOO_LARGE_FOR_FIRESTORE"
    ) {
      toast(
        "Image is too large for Firestore after compression."
      );
      return;
    }

    toast(
      firebaseErrorMessage(error) ||
      fallback
    );
  }

  // ============================================================
  // FIRESTORE IMAGE SIZE CHECK
  // ============================================================

  function assertFirestoreImageSize(dataUrl) {
    if (!dataUrl) return;

    /*
     * Base64 uses approximately 4/3 of the original
     * binary size.
     *
     * Firestore documents have a roughly 1 MiB limit,
     * so keep the image comfortably below that limit.
     */
    const approximateBytes =
      Math.ceil((dataUrl.length * 3) / 4);

    if (approximateBytes > 700 * 1024) {
      throw new Error(
        "IMAGE_TOO_LARGE_FOR_FIRESTORE"
      );
    }
  }

  // ============================================================
  // IMAGE COMPRESSION
  // ============================================================

  function imageToBlob(
    file,
    maxSize = 1600,
    quality = 0.82
  ) {
    return new Promise((resolve, reject) => {

      const reader =
        new FileReader();

      reader.onerror = () => {
        reject(
          new Error("Could not read image.")
        );
      };

      reader.onload = () => {

        const image =
          new Image();

        image.onerror = () => {
          reject(
            new Error("Could not decode image.")
          );
        };

        image.onload = () => {

          let width =
            image.naturalWidth;

          let height =
            image.naturalHeight;

          const scale =
            Math.min(
              1,
              maxSize / Math.max(width, height)
            );

          width =
            Math.max(
              1,
              Math.round(width * scale)
            );

          height =
            Math.max(
              1,
              Math.round(height * scale)
            );

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

          context.fillStyle = "#ffffff";
          context.fillRect(
            0,
            0,
            width,
            height
          );

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {

              if (!blob) {
                reject(
                  new Error(
                    "Image compression failed."
                  )
                );

                return;
              }

              resolve(blob);
            },
            "image/jpeg",
            quality
          );
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  // ============================================================
  // BLOB → DATA URL
  // ============================================================

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {

      const reader =
        new FileReader();

      reader.onloadend = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Could not convert image."
          )
        );
      };

      reader.readAsDataURL(blob);
    });
  }

  // ============================================================
  // FILE → COMPRESSED BASE64
  // ============================================================

  async function imageToDataURL(
    file,
    maxSize = 900,
    quality = 0.72
  ) {
    const blob =
      await imageToBlob(
        file,
        maxSize,
        quality
      );

    return blobToDataURL(blob);
  }

  // ============================================================
  // SAVE PHOTO TO FIRESTORE
  // ============================================================

  async function putPhoto(photo) {

    const firebase =
      await firebaseReady;

    const photoId =
      photo.id ||
      crypto.randomUUID();

    const photoRef =
      firebase.doc(
        firebase.db,
        "photos",
        photoId
      );

    const cloudPhoto = {
      title: photo.title || "",
      desc: photo.desc || "",
      data: photo.data || "",
      owner: photo.owner || "Wexla Creator",
      created:
        Number(photo.created) ||
        Date.now()
    };

    assertFirestoreImageSize(
      cloudPhoto.data
    );

    await firebase.setDoc(
      photoRef,
      cloudPhoto
    );

    return {
      id: photoId,
      ...cloudPhoto
    };
  }

  // ============================================================
  // SAVE MISSION TO FIRESTORE
  // ============================================================

  async function putMission(mission) {

    const firebase =
      await firebaseReady;

    const missionId =
      mission.id ||
      crypto.randomUUID();

    const missionRef =
      firebase.doc(
        firebase.db,
        "missions",
        missionId
      );

    const cloudMission = {
      title: mission.title || "",
      desc: mission.desc || "",
      budget:
        Number(mission.budget) || 0,
      phone: mission.phone || "",
      email: mission.email || "",
      owner:
        mission.owner ||
        "Wexla Client",
      ownerId:
        mission.ownerId ||
        null,
      created:
        Number(mission.created) ||
        Date.now(),
      imageData:
        mission.imageData || ""
    };

    if (cloudMission.imageData) {
      assertFirestoreImageSize(
        cloudMission.imageData
      );
    }

    await firebase.setDoc(
      missionRef,
      cloudMission
    );

    return {
      id: missionId,
      ...cloudMission
    };
  }

  // ============================================================
  // GET MISSIONS FROM FIRESTORE
  // ============================================================

  async function getMissions() {

    await startCloudListeners();

    return [
      ...cloudState.missions
    ];
  }

  // ============================================================
  // GET PHOTOS FROM FIRESTORE
  // ============================================================

  async function getGalleryPhotos() {

    await startCloudListeners();

    return [
      ...cloudState.photos
    ];
  }

  // ============================================================
  // FIRESTORE REAL-TIME LISTENERS
  // ============================================================

  async function startCloudListeners() {

    if (cloudState.listenersStarted) {
      return;
    }

    cloudState.listenersStarted = true;

    try {

      const firebase =
        await firebaseReady;

      // --------------------------------------------------------
      // MISSIONS
      // --------------------------------------------------------

      const missionCollection =
        firebase.collection(
          firebase.db,
          "missions"
        );

      const missionQuery =
        firebase.query(
          missionCollection,
          firebase.orderBy(
            "created",
            "desc"
          )
        );

      cloudState.missionUnsubscribe =
        firebase.onSnapshot(
          missionQuery,

          (snapshot) => {

            cloudState.missions =
              snapshot.docs.map(
                (document) => ({
                  id: document.id,
                  ...document.data()
                })
              );

            /*
             * Keep the original render function alive.
             * Only its data source is changed.
             */
            tasks.length = 0;

            cloudState.missions.forEach(
              (mission) => {

                tasks.push({
                  id: mission.id,
                  title:
                    mission.title ||
                    "Untitled Mission",

                  desc:
                    mission.desc ||
                    "",

                  budget:
                    Number(mission.budget) ||
                    0,

                  tags: [
                    "INCOMING",
                    "WEXLA"
                  ],

                  phone:
                    mission.phone ||
                    "",

                  email:
                    mission.email ||
                    "",

                  owner:
                    mission.owner ||
                    "Wexla Client",

                  ownerId:
                    mission.ownerId ||
                    null,

                  created:
                    mission.created ||
                    0,

                  imageData:
                    mission.imageData ||
                    ""
                });

              }
            );

            renderTasks();
          },

          (error) => {

            console.error(
              "Wexla missions listener error:",
              error
            );

            toast(
              firebaseErrorMessage(error)
            );
          }
        );

      // --------------------------------------------------------
      // PHOTOS
      // --------------------------------------------------------

      const photoCollection =
        firebase.collection(
          firebase.db,
          "photos"
        );

      const photoQuery =
        firebase.query(
          photoCollection,
          firebase.orderBy(
            "created",
            "desc"
          )
        );

      cloudState.photoUnsubscribe =
        firebase.onSnapshot(
          photoQuery,

          (snapshot) => {

            cloudState.photos =
              snapshot.docs.map(
                (document) => ({
                  id: document.id,
                  ...document.data()
                })
              );

            renderPhotos();
          },

          (error) => {

            console.error(
              "Wexla photos listener error:",
              error
            );

            toast(
              firebaseErrorMessage(error)
            );
          }
        );

    } catch (error) {

      console.error(
        "Firebase initialization error:",
        error
      );

      cloudState.listenersStarted = false;

      toast(
        firebaseErrorMessage(error)
      );
    }
  }

  // ============================================================
  // OVERRIDE LOCAL PHOTO READER WITH CLOUD DATA
  // ============================================================

  /*
   * The old getPhotos() function is intentionally left above
   * because other parts of the original website may still call
   * it.
   *
   * This replacement returns Firestore photos.
   */

  function getCloudPhotosSync() {
    return [
      ...cloudState.photos
    ];
  }

  // ============================================================
  // PATCH PHOTO RENDERING TO CLOUD STATE
  // ============================================================

  const originalRenderPhotos =
    renderPhotos;

  renderPhotos = function () {

    /*
     * If Firebase has loaded cloud photos, render those.
     * Otherwise allow the original empty-state renderer
     * to work normally.
     */

    if (
      cloudState.listenersStarted ||
      cloudState.photos.length
    ) {

      let photos =
        getCloudPhotosSync();

      const search =
        (
          $("#photoSearch")?.value ||
          ""
        ).toLowerCase();

      if (search) {

        photos =
          photos.filter((photo) => {

            return (
              (
                photo.title ||
                ""
              ) +
              " " +
              (
                photo.desc ||
                ""
              )
            )
              .toLowerCase()
              .includes(search);

          });
      }

      const gallery =
        $("#photoGallery");

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

      gallery.innerHTML =
        photos.map((photo, index) => `

          <article class="photo-card">

            <img
              src="${photo.data || ""}"
              alt="${escapeHTML(
                photo.title || "Wexla Asset"
              )}"
            >

            <div class="photo-info">

              <strong>
                ${escapeHTML(
                  photo.title ||
                  "Untitled Asset"
                )}
              </strong>

              <p>
                ${escapeHTML(
                  photo.desc ||
                  "Community visual asset"
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
              photos[
                Number(
                  button.dataset.photo
                )
              ];

            downloadPhoto(photo);
          };

        });

      return;
    }

    originalRenderPhotos();
  };

  // ============================================================
  // PATCH MISSION DETAILS
  // ============================================================

  function openMissionDetails(id) {

    const mission =
      cloudState.missions.find(
        (item) =>
          item.id === id
      );

    if (!mission) {
      toast("Mission could not be found.");
      return;
    }

    const title =
      $("#missionTitle");

    const description =
      $("#missionDescription");

    const email =
      $("#missionEmail");

    const phone =
      $("#missionPhone");

    const budget =
      $("#missionBudget");

    const image =
      $("#missionImage");

    if (title) {
      title.textContent =
        mission.title ||
        "Incoming Mission";
    }

    if (description) {
      description.textContent =
        mission.desc ||
        "No description supplied.";
    }

    if (email) {
      email.textContent =
        mission.email ||
        "Not supplied";
    }

    if (phone) {
      phone.textContent =
        mission.phone ||
        "Not supplied";
    }

    if (budget) {
      budget.textContent =
        money(
          Number(
            mission.budget
          ) || 0
        );
    }

    if (image) {

      if (mission.imageData) {

        image.src =
          mission.imageData;

        image.classList.remove(
          "hidden"
        );

      } else {

        image.removeAttribute(
          "src"
        );

        image.classList.add(
          "hidden"
        );
      }
    }

    openModal("#missionModal");
  }

  // ============================================================
  // MISSION CLICK HANDLER
  // ============================================================

  document.addEventListener(
    "click",
    (event) => {

      const card =
        event.target.closest(
          "[data-mission-id]"
        );

      if (!card) return;

      const id =
        card.dataset.missionId;

      if (id) {
        openMissionDetails(id);
      }
    }
  );

  // ============================================================
  // CLOUD TASK CARD RENDER PATCH
  // ============================================================

  const originalRenderTasks =
    renderTasks;

  renderTasks = function () {

    if (
      cloudState.listenersStarted ||
      cloudState.missions.length
    ) {

      const search =
        (
          $("#taskSearch")?.value ||
          ""
        ).toLowerCase();

      const maximumBudget =
        Number(
          $("#budgetSlider")?.value ||
          10000
        );

      const filtered =
        cloudState.missions.filter(
          (mission) => {

            const searchable =
              (
                mission.title ||
                ""
              ) +
              " " +
              (
                mission.desc ||
                ""
              ) +
              " INCOMING WEXLA";

            return (
              searchable
                .toLowerCase()
                .includes(search) &&
              Number(
                mission.budget
              ) <= maximumBudget
            );

          }
        );

      const grid =
        $("#taskGrid");

      if (!grid) return;

      if (!filtered.length) {

        grid.innerHTML = `
          <article class="task-card glass">
            <h4>No matching missions</h4>
            <p>
              Try a broader search or increase
              the regional budget.
            </p>
          </article>
        `;

      } else {

        grid.innerHTML =
          filtered.map(
            (mission) => `

              <article
                class="task-card glass"
                data-mission-id="${escapeHTML(
                  mission.id
                )}"
              >

                <span>
                  INCOMING / WEXLA
                </span>

                <strong class="task-budget">
                  ${money(
                    Number(
                      mission.budget
                    ) || 0
                  )}
                </strong>

                <h4>
                  ${escapeHTML(
                    mission.title ||
                    "Untitled Mission"
                  )}
                </h4>

                <p>
                  ${escapeHTML(
                    mission.desc ||
                    "No description supplied."
                  )}
                </p>

                <div>
                  <span class="tag">
                    INCOMING
                  </span>

                  <span class="tag">
                    WEXLA
                  </span>

                  ${
                    mission.imageData
                      ? `
                        <span class="tag">
                          IMAGE
                        </span>
                      `
                      : ""
                  }
                </div>

              </article>

            `
          ).join("");
      }

      const counter =
        $("#taskCount");

      if (counter) {

        counter.textContent =
          `${String(
            filtered.length
          ).padStart(2, "0")} MATCHES`;
      }

      return;
    }

    originalRenderTasks();
  };

  // ============================================================
  // CLOUD DATA REFRESH
  // ============================================================

  async function refreshCloudData() {

    try {

      await startCloudListeners();

      /*
       * The listeners automatically update the UI whenever
       * Firestore changes.
       */

      renderTasks();
      renderPhotos();

    } catch (error) {

      console.error(
        "Cloud refresh failed:",
        error
      );

      toast(
        firebaseErrorMessage(error)
      );
    }
  }

  // ============================================================
  // SERVICE MODAL HELPERS
  // ============================================================

  function setupMissionInteractions() {

    document.addEventListener(
      "click",
      (event) => {

        const missionButton =
          event.target.closest(
            ".task-card"
          );

        if (!missionButton) return;

        const id =
          missionButton.dataset.missionId;

        if (!id) return;

        openMissionDetails(id);
      }
    );
  }

  // ============================================================
  // PHOTO UPLOAD DRAG & DROP
  // ============================================================

  function setupPhotoDropzone() {

    const dropzone =
      document.querySelector(
        ".dropzone"
      );

    const input =
      $("#photoFile");

    if (!dropzone || !input) {
      return;
    }

    [
      "dragenter",
      "dragover"
    ].forEach((eventName) => {

      dropzone.addEventListener(
        eventName,
        (event) => {

          event.preventDefault();
          event.stopPropagation();

          dropzone.classList.add(
            "dragging"
          );

        }
      );

    });

    [
      "dragleave",
      "drop"
    ].forEach((eventName) => {

      dropzone.addEventListener(
        eventName,
        (event) => {

          event.preventDefault();
          event.stopPropagation();

          dropzone.classList.remove(
            "dragging"
          );

        }
      );

    });

    dropzone.addEventListener(
      "drop",
      (event) => {

        const file =
          event.dataTransfer
            ?.files?.[0];

        if (!file) return;

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {

          toast(
            "Please drop an image file."
          );

          return;
        }

        try {

          const dataTransfer =
            new DataTransfer();

          dataTransfer.items.add(file);

          input.files =
            dataTransfer.files;

          const text =
            dropzone.querySelector(
              "strong"
            );

          if (text) {
            text.textContent =
              file.name;
          }

        } catch {

          toast(
            "Could not attach the dropped image."
          );
        }
      }
    );

    dropzone.addEventListener(
      "click",
      () => input.click()
    );
  }

  // ============================================================
  // MOBILE MENU
  // ============================================================

  function setupMobileMenu() {

    const menuButton =
      $("#mobileMenuBtn");

    const menu =
      $("#mobileMenu");

    if (!menuButton || !menu) {
      return;
    }

    menuButton.addEventListener(
      "click",
      () => {

        menu.classList.toggle(
          "open"
        );

      }
    );

    menu.querySelectorAll(
      "[data-nav]"
    ).forEach((button) => {

      button.addEventListener(
        "click",
        () => {
          menu.classList.remove(
            "open"
          );
        }
      );

    });
  }

  // ============================================================
  // PARTICLE BACKGROUND
  // ============================================================

  function startAmbientBackground() {

    const canvas =
      $("#particleCanvas");

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    let width =
      canvas.width =
        window.innerWidth;

    let height =
      canvas.height =
        window.innerHeight;

    const particles = [];

    const count =
      Math.min(
        80,
        Math.max(
          30,
          Math.floor(
            window.innerWidth / 18
          )
        )
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {

      particles.push({
        x:
          Math.random() *
          width,

        y:
          Math.random() *
          height,

        vx:
          (Math.random() - 0.5) *
          0.35,

        vy:
          (Math.random() - 0.5) *
          0.35,

        r:
          Math.random() *
          1.8 +
          0.5
      });

    }

    function resize() {

      width =
        canvas.width =
          window.innerWidth;

      height =
        canvas.height =
          window.innerHeight;
    }

    window.addEventListener(
      "resize",
      resize
    );

    function animate() {

      context.clearRect(
        0,
        0,
        width,
        height
      );

      for (
        const particle of particles
      ) {

        particle.x +=
          particle.vx;

        particle.y +=
          particle.vy;

        if (
          particle.x < -10 ||
          particle.x > width + 10
        ) {
          particle.vx *= -1;
        }

        if (
          particle.y < -10 ||
          particle.y > height + 10
        ) {
          particle.vy *= -1;
        }

        context.beginPath();

        context.arc(
          particle.x,
          particle.y,
          particle.r,
          0,
          Math.PI * 2
        );

        context.fillStyle =
          "rgba(120,220,255,.55)";

        context.fill();
      }

      requestAnimationFrame(
        animate
      );
    }

    animate();
  }
    // ============================================================
  // SERVICE / MISSION SUBMISSION
  // ============================================================

  function setupServiceForms() {

    // ----------------------------------------------------------
    // SERVICE CARDS
    // ----------------------------------------------------------

    $$(".service-card").forEach((card) => {

      card.addEventListener(
        "click",
        () => {

          const service =
            card.dataset.service ||
            card.querySelector("h3")
              ?.textContent ||
            "Service";

          const serviceInput =
            $("#serviceType");

          if (serviceInput) {
            serviceInput.value =
              service;
          }

          openModal("#serviceModal");
        }
      );

    });

    // ----------------------------------------------------------
    // SERVICE MODAL CLOSE
    // ----------------------------------------------------------

    $$("#serviceModal [data-close-modal]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {
            closeModal("#serviceModal");
          }
        );

      });

    // ----------------------------------------------------------
    // SERVICE FORM
    // ----------------------------------------------------------

    $("#serviceForm")?.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        if (!state.user) {
          toast(
            "Please login before submitting a mission."
          );

          return;
        }

        const submitButton =
          $("#serviceSubmitBtn") ||
          $("#serviceForm button[type='submit']");

        const originalText =
          submitButton?.textContent ||
          "";

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent =
            "UPLOADING...";
        }

        try {

          const service =
            (
              $("#serviceType")?.value ||
              "Website"
            ).trim();

          const title =
            (
              $("#serviceTitle")?.value ||
              service
            ).trim();

          const description =
            (
              $("#serviceDescription")?.value ||
              $("#serviceDesc")?.value ||
              ""
            ).trim();

          const budget =
            Number(
              $("#serviceBudget")?.value ||
              $("#budgetInput")?.value ||
              0
            );

          const phone =
            (
              $("#servicePhone")?.value ||
              state.user.phone ||
              ""
            ).trim();

          const email =
            (
              $("#serviceEmail")?.value ||
              state.user.email ||
              ""
            ).trim();

          const ideaFile =
            $("#serviceImage")?.files?.[0] ||
            $("#ideaImage")?.files?.[0] ||
            null;

          if (!title) {
            toast(
              "Please enter a mission title."
            );

            return;
          }

          if (!description) {
            toast(
              "Please describe what you need."
            );

            return;
          }

          if (
            !Number.isFinite(budget) ||
            budget < 0
          ) {
            toast(
              "Please enter a valid budget."
            );

            return;
          }

          // ------------------------------------------------------
          // OPTIONAL IMAGE → COMPRESSED BASE64
          // ------------------------------------------------------

          let imageData = "";

          if (ideaFile) {

            if (
              !ideaFile.type.startsWith(
                "image/"
              )
            ) {
              toast(
                "Mission image must be an image file."
              );

              return;
            }

            imageData =
              await imageToDataURL(
                ideaFile,
                700,
                0.68
              );

            assertFirestoreImageSize(
              imageData
            );
          }

          // ------------------------------------------------------
          // CREATE CLOUD MISSION
          // ------------------------------------------------------

          const mission = {
            id: crypto.randomUUID(),

            title,

            desc:
              description,

            budget,

            phone,

            email,

            owner:
              state.user.username,

            ownerId:
              state.user.id,

            created:
              Date.now(),

            imageData
          };

          await putMission(
            mission
          );

          // ------------------------------------------------------
          // LOCAL CLOUD STATE UPDATE
          // ------------------------------------------------------

          const existingIndex =
            cloudState.missions.findIndex(
              (item) =>
                item.id === mission.id
            );

          if (existingIndex === -1) {

            cloudState.missions.unshift(
              mission
            );

          } else {

            cloudState.missions[
              existingIndex
            ] = mission;
          }

          renderTasks();

          // ------------------------------------------------------
          // CLOSE / RESET
          // ------------------------------------------------------

          $("#serviceForm")?.reset();

          closeModal(
            "#serviceModal"
          );

          toast(
            "Mission published globally."
          );

        } catch (error) {

          console.error(
            "Mission submission error:",
            error
          );

          showCloudImageError(
            error,
            "Mission could not be published."
          );

        } finally {

          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
              originalText ||
              "SUBMIT MISSION";
          }

        }
      }
    );
  }

  // ============================================================
  // PHOTO SUBMISSION
  // ============================================================

  function setupPhotoUpload() {

    const form =
      $("#photoForm");

    if (!form) return;

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        if (!state.user) {
          toast(
            "Please login before uploading."
          );

          return;
        }

        const submitButton =
          form.querySelector(
            "button[type='submit']"
          );

        const originalText =
          submitButton?.textContent ||
          "";

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent =
            "COMPRESSING...";
        }

        try {

          const title =
            (
              $("#photoTitle")?.value ||
              "Wexla Asset"
            ).trim();

          const desc =
            (
              $("#photoDescription")?.value ||
              $("#photoDesc")?.value ||
              ""
            ).trim();

          const file =
            $("#photoFile")?.files?.[0];

          if (!file) {

            toast(
              "Please select an image."
            );

            return;
          }

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {

            toast(
              "Only image files are supported."
            );

            return;
          }

          // ------------------------------------------------------
          // IMAGE → COMPRESSED BASE64
          // ------------------------------------------------------

          if (submitButton) {
            submitButton.textContent =
              "UPLOADING...";
          }

          const data =
            await imageToDataURL(
              file,
              900,
              0.68
            );

          assertFirestoreImageSize(
            data
          );

          // ------------------------------------------------------
          // CREATE CLOUD PHOTO
          // ------------------------------------------------------

          const photo = {
            id:
              crypto.randomUUID(),

            title,

            desc,

            data,

            owner:
              state.user.username,

            created:
              Date.now()
          };

          await putPhoto(
            photo
          );

          // ------------------------------------------------------
          // UPDATE CURRENT CLOUD STATE
          // ------------------------------------------------------

          const existingIndex =
            cloudState.photos.findIndex(
              (item) =>
                item.id === photo.id
            );

          if (existingIndex === -1) {

            cloudState.photos.unshift(
              photo
            );

          } else {

            cloudState.photos[
              existingIndex
            ] = photo;
          }

          renderPhotos();

          form.reset();

          const dropzone =
            document.querySelector(
              ".dropzone"
            );

          const filename =
            dropzone?.querySelector(
              "strong"
            );

          if (filename) {
            filename.textContent =
              "DROP IMAGE OR CLICK TO UPLOAD";
          }

          closeModal(
            "#photoModal"
          );

          toast(
            "Image uploaded globally."
          );

        } catch (error) {

          console.error(
            "Photo upload error:",
            error
          );

          showCloudImageError(
            error,
            "Image upload failed."
          );

        } finally {

          if (submitButton) {
            submitButton.disabled = false;

            submitButton.textContent =
              originalText ||
              "UPLOAD IMAGE";
          }

        }
      }
    );
  }

  // ============================================================
  // GENERIC PHOTO MODAL
  // ============================================================

  function setupPhotoModal() {

    const openButtons =
      $$("[data-open-photo-modal]");

    openButtons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {
            openModal(
              "#photoModal"
            );
          }
        );

      }
    );

    $$("#photoModal [data-close-modal]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {
            closeModal(
              "#photoModal"
            );
          }
        );

      });
  }

  // ============================================================
  // SEARCH
  // ============================================================

  function setupSearch() {

    $("#taskSearch")?.addEventListener(
      "input",
      () => {
        renderTasks();
      }
    );

    $("#photoSearch")?.addEventListener(
      "input",
      () => {
        renderPhotos();
      }
    );

    $("#budgetSlider")?.addEventListener(
      "input",
      () => {
        updateBudget();
        renderTasks();
      }
    );

    // ----------------------------------------------------------
    // GLOBAL SERVICE SEARCH
    // ----------------------------------------------------------

    $("#globalSearch")?.addEventListener(
      "input",
      (event) => {

        const value =
          event.target.value
            .trim()
            .toLowerCase();

        $$(".service-card, .tool-card, .game-card")
          .forEach((card) => {

            const text =
              card.textContent
                .toLowerCase();

            card.style.display =
              !value ||
              text.includes(value)
                ? ""
                : "none";

          });
      }
    );
  }

  // ============================================================
  // MODAL OUTSIDE CLICK
  // ============================================================

  function setupModalDismiss() {

    document.addEventListener(
      "click",
      (event) => {

        const modal =
          event.target.closest(
            ".modal"
          );

        if (!modal) return;

        if (
          event.target === modal ||
          event.target.matches(
            ".modal-backdrop"
          )
        ) {

          modal.classList.remove(
            "open"
          );

        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key !== "Escape"
        ) {
          return;
        }

        $$(".modal.open")
          .forEach((modal) => {
            modal.classList.remove(
              "open"
            );
          });

        $("#profilePanel")
          ?.classList.remove(
            "open"
          );

        $("#panelBackdrop")
          ?.classList.remove(
            "open"
          );
      }
    );
  }

  // ============================================================
  // PROFILE EDIT
  // ============================================================

  function setupProfileEditing() {

    $("#profileForm")?.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        if (!state.user) return;

        const username =
          (
            $("#profileUsername")?.value ||
            state.user.username
          ).trim();

        const country =
          (
            $("#profileCountry")?.value ||
            state.user.country
          ).trim();

        const phone =
          (
            $("#profilePhone")?.value ||
            state.user.phone ||
            ""
          ).trim();

        const entity =
          (
            $("#profileEntity")?.value ||
            state.user.entity
          ).trim();

        if (!username) {
          toast(
            "Username cannot be empty."
          );

          return;
        }

        const users =
          getUsers();

        const duplicate =
          users.some(
            (user) =>
              user.id !== state.user.id &&
              user.username
                .toLowerCase() ===
                username.toLowerCase()
          );

        if (duplicate) {

          toast(
            "That username is already taken."
          );

          return;
        }

        state.user.username =
          username;

        state.user.country =
          country;

        state.user.phone =
          phone;

        state.user.entity =
          entity;

        const index =
          users.findIndex(
            (user) =>
              user.id === state.user.id
          );

        if (index !== -1) {
          users[index] =
            state.user;

          saveUsers(users);
        }

        renderProfile();

        toast(
          "Profile updated."
        );
      }
    );
  }

  // ============================================================
  // HOME / SECTION BUTTONS
  // ============================================================

  function setupSectionButtons() {

    $$("[data-scroll-to]").forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const target =
              document.querySelector(
                button.dataset.scrollTo
              );

            target?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }
        );

      }
    );

    // Generic "open modal" buttons
    $$("[data-open-modal]").forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const target =
              button.dataset.openModal;

            if (!target) return;

            openModal(target);
          }
        );

      }
    );

    // Generic "close modal" buttons
    $$("[data-close-modal]").forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const modal =
              button.closest(
                ".modal"
              );

            if (modal) {
              modal.classList.remove(
                "open"
              );
            }

          }
        );

      }
    );
  }

  // ============================================================
  // FILE PREVIEW
  // ============================================================

  function setupImagePreview() {

    const selectors = [
      "#photoFile",
      "#serviceImage",
      "#ideaImage"
    ];

    selectors.forEach(
      (selector) => {

        const input =
          $(selector);

        if (!input) return;

        input.addEventListener(
          "change",
          () => {

            const file =
              input.files?.[0];

            if (!file) return;

            if (
              !file.type.startsWith(
                "image/"
              )
            ) {
              return;
            }

            const reader =
              new FileReader();

            reader.onload = () => {

              const previewId =
                input.dataset.preview;

              if (!previewId) {
                return;
              }

              const preview =
                document.querySelector(
                  previewId
                );

              if (!preview) {
                return;
              }

              preview.src =
                reader.result;

              preview.classList.remove(
                "hidden"
              );
            };

            reader.readAsDataURL(
              file
            );
          }
        );

      }
    );
  }

  // ============================================================
  // COPY BUTTONS
  // ============================================================

  function setupCopyButtons() {

    $$("[data-copy]").forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const selector =
              button.dataset.copy;

            const element =
              selector
                ? document.querySelector(
                    selector
                  )
                : null;

            if (!element) return;

            const text =
              element.value ??
              element.textContent ??
              "";

            try {

              await navigator.clipboard.writeText(
                text
              );

              toast(
                "Copied to clipboard."
              );

            } catch {

              toast(
                "Copy failed."
              );
            }
          }
        );

      }
    );
  }

  // ============================================================
  // TAB SYSTEM
  // ============================================================

  function setupTabs() {

    $$("[data-tab-target]").forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const target =
              button.dataset.tabTarget;

            if (!target) return;

            const parent =
              button.closest(
                ".tabs, .tab-container"
              );

            parent
              ?.querySelectorAll(
                "[data-tab-target]"
              )
              .forEach((item) => {
                item.classList.remove(
                  "active"
                );
              });

            button.classList.add(
              "active"
            );

            const container =
              button.closest(
                "section, .panel, .tab-container"
              ) ||
              document;

            container
              .querySelectorAll(
                "[data-tab]"
              )
              .forEach((panel) => {

                panel.classList.toggle(
                  "active",
                  panel.dataset.tab ===
                    target
                );

              });
          }
        );

      }
    );
  }

  // ============================================================
  // NOTIFICATION DOT
  // ============================================================

  function updateMissionNotification() {

    const badge =
      $("#missionBadge");

    if (!badge) return;

    const count =
      cloudState.missions.length;

    badge.textContent =
      count > 99
        ? "99+"
        : String(count);

    badge.classList.toggle(
      "hidden",
      count === 0
    );
  }

  // ============================================================
  // FIREBASE LISTENER WRAPPER
  // ============================================================

  const originalStartCloudListeners =
    startCloudListeners;

  startCloudListeners =
    async function () {

      await originalStartCloudListeners();

      updateMissionNotification();

      /*
       * Firebase onSnapshot callbacks will call the
       * render functions whenever another user uploads
       * a mission or image.
       */
    };

  // ============================================================
  // KEEP NOTIFICATION UPDATED
  // ============================================================

  const originalRenderCloudTasks =
    renderTasks;

  renderTasks =
    function () {

      originalRenderCloudTasks();

      updateMissionNotification();
    };

  // ============================================================
  // SERVICE CARD FALLBACK HANDLER
  // ============================================================

  function setupServiceCardFallback() {

    document.addEventListener(
      "click",
      (event) => {

        const card =
          event.target.closest(
            "[data-service]"
          );

        if (!card) return;

        const service =
          card.dataset.service;

        if (!service) return;

        const input =
          $("#serviceType");

        if (input) {
          input.value =
            service;
        }
      }
    );
  }

  // ============================================================
  // ONLINE / OFFLINE STATUS
  // ============================================================

  function setupNetworkStatus() {

    const update = () => {

      const indicator =
        $("#networkStatus");

      if (!indicator) return;

      if (navigator.onLine) {

        indicator.textContent =
          "ONLINE";

        indicator.classList.remove(
          "offline"
        );

      } else {

        indicator.textContent =
          "OFFLINE";

        indicator.classList.add(
          "offline"
        );
      }
    };

    window.addEventListener(
      "online",
      () => {

        update();

        toast(
          "Connection restored."
        );

        refreshCloudData();
      }
    );

    window.addEventListener(
      "offline",
      () => {

        update();

        toast(
          "You are currently offline."
        );
      }
    );

    update();
  }

  // ============================================================
  // GAME ENGINE BASE
  // ============================================================

  function launchGame(gameName) {

    const game =
      games.find(
        (item) =>
          item[0] === gameName
      );

    if (!game) return;

    const overlay =
      $("#gameOverlay");

    const canvas =
      $("#gameCanvas");

    if (!overlay || !canvas) {
      toast(
        `${game[1]} selected.`
      );

      return;
    }

    overlay.classList.add(
      "open"
    );

    const title =
      $("#gameTitle");

    if (title) {
      title.textContent =
        game[1];
    }

    if (
      typeof state.gameCleanup ===
      "function"
    ) {
      state.gameCleanup();
      state.gameCleanup = null;
    }

    state.game =
      gameName;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    canvas.width =
      Math.min(
        900,
        Math.max(
          320,
          window.innerWidth - 40
        )
      );

    canvas.height =
      Math.min(
        600,
        Math.max(
          420,
          window.innerHeight - 180
        )
      );

    startSelectedGame(
      gameName,
      canvas,
      context
    );
  }

  // ============================================================
  // CLOSE GAME
  // ============================================================

  function closeGame() {

    if (
      typeof state.gameCleanup ===
      "function"
    ) {
      state.gameCleanup();
      state.gameCleanup = null;
    }

    state.game = null;

    $("#gameOverlay")
      ?.classList.remove(
        "open"
      );
  }

  // ============================================================
  // GAME CLOSE BUTTON
  // ============================================================

  function setupGameControls() {

    $("#gameClose")?.addEventListener(
      "click",
      closeGame
    );

    $("#gameOverlay")?.addEventListener(
      "click",
      (event) => {

        if (
          event.target.id ===
          "gameOverlay"
        ) {
          closeGame();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Escape" &&
          $("#gameOverlay")
            ?.classList.contains("open")
        ) {
          closeGame();
        }
      }
    );
  }

  // ============================================================
  // GAME SELECTOR
  // ============================================================

  function startSelectedGame(
    gameName,
    canvas,
    context
  ) {

    switch (gameName) {

      case "snake":
        startSnakeGame(
          canvas,
          context
        );
        break;

      case "flappy":
        startFlappyGame(
          canvas,
          context
        );
        break;

      case "racing":
        startRacingGame(
          canvas,
          context
        );
        break;

      case "fruit":
        startFruitGame(
          canvas,
          context
        );
        break;

      case "runner":
        startRunnerGame(
          canvas,
          context
        );
        break;

      case "ttt":
        startTicTacToeGame(
          canvas,
          context
        );
        break;

      case "tetris":
        startTetrisGame(
          canvas,
          context
        );
        break;

      case "invaders":
        startInvadersGame(
          canvas,
          context
        );
        break;

      case "breakout":
        startBreakoutGame(
          canvas,
          context
        );
        break;

      case "pacman":
        startPacmanGame(
          canvas,
          context
        );
        break;

      default:
        toast(
          "Game engine unavailable."
        );
    }
  }

  // ============================================================
  // GAME UTILITY
  // ============================================================

  function gameLoop(
    callback
  ) {

    let running = true;
    let animationId = null;

    function frame(time) {

      if (!running) return;

      callback(time);

      animationId =
        requestAnimationFrame(
          frame
        );
    }

    animationId =
      requestAnimationFrame(
        frame
      );

    return () => {

      running = false;

      if (
        animationId !== null
      ) {
        cancelAnimationFrame(
          animationId
        );
      }
    };
  }

  function randomInt(
    minimum,
    maximum
  ) {
    return Math.floor(
      Math.random() *
      (maximum - minimum + 1)
    ) + minimum;
  }

  function clamp(
    value,
    minimum,
    maximum
  ) {
    return Math.max(
      minimum,
      Math.min(
        maximum,
        value
      )
    );
  }

  // ============================================================
  // SNAKE GAME
  // ============================================================

  function startSnakeGame(
    canvas,
    context
  ) {

    const gridSize = 24;

    const columns =
      Math.floor(
        canvas.width /
        gridSize
      );

    const rows =
      Math.floor(
        canvas.height /
        gridSize
      );

    let snake = [
      {
        x: Math.floor(columns / 2),
        y: Math.floor(rows / 2)
      },
      {
        x: Math.floor(columns / 2) - 1,
        y: Math.floor(rows / 2)
      },
      {
        x: Math.floor(columns / 2) - 2,
        y: Math.floor(rows / 2)
      }
    ];

    let direction = {
      x: 1,
      y: 0
    };

    let nextDirection = {
      x: 1,
      y: 0
    };

    let food = {
      x: randomInt(
        1,
        columns - 2
      ),
      y: randomInt(
        1,
        rows - 2
      )
    };

    let score = 0;
    let accumulator = 0;
    let lastTime = 0;

    function placeFood() {

      let valid = false;

      while (!valid) {

        food = {
          x: randomInt(
            1,
            columns - 2
          ),
          y: randomInt(
            1,
            rows - 2
          )
        };

        valid =
          !snake.some(
            (segment) =>
              segment.x === food.x &&
              segment.y === food.y
          );
      }
    }

    function keyHandler(event) {

      const key =
        event.key.toLowerCase();

      if (
        (
          key === "arrowup" ||
          key === "w"
        ) &&
        direction.y !== 1
      ) {

        nextDirection = {
          x: 0,
          y: -1
        };

      } else if (
        (
          key === "arrowdown" ||
          key === "s"
        ) &&
        direction.y !== -1
      ) {

        nextDirection = {
          x: 0,
          y: 1
        };

      } else if (
        (
          key === "arrowleft" ||
          key === "a"
        ) &&
        direction.x !== 1
      ) {

        nextDirection = {
          x: -1,
          y: 0
        };

      } else if (
        (
          key === "arrowright" ||
          key === "d"
        ) &&
        direction.x !== -1
      ) {

        nextDirection = {
          x: 1,
          y: 0
        };
      }
    }

    window.addEventListener(
      "keydown",
      keyHandler
    );

    function reset() {

      snake = [
        {
          x: Math.floor(columns / 2),
          y: Math.floor(rows / 2)
        },
        {
          x: Math.floor(columns / 2) - 1,
          y: Math.floor(rows / 2)
        }
      ];

      direction = {
        x: 1,
        y: 0
      };

      nextDirection = {
        x: 1,
        y: 0
      };

      score = 0;

      placeFood();
    }

    function update() {

      direction = nextDirection;

      const head = {
        x:
          snake[0].x +
          direction.x,

        y:
          snake[0].y +
          direction.y
      };

      if (
        head.x < 0 ||
        head.x >= columns ||
        head.y < 0 ||
        head.y >= rows
      ) {

        reset();

        return;
      }

      if (
        snake.some(
          (segment) =>
            segment.x === head.x &&
            segment.y === head.y
        )
      ) {

        reset();

        return;
      }

      snake.unshift(
        head
      );

      if (
        head.x === food.x &&
        head.y === food.y
      ) {

        score++;

        placeFood();

      } else {

        snake.pop();
      }
    }

    function draw() {

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.fillStyle =
        "rgba(5,10,18,.95)";

      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Grid
      context.strokeStyle =
        "rgba(255,255,255,.04)";

      context.lineWidth = 1;

      for (
        let x = 0;
        x <= columns;
        x++
      ) {

        context.beginPath();

        context.moveTo(
          x * gridSize,
          0
        );

        context.lineTo(
          x * gridSize,
          canvas.height
        );

        context.stroke();
      }

      for (
        let y = 0;
        y <= rows;
        y++
      ) {

        context.beginPath();

        context.moveTo(
          0,
          y * gridSize
        );

        context.lineTo(
          canvas.width,
          y * gridSize
        );

        context.stroke();
      }

      // Food
      context.beginPath();

      context.arc(
        food.x * gridSize +
          gridSize / 2,
        food.y * gridSize +
          gridSize / 2,
        gridSize * 0.35,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        "#ff4d9d";

      context.fill();

      // Snake
      snake.forEach(
        (segment, index) => {

          context.fillStyle =
            index === 0
              ? "#65f5ff"
              : "#42b8d1";

          context.fillRect(
            segment.x *
              gridSize +
              2,

            segment.y *
              gridSize +
              2,

            gridSize - 4,
            gridSize - 4
          );

        }
      );

      context.fillStyle =
        "#ffffff";

      context.font =
        "bold 18px system-ui";

      context.fillText(
        `SCORE: ${score}`,
        16,
        28
      );
    }

    function animate(time) {

      if (!lastTime) {
        lastTime = time;
      }

      const delta =
        time - lastTime;

      lastTime = time;

      accumulator += delta;

      if (accumulator >= 110) {

        update();

        accumulator = 0;
      }

      draw();

      animationFrame =
        requestAnimationFrame(
          animate
        );
    }

    let animationFrame =
      requestAnimationFrame(
        animate
      );

    state.gameCleanup =
      () => {

        cancelAnimationFrame(
          animationFrame
        );

        window.removeEventListener(
          "keydown",
          keyHandler
        );
      };
  }
      }

    // ========================================================
    // FRUIT NINJA
    // ========================================================

    if (id === "fruit") {

      let fruits = [];
      let points = 0;
      let frame = 0;
      let slicing = false;

      function spawnFruit() {

        fruits.push({
          x:
            60 +
            Math.random() *
            (width() - 120),

          y:
            height() + 40,

          vx:
            (Math.random() - .5) * 4,

          vy:
            -(
              8 +
              Math.random() * 4
            ),

          r:
            20 +
            Math.random() * 12,

          type:
            Math.floor(
              Math.random() * 4
            )
        });
      }

      function pointerDown() {
        slicing = true;
      }

      function pointerUp() {
        slicing = false;
      }

      canvas.addEventListener(
        "pointerdown",
        pointerDown
      );

      canvas.addEventListener(
        "pointerup",
        pointerUp
      );

      canvas.addEventListener(
        "pointerleave",
        pointerUp
      );

      state.gameCleanup = () => {

        cleanup();

        canvas.removeEventListener(
          "pointerdown",
          pointerDown
        );

        canvas.removeEventListener(
          "pointerup",
          pointerUp
        );

        canvas.removeEventListener(
          "pointerleave",
          pointerUp
        );
      };

      function draw() {

        background();

        frame++;

        if (
          frame % 35 === 0
        ) {
          spawnFruit();
        }

        fruits.forEach(
          (fruit) => {

            fruit.x += fruit.vx;

            fruit.vy += .25;

            fruit.y += fruit.vy;
          }
        );

        fruits =
          fruits.filter(
            (fruit) =>
              fruit.y <
              height() + 80
          );

        fruits.forEach(
          (fruit,index) => {

            if (
              slicing &&
              pointer.x !== undefined &&
              pointer.y !== undefined
            ) {

              const distance =
                Math.hypot(
                  pointer.x -
                    fruit.x,
                  pointer.y -
                    fruit.y
                );

              if (
                distance <
                fruit.r + 28
              ) {

                points += 10;

                gameScore(
                  points
                );

                fruits.splice(
                  index,
                  1
                );

                return;
              }
            }

            const fruitColors = [
              "#ff3fb4",
              "#00f6ff",
              "#ffe45e",
              "#6dff88"
            ];

            ctx.fillStyle =
              fruitColors[
                fruit.type
              ];

            ctx.shadowBlur = 18;

            ctx.shadowColor =
              fruitColors[
                fruit.type
              ];

            ctx.beginPath();

            ctx.arc(
              fruit.x,
              fruit.y,
              fruit.r,
              0,
              Math.PI * 2
            );

            ctx.fill();

            ctx.shadowBlur = 0;

            ctx.fillStyle =
              "#ffffff";

            ctx.font =
              "bold 12px Segoe UI";

            ctx.textAlign =
              "center";

            ctx.fillText(
              "●",
              fruit.x,
              fruit.y + 4
            );

            ctx.textAlign =
              "left";
          }
        );

        animationFrame =
          requestAnimationFrame(
            draw
          );
      }

      animationFrame =
        requestAnimationFrame(
          draw
        );

      return;
    }

    // ========================================================
    // ENDLESS RUNNER
    // ========================================================

    if (id === "runner") {

      let playerY =
        height() - 100;

      let velocity = 0;

      let jumping = false;

      let obstacles = [];

      let frame = 0;

      let points = 0;

      const ground =
        height() - 70;

      function jump() {

        if (!jumping) {

          velocity = -11;

          jumping = true;
        }
      }

      function keyHandler(event) {

        const key =
          event.key.toLowerCase();

        if (
          key === " " ||
          key === "arrowup" ||
          key === "w"
        ) {
          jump();
        }
      }

      function pointerHandler() {
        jump();
      }

      window.addEventListener(
        "keydown",
        keyHandler
      );

      canvas.addEventListener(
        "pointerdown",
        pointerHandler
      );

      state.gameCleanup = () => {

        cleanup();

        window.removeEventListener(
          "keydown",
          keyHandler
        );

        canvas.removeEventListener(
          "pointerdown",
          pointerHandler
        );
      };

      function draw() {

        background();

        velocity += .55;

        playerY += velocity;

        if (
          playerY >= ground
        ) {

          playerY = ground;

          velocity = 0;

          jumping = false;
        }

        frame++;

        if (
          frame % 70 === 0
        ) {

          obstacles.push({
            x:
              width() + 30,

            w:
              25 +
              Math.random() * 25,

            h:
              35 +
              Math.random() * 50
          });
        }

        obstacles.forEach(
          (obstacle) => {
            obstacle.x -= 6;
          }
        );

        obstacles =
          obstacles.filter(
            (obstacle) =>
              obstacle.x >
              -100
          );

        // Ground
        ctx.strokeStyle =
          "#00f6ff";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
          0,
          ground + 35
        );

        ctx.lineTo(
          width(),
          ground + 35
        );

        ctx.stroke();

        // Player
        ctx.fillStyle =
          "#00f6ff";

        ctx.shadowBlur = 20;

        ctx.shadowColor =
          "#00f6ff";

        ctx.fillRect(
          80,
          playerY - 55,
          35,
          55
        );

        ctx.shadowBlur = 0;

        // Obstacles
        obstacles.forEach(
          (obstacle) => {

            ctx.fillStyle =
              "#ff3fb4";

            ctx.fillRect(
              obstacle.x,
              ground +
                35 -
                obstacle.h,

              obstacle.w,
              obstacle.h
            );

            if (
              80 + 35 >
                obstacle.x &&
              80 <
                obstacle.x +
                obstacle.w &&
              playerY >
                ground +
                35 -
                obstacle.h &&
              playerY - 55 <
                ground + 35
            ) {

              points = 0;

              obstacles = [];

              playerY =
                ground;

              velocity = 0;
            }
          }
        );

        points++;

        gameScore(
          Math.floor(
            points / 10
          )
        );

        animationFrame =
          requestAnimationFrame(
            draw
          );
      }

      animationFrame =
        requestAnimationFrame(
          draw
        );

      return;
    }

    // ========================================================
    // TETRIS
    // ========================================================

    if (id === "tetris") {

      const cols = 10;
      const rows = 20;

      const board =
        Array.from(
          {length: rows},
          () =>
            Array(cols).fill(0)
        );

      const pieces = [
        [[1,1,1,1]],
        [
          [1,1],
          [1,1]
        ],
        [
          [0,1,0],
          [1,1,1]
        ],
        [
          [1,0,0],
          [1,1,1]
        ],
        [
          [0,0,1],
          [1,1,1]
        ]
      ];

      let piece =
        null;

      let pieceX = 3;
      let pieceY = 0;

      let points = 0;

      let fallTimer = 0;

      function newPiece() {

        piece =
          pieces[
            Math.floor(
              Math.random() *
              pieces.length
            )
          ];

        pieceX = 3;

        pieceY = 0;
      }

      function collision(
        px,
        py,
        shape
      ) {

        for (
          let y = 0;
          y < shape.length;
          y++
        ) {

          for (
            let x = 0;
            x < shape[y].length;
            x++
          ) {

            if (!shape[y][x])
              continue;

            const bx =
              px + x;

            const by =
              py + y;

            if (
              bx < 0 ||
              bx >= cols ||
              by >= rows
            ) {
              return true;
            }

            if (
              by >= 0 &&
              board[by][bx]
            ) {
              return true;
            }
          }
        }

        return false;
      }

      function merge() {

        piece.forEach(
          (row,y) => {

            row.forEach(
              (value,x) => {

                if (value) {

                  const by =
                    pieceY + y;

                  const bx =
                    pieceX + x;

                  if (
                    by >= 0 &&
                    by < rows &&
                    bx >= 0 &&
                    bx < cols
                  ) {
                    board[by][bx] =
                      1;
                  }
                }
              }
            );
          }
        );
      }

      function clearLines() {

        let cleared = 0;

        for (
          let y = rows - 1;
          y >= 0;
          y--
        ) {

          if (
            board[y].every(Boolean)
          ) {

            board.splice(
              y,
              1
            );

            board.unshift(
              Array(cols).fill(0)
            );

            cleared++;

            y++;
          }
        }

        if (cleared) {

          points +=
            cleared *
            cleared *
            100;

          gameScore(
            points
          );
        }
      }

      function rotate() {

        const rotated =
          piece[0].map(
            (_,index) =>
              piece.map(
                row =>
                  row[index]
              ).reverse()
          );

        if (
          !collision(
            pieceX,
            pieceY,
            rotated
          )
        ) {
          piece = rotated;
        }
      }

      function move(dx) {

        if (
          !collision(
            pieceX + dx,
            pieceY,
            piece
          )
        ) {
          pieceX += dx;
        }
      }

      function drop() {

        if (
          !collision(
            pieceX,
            pieceY + 1,
            piece
          )
        ) {

          pieceY++;

        } else {

          merge();

          clearLines();

          newPiece();

          if (
            collision(
              pieceX,
              pieceY,
              piece
            )
          ) {

            board.forEach(
              (row) =>
                row.fill(0)
            );

            points = 0;

            gameScore(0);
          }
        }
      }

      function keyHandler(event) {

        const key =
          event.key.toLowerCase();

        if (
          key === "arrowleft" ||
          key === "a"
        ) {
          move(-1);
        }

        if (
          key === "arrowright" ||
          key === "d"
        ) {
          move(1);
        }

        if (
          key === "arrowdown" ||
          key === "s"
        ) {
          drop();
        }

        if (
          key === "arrowup" ||
          key === "w"
        ) {
          rotate();
        }
      }

      window.addEventListener(
        "keydown",
        keyHandler
      );

      newPiece();

      state.gameCleanup = () => {

        cleanup();

        window.removeEventListener(
          "keydown",
          keyHandler
        );
      };

      function draw(time) {

        if (
          time - fallTimer >
          500
        ) {

          drop();

          fallTimer = time;
        }

        background();

        const cell =
          Math.min(
            width() / cols,
            height() / rows
          );

        const ox =
          (
            width() -
            cell * cols
          ) / 2;

        const oy =
          (
            height() -
            cell * rows
          ) / 2;

        for (
          let y = 0;
          y < rows;
          y++
        ) {

          for (
            let x = 0;
            x < cols;
            x++
          ) {

            if (
              board[y][x]
            ) {

              ctx.fillStyle =
                "#00f6ff";

              ctx.fillRect(
                ox +
                  x * cell +
                  2,

                oy +
                  y * cell +
                  2,

                cell - 4,
                cell - 4
              );
            }
          }
        }

        if (piece) {

          piece.forEach(
            (row,y) => {

              row.forEach(
                (value,x) => {

                  if (!value)
                    return;

                  ctx.fillStyle =
                    "#ff3fb4";

                  ctx.fillRect(
                    ox +
                      (
                        pieceX +
                        x
                      ) * cell +
                      2,

                    oy +
                      (
                        pieceY +
                        y
                      ) * cell +
                      2,

                    cell - 4,
                    cell - 4
                  );
                }
              );
            }
          );
        }

        animationFrame =
          requestAnimationFrame(
            draw
          );
      }

      animationFrame =
        requestAnimationFrame(
          draw
        );

      return;
    }

    // ========================================================
    // SPACE INVADERS
    // ========================================================

    if (id === "invaders") {

      let playerX =
        width() / 2;

      let bullets = [];

      let enemies = [];

      let points = 0;

      let frame = 0;

      for (
        let row = 0;
        row < 4;
        row++
      ) {

        for (
          let col = 0;
          col < 8;
          col++
        ) {

          enemies.push({
            x:
              80 +
              col * 70,

            y:
              70 +
              row * 50,

            alive: true
          });
        }
      }

      function keyHandler(event) {

        const key =
          event.key.toLowerCase();

        if (
          key === "arrowleft" ||
          key === "a"
        ) {
          playerX -= 18;
        }

        if (
          key === "arrowright" ||
          key === "d"
        ) {
          playerX += 18;
        }

        if (
          key === " " ||
          key === "spacebar"
        ) {

          bullets.push({
            x: playerX,
            y: height() - 90
          });
        }

        playerX =
          clamp(
            playerX,
            30,
            width() - 30
          );
      }

      window.addEventListener(
        "keydown",
        keyHandler
      );

      state.gameCleanup = () => {

        cleanup();

        window.removeEventListener(
          "keydown",
          keyHandler
        );
      };

      function draw() {

        background();

        frame++;

        if (
          frame % 70 === 0
        ) {

          enemies.forEach(
            (enemy) => {

              if (enemy.alive) {
                enemy.y += 12;
              }

            }
          );
        }

        bullets.forEach(
          (bullet) => {
            bullet.y -= 9;
          }
        );

        bullets =
          bullets.filter(
            (bullet) =>
              bullet.y > -20
          );

        bullets.forEach(
          (bullet,index) => {

            for (
              const enemy of enemies
            ) {

              if (!enemy.alive)
                continue;

              if (
                Math.abs(
                  bullet.x -
                  enemy.x
                ) < 25 &&
                Math.abs(
                  bullet.y -
                  enemy.y
                ) < 20
              ) {

                enemy.alive = false;

                points += 10;

                gameScore(
                  points
                );

                bullets.splice(
                  index,
                  1
                );

                break;
              }
            }
          }
        );

        enemies.forEach(
          (enemy) => {

            if (!enemy.alive)
              return;

            ctx.fillStyle =
              "#ff3fb4";

            ctx.shadowBlur = 14;

            ctx.shadowColor =
              "#ff3fb4";

            ctx.fillRect(
              enemy.x - 18,
              enemy.y - 12,
              36,
              24
            );

            ctx.shadowBlur = 0;
          }
        );

        bullets.forEach(
          (bullet) => {

            ctx.fillStyle =
              "#ffe45e";

            ctx.fillRect(
              bullet.x - 3,
              bullet.y - 10,
              6,
              20
            );
          }
        );

        ctx.fillStyle =
          "#00f6ff";

        ctx.fillRect(
          playerX - 25,
          height() - 55,
          50,
          20
        );

        animationFrame =
          requestAnimationFrame(
            draw
          );
      }

      animationFrame =
        requestAnimationFrame(
          draw
        );

      return;
    }
