// Inicialización principal de la App y lógica
const games = [
  {
    id: "rocket",
    title: "Rocket Crash",
    category: "Originals",
    bg: "url('assets/images/games/rocket.jpg')",
    url: "pages/rocket.html",
  },
  {
    id: "aviator",
    title: "Aviator Islands",
    category: "Originals",
    bg: "url('assets/images/games/aviator.jpg')",
    url: "pages/aviator.html",
  },
  {
    id: "slots",
    title: "Neon Slots",
    category: "Casino",
    bg: "url('assets/images/games/slots.jpg')",
    url: "pages/slots.html",
  },
  {
    id: "poker",
    title: "Cyber Poker",
    category: "Cards",
    bg: "url('assets/images/games/poker.jpg')",
    url: "pages/poker.html",
  },
  {
    id: "mines",
    title: "Neon Mines",
    category: "VIP Only",
    bg: "url('assets/images/games/mines.jpg')",
    url: "pages/mines.html",
    vip: true,
  },
];

document.addEventListener("DOMContentLoaded", init);

function init() {
  // Si UI existe, inicializar eventos y vista
  if (typeof UI !== "undefined") {
    UI.init();
  }

  if (typeof Notifications !== "undefined") {
    Notifications.init();
  }

  initCarousel();
  renderGames();
  checkAgeGate();

  // Inicializar lógica de intercepción (Guest Mode) y perfiles
  initGatingLogic();
  initLoginLogic();
  initUserProfile();
  initMobileMenu();
}

function initMobileMenu() {
  const btn = document.getElementById("mobileMenuBtn");
  const nav = document.getElementById("mobileNav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      nav.classList.toggle("mobile-active");
    });

    // Cierra el menú si se hace clic fuera de él
    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove("mobile-active");
      }
    });
  }
}

