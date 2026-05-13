/*
  Manejador de interfaz global:
  - Actualiza los datos visibles de usuario y billetera.
  - Gestiona la lógica de VIP y paneles emergentes.
*/
const UI = {
  init: function () {
    this.updateBalanceDisplay();
    this.updateProfileDisplay();
    this.setupEventListeners();
    this.initWalletLogic();
    this.initVIPLogic();
    this.applyGlobalBackground();
  },

  applyGlobalBackground: function () {
    const user = Storage.getUser();
    if (user && user.bgImage) {
      let bgUrl = user.bgImage;
      // Arreglar rutas relativas dependiendo de donde estemos
      if (
        !bgUrl.startsWith("http") &&
        window.location.pathname.endsWith("index.html")
      ) {
        bgUrl = bgUrl.replace("../", "");
      } else if (
        !bgUrl.startsWith("http") &&
        window.location.pathname === "/"
      ) {
        bgUrl = bgUrl.replace("../", "");
      }
      document.body.style.backgroundImage = `linear-gradient(rgba(7, 11, 20, 0.85), rgba(7, 11, 20, 0.95)), url('${bgUrl}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage =
        "radial-gradient(circle at 50% 0%, rgba(20, 0, 31, 1) 0%, rgba(7, 11, 20, 1) 50%)";
    }
  },

  updateBalanceDisplay: function () {
    const user = Storage.getUser();
    const balanceElements = document.querySelectorAll("#userBalance");
    balanceElements.forEach((el) => {
      if (user) {
        el.textContent = Formatter.currency(user.balance, user.currency);
      } else {
        el.textContent = "0.00 EUR";
      }
    });
  },

  updateProfileDisplay: function () {
    const user = Storage.getUser();
    const nameElements = document.querySelectorAll("#userNameBtn");
    const avatarElements = document.querySelectorAll("#userAvatarBtn");

    if (user) {
      nameElements.forEach((el) => {
        el.textContent = user.username;
      });
      avatarElements.forEach((el) => {
        el.innerHTML = `<img src="${user.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit: cover;">`;
      });
    } else {
      nameElements.forEach((el) => {
        el.textContent = "Iniciar Sesión";
      });
      avatarElements.forEach((el) => {
        el.innerHTML = "U";
      });
    }
  },

  setupEventListeners: function () {
    // Escuchar cambios de saldo
    window.addEventListener("userBalanceChanged", () => {
      this.updateBalanceDisplay();
      this.updateProfileDisplay();
      this.updateWalletModalUI();
    });
  },

  renderProfilesList: function () {
    const list = document.getElementById("profiles-list");
    if (!list) return;

    const users = Storage.getAllUsers();
    list.innerHTML = "";

    if (users.length === 0) {
      list.innerHTML =
        '<p style="grid-column: span 2; color: #94a3b8;">No hay perfiles creados todavía.</p>';
      return;
    }

    users.forEach((u) => {
      list.innerHTML += `
                <div class="profile-card" data-username="${u.username}" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                    <img src="${u.avatar}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #0ea5e9; margin-bottom: 10px; object-fit: cover;">
                    <div style="font-weight: 600; color: #fff;">${u.username}</div>
                    <div style="font-size: 0.8em; color: #10b981;">${Formatter.currency(u.balance, u.currency)}</div>
                </div>
            `;
    });
  },

  openWalletModal: function () {
    this.updateWalletModalUI();
    const walletModal = document.getElementById("wallet-modal");
    if (walletModal) walletModal.showModal();
  },

  openVIPModal: function () {
    const modal = document.getElementById("vip-modal");
    if (modal) modal.showModal();
  },

  initVIPLogic: function () {
    const btnBuy = document.getElementById("btn-buy-vip");
    const btnClose = document.getElementById("btn-close-vip");
    const modal = document.getElementById("vip-modal");

    if (btnClose && modal) {
      btnClose.addEventListener("click", () => modal.close());
    }

    if (btnBuy && modal) {
      btnBuy.addEventListener("click", () => {
        const originalText = btnBuy.textContent;
        btnBuy.textContent = "Procesando...";
        btnBuy.disabled = true;

        setTimeout(() => {
          const success =
            typeof purchaseVIP === "function" ? purchaseVIP() : false;
          if (success) {
            Notifications.success(
              "¡Felicidades! Eres VIP. Neon Mines desbloqueado.",
            );
            modal.close();
            if (typeof renderGames === "function") renderGames();
          } else {
            Notifications.error(
              "Saldo insuficiente para ser VIP (Requiere 1000 EUR).",
            );
          }
          btnBuy.textContent = originalText;
          btnBuy.disabled = false;
        }, 1000);
      });
    }
  },

  initWalletLogic: function () {
    const btnCloseWallet = document.getElementById("btn-close-wallet");
    const walletModal = document.getElementById("wallet-modal");

    if (btnCloseWallet && walletModal) {
      btnCloseWallet.onclick = () => walletModal.close();
    }

    const tabs = document.querySelectorAll(".wallet-tab");
    const tabTransaction = document.getElementById("tab-transaction");
    const tabHistory = document.getElementById("tab-history");
    const transLabel = document.getElementById("transaction-label");
    const btnConfirm = document.getElementById("btn-confirm-transaction");

    let currentMode = "deposit";

    tabs.forEach((tab) => {
      tab.onclick = (e) => {
        tabs.forEach((t) => t.classList.remove("active"));
        e.target.classList.add("active");

        const tabName = e.target.dataset.tab;
        const msgEl = document.getElementById("transaction-msg");
        if (msgEl) msgEl.textContent = "";

        const inEl = document.getElementById("transaction-input");
        if (inEl) inEl.value = "";

        if (tabName === "history") {
          if (tabTransaction) tabTransaction.style.display = "none";
          if (tabHistory) tabHistory.style.display = "block";
        } else {
          if (tabTransaction) tabTransaction.style.display = "block";
          if (tabHistory) tabHistory.style.display = "none";
          currentMode = tabName;

          if (currentMode === "deposit") {
            if (transLabel) transLabel.textContent = "Cantidad a ingresar";
            if (btnConfirm) {
              btnConfirm.textContent = "Confirmar Ingreso";
              btnConfirm.style.background =
                "linear-gradient(45deg, var(--cyan), #0088ff)";
            }
          } else {
            if (transLabel) transLabel.textContent = "Cantidad a retirar";
            if (btnConfirm) {
              btnConfirm.textContent = "Confirmar Retiro";
              btnConfirm.style.background = "#ef4444";
            }
          }
        }
      };
    });

    // --- CORRECCIÓN DE EVENTOS DUPLICADOS ---
    const quickBtns = document.querySelectorAll(".btn-quick");
    const inputTrans = document.getElementById("transaction-input");
    const msgBox = document.getElementById("transaction-msg");

    quickBtns.forEach((btn) => {
      btn.onclick = (e) => {
        if (!inputTrans) return;

        if (e.target.id === "btn-max-amount") {
          if (currentMode === "withdraw") {
            const user = Storage.getUser();
            if (user) inputTrans.value = user.balance.toFixed(2);
          } else {
            inputTrans.value = "1000.00";
          }
        } else {
          const val = parseFloat(e.target.dataset.val) || 0;
          const currentVal = parseFloat(inputTrans.value) || 0;
          inputTrans.value = (currentVal + val).toFixed(2);
        }
      };
    });

    if (btnConfirm) {
      btnConfirm.onclick = () => {
        const amount = parseFloat(inputTrans ? inputTrans.value : 0);

        if (!amount || amount <= 0) {
          if (msgBox) {
            msgBox.textContent = "Pon una cantidad válida";
            msgBox.style.color = "#ef4444";
          }
          return;
        }

        const user = Storage.getUser();
        if (!user) return;

        if (currentMode === "withdraw" && amount > user.balance) {
          if (msgBox) {
            msgBox.textContent = "Saldo insuficiente";
            msgBox.style.color = "#ef4444";
          }
          return;
        }

        const originalText = btnConfirm.textContent;
        btnConfirm.textContent = "Procesando...";
        btnConfirm.disabled = true;
        if (msgBox) msgBox.textContent = "";

        setTimeout(() => {
          const finalAmount = currentMode === "deposit" ? amount : -amount;
          Storage.updateBalance(finalAmount, currentMode === "deposit");

          if (msgBox) {
            msgBox.textContent = "¡Transacción completada! ✔️";
            msgBox.style.color = "#10b981";
            msgBox.style.textShadow = "0 0 10px rgba(16, 185, 129, 0.5)";
          }

          if (inputTrans) inputTrans.value = "";

          const balanceEl = document.getElementById("wallet-balance");
          const updatedUser = Storage.getUser();
          if (balanceEl && updatedUser) {
            let start =
              parseFloat(balanceEl.textContent.replace(/[^\d.-]/g, "")) || 0;
            let end = updatedUser.balance;
            let duration = 1000;
            let startTime = null;

            function animation(currentTime) {
              if (startTime === null) startTime = currentTime;
              const timeElapsed = currentTime - startTime;
              const progress = Math.min(timeElapsed / duration, 1);
              const current = start + (end - start) * progress;
              balanceEl.textContent = Formatter.number(current);
              if (progress < 1) requestAnimationFrame(animation);
            }
            requestAnimationFrame(animation);
          }

          btnConfirm.textContent = originalText;
          btnConfirm.disabled = false;

          setTimeout(() => {
            if (msgBox) msgBox.textContent = "";
          }, 3000);
        }, 1000);
      };
    }
  }, // <-- ESTA LLAVE Y ESTA COMA SON LAS QUE FALTABAN

  // Actualiza el contenido dentro del modal de billetera con las transacciones y saldo actual.
  updateWalletModalUI: function () {
    const user = Storage.getUser();
    if (!user) return;

    const walletName = document.getElementById("wallet-name");
    const walletBalance = document.getElementById("wallet-balance");
    const walletAvatar = document.getElementById("wallet-avatar");
    const transactionsList = document.getElementById("wallet-transactions");

    if (walletName) walletName.textContent = user.username;
    if (walletBalance)
      walletBalance.textContent = Formatter.currency(
        user.balance,
        user.currency,
      )
        .replace(user.currency, "")
        .trim();
    if (walletAvatar) walletAvatar.src = user.avatar;

    if (transactionsList) {
      transactionsList.innerHTML = "";

      if (!user.transactions || user.transactions.length === 0) {
        transactionsList.innerHTML =
          '<li style="color: #94a3b8; font-style: italic;">No hay transacciones recientes.</li>';
      } else {
        user.transactions.forEach((tx) => {
          const li = document.createElement("li");
          li.style.background = "rgba(255,255,255,0.05)";
          li.style.padding = "12px 15px";
          li.style.borderRadius = "8px";
          li.style.display = "flex";
          li.style.justifyContent = "space-between";
          li.style.alignItems = "center";
          li.style.color = "#fff";

          const isDeposit = tx.type === "deposit";
          const typeText = isDeposit ? "Depósito" : "Retiro";
          const color = isDeposit ? "#10b981" : "#ef4444";
          const sign = isDeposit ? "+" : "-";
          const icon = isDeposit ? "⬇️" : "⬆️";

          li.innerHTML = `
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span>${icon}</span>
                            <span>
                                <div style="font-weight: 600;">${typeText}</div>
                                <div style="font-size: 0.8em; color: #94a3b8;">${tx.date}</div>
                            </span>
                        </div>
                        <span style="color: ${color}; font-weight: bold; font-size: 1.1em;">${sign}${Math.abs(tx.amount)} ${user.currency}</span>
                    `;
          transactionsList.appendChild(li);
        });
      }
    }
  },
};
