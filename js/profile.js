/*
  Perfil de usuario:
  - Muestra estadísticas de usuario, nivel, historial y estado VIP.
  - Permite cambiar el fondo, avatar y cerrar sesión.
*/
document.addEventListener("DOMContentLoaded", () => {
  if (typeof UI !== "undefined") UI.init();
  if (typeof Notifications !== "undefined") Notifications.init();

  const elements = {
    name: document.getElementById("profileName"),
    avatar: document.getElementById("profileBigAvatar"),
    level: document.getElementById("profileLevel"),
    xpText: document.getElementById("profileXpText"),
    levelBar: document.getElementById("profileLevelBar"),
    bgBanner: document.getElementById("profileBanner"),
    bgSelector: document.getElementById("bgSelector"),
    bgPanel: document.getElementById("bgSelectorPanel"),
    btnChangeBg: document.getElementById("btnChangeBanner"),
    btnCloseBg: document.getElementById("btnCloseBgPanel"),
    vipContainer: document.getElementById("vipBadgeContainer"),
    statWon: document.getElementById("statWon"),
    statDeposited: document.getElementById("statDeposited"),
    statLost: document.getElementById("statLost"),
    statGames: document.getElementById("statGames"),
    btnLogoutProfile: document.getElementById("btnLogoutProfile"),
    historyBody: document.getElementById("transaction-history-body"),
    historyContainer: document.getElementById("history-container"),
  };

  const backgrounds = [
    { level: 1, url: "" }, // Default
    { level: 1, url: "../utils/img/imgRicardo.jpg" },
    { level: 1, url: "../utils/img/imgRuben.jpeg" },
    { level: 1, url: "../utils/img/imgStepan.jpeg" },
    { level: 1, url: "../utils/img/imgVitali.jpeg" },
  ];

  // Devuelve el umbral de ganancias necesario para cada nivel del perfil.
  function getLevelThreshold(level) {
    if (level >= 5) return 10000;
    if (level === 4) return 5000;
    if (level === 3) return 1000;
    if (level === 2) return 100;
    return 0;
  }

  // Actualiza todos los elementos visibles del perfil usando los datos del usuario activo.
  function updateProfileView() {
    const user = typeof getUserData === "function" ? getUserData() : null;
    if (!user) return;

    if (elements.name) elements.name.textContent = user.username;

    if (elements.avatar)
      elements.avatar.innerHTML = `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;

    // Stats
    if (elements.statWon)
      elements.statWon.textContent =
        typeof Formatter !== "undefined"
          ? Formatter.currency(user.stats.totalWon, user.currency)
          : user.stats.totalWon + " " + user.currency;
    if (elements.statDeposited)
      elements.statDeposited.textContent =
        typeof Formatter !== "undefined"
          ? Formatter.currency(user.stats.totalDeposited, user.currency)
          : user.stats.totalDeposited + " " + user.currency;
    if (elements.statLost)
      elements.statLost.textContent =
        typeof Formatter !== "undefined"
          ? Formatter.currency(user.stats.totalLost, user.currency)
          : user.stats.totalLost + " " + user.currency;
    if (elements.statGames)
      elements.statGames.textContent = user.stats.gamesPlayed.toString();

    // Level logic
    if (elements.level) elements.level.textContent = user.level;

    let currentThreshold = getLevelThreshold(user.level);
    let nextThreshold = getLevelThreshold(user.level + 1);

    if (user.level >= 5) {
      if (elements.xpText) elements.xpText.textContent = `(Max Level)`;
      if (elements.levelBar) elements.levelBar.style.width = "100%";
    } else {
      let progress =
        ((user.stats.totalWon - currentThreshold) /
          (nextThreshold - currentThreshold)) *
        100;
      progress = Math.max(0, Math.min(100, progress));
      if (elements.xpText)
        elements.xpText.textContent = `(${user.stats.totalWon.toFixed(0)} / ${nextThreshold} EUR Ganados)`;
      if (elements.levelBar) elements.levelBar.style.width = `${progress}%`;
    }

    // VIP Badge
    renderVIPStatus(user);

    // Apply saved Banner
    if (user.bgImage && elements.bgBanner) {
      elements.bgBanner.style.backgroundImage = `url('${user.bgImage}')`;
    } else if (elements.bgBanner) {
      elements.bgBanner.style.backgroundImage = "none";
      elements.bgBanner.style.backgroundColor = "var(--bg-card)";
    }

    renderBackgroundGallery(user);
    renderTransactionHistory(user);
  }

  // Muestra el estado VIP dentro del perfil y ofrece el botón para hacerse VIP si no lo es.
  function renderVIPStatus(user) {
    if (!elements.vipContainer) return;

    if (user.isVIP) {
      elements.vipContainer.innerHTML = `
                <span style="background: linear-gradient(45deg, #eab308, #ca8a04); color: #000; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 5px; box-shadow: 0 0 15px rgba(234, 179, 8, 0.4);">
                    <i class="fa-solid fa-crown"></i> MIEMBRO VIP
                </span>
            `;
    } else {
      elements.vipContainer.innerHTML = `
                <button id="btnBecomeVip" style="background: linear-gradient(45deg, var(--magenta), #be185d); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.3s;">
                    <i class="fa-solid fa-lock"></i> Hazte VIP
                </button>
            `;

      // Añadir listener al botón recién creado
      const btn = document.getElementById("btnBecomeVip");
      if (btn) {
        btn.addEventListener("click", () => {
          const vipModal = document.getElementById("vip-modal");
          if (vipModal) {
            vipModal.showModal();
          }
        });
      }
    }
  }

  // Renderiza el historial de transacciones del usuario en el perfil.
  function renderTransactionHistory(user) {
    if (!elements.historyContainer || !elements.historyBody) return;

    // Limpiar tabla
    elements.historyBody.innerHTML = "";

    if (!user.transactions || user.transactions.length === 0) {
      elements.historyContainer.innerHTML = `
                <div style="text-align: center; padding: 50px 30px; color: #94a3b8; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i class="fa-solid fa-receipt" style="font-size: 32px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <br>
                    <span style="font-weight: bold; font-size: 16px;">Aún no hay movimientos</span>
                    <p style="font-size: 13px; margin-top: 5px;">Tus depósitos, retiros y apuestas aparecerán aquí.</p>
                </div>
            `;
      return;
    }

    // Si hay transacciones, asegurar que el contenedor tiene la tabla (por si veníamos de estado vacío)
    if (!document.querySelector(".history-table")) {
      elements.historyContainer.innerHTML = `
                <div class="table-responsive">
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Detalle</th>
                                <th>Cantidad</th>
                            </tr>
                        </thead>
                        <tbody id="transaction-history-body"></tbody>
                    </table>
                </div>
            `;
      // Re-asignar historyBody porque el innerHTML anterior lo destruyó
      elements.historyBody = document.getElementById(
        "transaction-history-body",
      );
    }

    user.transactions.forEach((tx) => {
      const row = document.createElement("tr");

      const isPositive = tx.amount > 0;
      const amountClass = isPositive ? "amount-positive" : "amount-negative";
      const sign = isPositive ? "+" : "";

      let typeBadgeClass = "type-game";
      if (tx.type === "deposit") typeBadgeClass = "type-deposit";
      if (tx.type === "withdraw") typeBadgeClass = "type-withdraw";

      const typeLabel =
        tx.type === "deposit"
          ? "Depósito"
          : tx.type === "withdraw"
            ? "Retiro"
            : "Juego";

      row.innerHTML = `
                <td><span style="color: #94a3b8; font-size: 12px;">${tx.date}</span></td>
                <td><span class="type-badge ${typeBadgeClass}">${typeLabel}</span></td>
                <td><span style="font-weight: 500;">${tx.detail || "Transacción de sistema"}</span></td>
                <td><span class="${amountClass}">${sign}${tx.amount.toFixed(2)} ${user.currency}</span></td>
            `;
      elements.historyBody.appendChild(row);
    });
  }

  // Dibuja la galería de fondos disponibles y permite seleccionar uno para el perfil.
  function renderBackgroundGallery(user) {
    if (!elements.bgSelector) return;
    elements.bgSelector.innerHTML = "";

    backgrounds.forEach((bg) => {
      const isUnlocked = user.level >= bg.level;
      const thumb = document.createElement("div");
      thumb.className = `bg-thumb ${isUnlocked ? "unlocked" : "locked"} ${user.bgImage === bg.url ? "active" : ""}`;
      thumb.style.width = "80px";
      thumb.style.height = "60px";
      thumb.style.borderRadius = "8px";
      thumb.style.cursor = isUnlocked ? "pointer" : "not-allowed";
      thumb.style.border =
        user.bgImage === bg.url
          ? "2px solid var(--cyan)"
          : "2px solid rgba(255,255,255,0.1)";
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";

      if (bg.url) {
        thumb.style.backgroundImage = `url('${bg.url}')`;
      } else {
        thumb.style.background = "linear-gradient(45deg, #1e293b, #0f172a)";
        thumb.innerHTML =
          '<i class="fa-solid fa-ban" style="font-size: 12px; opacity: 0.5; color: #fff;"></i>';
        thumb.style.display = "flex";
        thumb.style.alignItems = "center";
        thumb.style.justifyContent = "center";
      }

      if (!isUnlocked) {
        const lock = document.createElement("div");
        lock.style.position = "absolute";
        lock.style.inset = "0";
        lock.style.background = "rgba(0,0,0,0.6)";
        lock.style.display = "flex";
        lock.style.flexDirection = "column";
        lock.style.alignItems = "center";
        lock.style.justifyContent = "center";
        lock.style.color = "#fff";
        lock.style.fontSize = "10px";
        lock.innerHTML = `<i class="fa-solid fa-lock"></i><span>Nvl ${bg.level}</span>`;
        thumb.appendChild(lock);
      } else {
        thumb.addEventListener("click", () => {
          user.bgImage = bg.url;
          if (typeof saveUserData === "function") saveUserData(user);
          else localStorage.setItem("casino_user", JSON.stringify(user));

          updateProfileView();
          if (typeof Notifications !== "undefined")
            Notifications.success("Fondo de perfil actualizado");
        });
      }

      elements.bgSelector.appendChild(thumb);
    });
  }

  // Toggle Background Panel
  if (elements.btnChangeBg) {
    elements.btnChangeBg.addEventListener("click", () => {
      if (elements.bgPanel) elements.bgPanel.style.transform = "translateY(0)";
    });
  }

  if (elements.btnCloseBg) {
    elements.btnCloseBg.addEventListener("click", () => {
      if (elements.bgPanel)
        elements.bgPanel.style.transform = "translateY(100%)";
    });
  }

  // Change avatar
  if (elements.avatar) {
    elements.avatar.addEventListener("click", () => {
      const newUrl = prompt("Introduce la URL de tu nueva imagen de avatar:");
      if (newUrl) {
        const user = typeof getUserData === "function" ? getUserData() : null;
        if (user) {
          user.avatar = newUrl;
          if (typeof saveUserData === "function") saveUserData(user);
          updateProfileView();
          if (typeof Notifications !== "undefined")
            Notifications.success("Avatar actualizado");
        }
      }
    });
  }

  if (elements.btnLogoutProfile) {
    elements.btnLogoutProfile.addEventListener("click", () => {
      if (typeof Storage !== "undefined") {
        Storage.logoutUser();
      }
      window.location.href = "../index.html";
    });
  }

  // Init
  updateProfileView();
  window.addEventListener("userBalanceChanged", updateProfileView);
});