function initCarousel() {
  const track = document.getElementById("carouselTrack");
  const slides = document.querySelectorAll(".hero-banner");
  const btnPrev = document.getElementById("btnPrevSlide");
  const btnNext = document.getElementById("btnNextSlide");
  const indicatorsContainer = document.getElementById("carouselIndicators");

  if (!track || !slides.length) return;

  let currentIdx = 0;
  const totalSlides = slides.length;
  let autoPlayInterval;

  // Generar indicadores del carrusel
  if (indicatorsContainer) {
    indicatorsContainer.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
      const ind = document.createElement("div");
      ind.className = "carousel-indicator";
      if (i === 0) ind.classList.add("active");
      ind.addEventListener("click", () => {
        currentIdx = i;
        updateCarousel();
        startAutoPlay();
      });
      indicatorsContainer.appendChild(ind);
    }
  }

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIdx * 100}%)`;
    if (indicatorsContainer) {
      const indicators = indicatorsContainer.querySelectorAll(
        ".carousel-indicator",
      );
      indicators.forEach((ind, i) => {
        if (i === currentIdx) ind.classList.add("active");
        else ind.classList.remove("active");
      });
    }
  }

  function nextSlide() {
    currentIdx = (currentIdx + 1) % totalSlides;
    updateCarousel();
  }

  function prevSlide() {
    currentIdx = (currentIdx - 1 + totalSlides) % totalSlides;
    updateCarousel();
  }

  function startAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, 5000);
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      nextSlide();
      startAutoPlay(); // Reiniciar el temporizador
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      prevSlide();
      startAutoPlay(); // Reiniciar el temporizador
    });
  }

  startAutoPlay();
}

function checkAgeGate() {
  const modal = document.getElementById("ageGateModal");
  if (!modal) return;

  if (localStorage.getItem("ageVerified") !== "true") {
    modal.showModal();

    const btnAccept = document.getElementById("btnAcceptAge");
    if (btnAccept) {
      btnAccept.addEventListener("click", () => {
        localStorage.setItem("ageVerified", "true");
        modal.close();
        if (typeof Notifications !== "undefined") {
          Notifications.success("Bienvenido a CasinoHub");
        }
      });
    }

    const btnReject = document.getElementById("btnRejectAge");
    if (btnReject) {
      btnReject.addEventListener("click", () => {
        window.location.href = "https://www.google.com";
      });
    }

    // Evitar que el modal se cierre al hacer clic fuera
    modal.addEventListener("cancel", (e) => {
      e.preventDefault();
    });
  }
}

function renderGames() {
  const container = document.getElementById("gamesContainer");
  if (!container) return;

  container.innerHTML = "";
  const user = typeof getUserData === "function" ? getUserData() : null;

  games.forEach((game) => {
    const card = document.createElement("a");
    let extraClass = "span-1";
    if (game.id === "rocket") extraClass = "span-2";
    if (game.id === "aviator") extraClass = "span-1";
    if (game.id === "slots") extraClass = "span-1";
    if (game.id === "poker") extraClass = "span-2";
    if (game.id === "mines") extraClass = "span-3";

    card.className = `game-card fade-in ${extraClass}`.trim();

    const isLocked = game.vip && (!user || !user.isVIP);

    if (isLocked) {
      card.href = "javascript:void(0);";
      card.onclick = () => {
        if (typeof UI !== "undefined") UI.openVIPModal();
      };
    } else {
      card.href = game.url;
    }

    card.innerHTML = `
            <div class="game-image-container">
                <div class="game-card-bg" style="background: ${game.bg}; background-size: cover; background-position: center;"></div>
                <div class="game-card-overlay" style="${isLocked ? "backdrop-filter: blur(8px); background: rgba(0,0,0,0.6); opacity: 1;" : ""}">
                    ${isLocked ? '<span class="play-btn" style="background: #ef4444; color: #ffffff; z-index: 10; font-weight: bold; padding: 10px 20px; border-radius: 20px;"><i class="fa-solid fa-lock"></i> VIP ONLY - DESBLOQUEAR</span>' : '<span class="play-btn">Jugar</span>'}
                </div>
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <span class="game-category" style="${isLocked ? "color: #eab308; font-weight: bold;" : ""}">${game.category}</span>
            </div>
            ${isLocked ? '<div style="position: absolute; top: 10px; right: 10px; background: #eab308; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; z-index: 10;"><i class="fa-solid fa-crown"></i> VIP</div>' : ""}
        `;

    container.appendChild(card);
  });
}

function openLoginModal() {
  renderProfilesList();
  const loginModal = document.getElementById("login-modal");
  if (loginModal) loginModal.showModal();
}

function renderProfilesList() {
  const list = document.getElementById("profiles-list");
  if (!list) return;

  const users = typeof Storage !== "undefined" ? Storage.getAllUsers() : [];
  list.innerHTML = "";

  if (users.length === 0) {
    list.innerHTML =
      '<p style="grid-column: span 2; color: #94a3b8;">No hay perfiles creados todavía.</p>';
    return;
  }

  users.forEach((u) => {
    list.innerHTML += `
            <div class="profile-card" data-username="${u.username}" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <img src="${u.avatar}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #0ea5e9; margin-bottom: 10px;">
                <div style="font-weight: 600; color: #fff;">${u.username}</div>
                <div style="font-size: 0.8em; color: #10b981;">${typeof Formatter !== "undefined" ? Formatter.currency(u.balance, u.currency) : u.balance + " " + u.currency}</div>
            </div>
        `;
  });
}

function initGatingLogic() {
  document.addEventListener(
    "click",
    (e) => {
      // Requerir inicio de sesión para jugar o acceder al perfil / saldo
      const needsAuthBtn =
        e.target.closest(".play-btn") ||
        e.target.closest(".user-profile-btn") ||
        e.target.closest("#addFundsBtn") ||
        e.target.closest(".balance-display") ||
        e.target.closest(".nav-item");

      // Si es un elemento del menú pero es Inicio, Promociones o Juegos, permitimos el acceso
      if (e.target.closest(".nav-item")) {
        const text = e.target.closest(".nav-item").textContent.trim();
        if (
          text.includes("Inicio") ||
          text.includes("Promociones") ||
          text.includes("Juegos")
        ) {
          return; // Permitir navegación libre
        }
      }

      if (needsAuthBtn) {
        const user = typeof Storage !== "undefined" ? Storage.getUser() : null;
        if (!user) {
          e.preventDefault();
          e.stopPropagation();
          openLoginModal();
        } else if (
          e.target.closest("#addFundsBtn") ||
          e.target.closest(".balance-display")
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof UI !== "undefined") UI.openWalletModal();
        }
      }
    },
    true,
  );
}

// Inicializa la lógica de creación e inicio de sesión de perfiles.
function initLoginLogic() {
  const btnCreate = document.getElementById("btn-create-profile");
  const inputName = document.getElementById("new-profile-name");
  const btnClose = document.getElementById("btn-close-login");

  if (btnCreate && inputName) {
    btnCreate.addEventListener("click", () => {
      const name = inputName.value.trim();
      if (!name) return;

      if (typeof Storage !== "undefined") {
        const newUser = Storage.registerUser(name);
        if (newUser) {
          Storage.loginUser(name);
          const loginModal = document.getElementById("login-modal");
          if (loginModal) loginModal.close();
          if (typeof Notifications !== "undefined")
            Notifications.success(`Bienvenido, ${name}`);
        } else {
          if (typeof Notifications !== "undefined")
            Notifications.error("El usuario ya existe o nombre inválido");
        }
      }
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.close();
    });
  }

  // Delegación de clics para la lista de perfiles
  document.addEventListener("click", (e) => {
    const profileCard = e.target.closest(".profile-card");
    const loginModal = document.getElementById("login-modal");
    if (profileCard && loginModal && loginModal.open) {
      const username = profileCard.dataset.username;
      if (typeof Storage !== "undefined") {
        Storage.loginUser(username);
        loginModal.close();
        if (typeof Notifications !== "undefined")
          Notifications.success(`Sesión iniciada como ${username}`);

        // Forzar recarga de la página para actualizar los datos visuales
        window.location.reload();
      }
    }
  });
}

// Muestra un modal con información rápida del perfil del usuario activo.
function openProfileModal() {
  const user = typeof Storage !== "undefined" ? Storage.getUser() : null;
  if (!user) return;

  const modal = document.getElementById("profile-modal");
  const avatar = document.getElementById("profile-modal-avatar");
  const name = document.getElementById("profile-modal-name");

  if (avatar) avatar.src = user.avatar;
  if (name) name.textContent = user.username;

  if (modal) modal.showModal();
}

// Configura el modal de perfil de usuario y el botón de cerrar sesión.
function initUserProfile() {
  const btnClose = document.getElementById("btn-close-profile");
  const btnLogout = document.getElementById("btn-logout");
  const modal = document.getElementById("profile-modal");

  if (btnClose && modal) {
    btnClose.addEventListener("click", () => {
      modal.close();
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (typeof Storage !== "undefined") {
        Storage.logoutUser();
      }
      if (modal) modal.close();
      // Recargar la página para volver al estado natural de "Invitado"
      window.location.reload();
    });
  }
}

// Funciones globales expuestas para mejor separación y accesibilidad
window.renderGames = renderGames;
