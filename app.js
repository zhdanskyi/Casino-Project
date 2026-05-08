import { getUser, getAllUsers, registerUser, loginUser, logoutUser, updateBalance } from './utils/storage.js';

// arrancamos todo cuando cargue la pag
document.addEventListener('DOMContentLoaded', () => {
    initAgeGate();
    initSidebar();
    
    const user = getUser();
    updateTopbar(user);
    
    // si no hay usuario cargamos logica pero no forzamos pantalla
    if (!user) {
        renderProfilesList();
        initLoginLogic();
    }

    initUserProfile();
    initWalletModal();
    renderGameGrid();
    initGatingLogic();
});

// cambia la vista entre el lobby y un juego
window.openGame = function(gameName) {
    const banners = document.querySelector('.promo-banners');
    const showcase = document.querySelector('.game-showcase');
    const search = document.querySelector('.search-and-categories');
    const crashSection = document.getElementById('crash-game-section');

    if (gameName === 'crash') {
        if (banners) banners.style.display = 'none';
        if (showcase) showcase.style.display = 'none';
        if (search) search.style.display = 'none';
        if (crashSection) crashSection.style.display = 'block';
        
        initCrashGame();
    }
}

// funcion para volver al inicio cuando el usuario pincha en el logo
window.returnToHome = function() {
    const banners = document.querySelector('.promo-banners');
    const showcase = document.querySelector('.game-showcase');
    const search = document.querySelector('.search-and-categories');
    const crashSection = document.getElementById('crash-game-section');

    if (banners) banners.style.display = 'grid';
    if (showcase) showcase.style.display = 'block';
    if (search) search.style.display = 'block';
    if (crashSection) crashSection.style.display = 'none';
}

// controla que los clics importantes requieran sesion
function initGatingLogic() {
    document.addEventListener('click', (e) => {
        // si no hay sesion y le da a cualquier cosa que requiera login, le sacamos la pantalla
        const needsAuthBtn = e.target.closest('#btn-open-login') || 
                             e.target.closest('.balance-container') || 
                             e.target.closest('#btn-add-funds') ||
                             e.target.closest('.game-hover-overlay .btn-primary');
        
        if (needsAuthBtn) {
            const user = getUser();
            if (!user) {
                // evitamos que haga la accion normal
                e.preventDefault();
                e.stopPropagation();
                
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.showModal();
            }
        }
    }, true); // useCapture para interceptar antes que los demas
}

function initLoginLogic() {
    const btnCreate = document.getElementById('btn-create-profile');
    const inputName = document.getElementById('new-profile-name');
    
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            const name = inputName.value;
            if (!name) return;
            
            const newUser = registerUser(name);
            if (newUser) {
                // login automatico
                loginUser(name);
                window.location.reload(); // recargamos para iniciar el casino normal
            } else {
                alert('el usuario ya existe o nombre invalido');
            }
        });
    }
    
    // delegacion de clics para los perfiles de la lista
    document.addEventListener('click', (e) => {
        const profileCard = e.target.closest('.profile-card');
        if (profileCard) {
            const username = profileCard.dataset.username;
            loginUser(username);
            window.location.reload();
        }
    });
}

function renderProfilesList() {
    const list = document.getElementById('profiles-list');
    if (!list) return;
    
    const users = getAllUsers();
    list.innerHTML = '';
    
    if (users.length === 0) {
        list.innerHTML = '<p style="grid-column: span 2; color: var(--text-secondary);">No hay perfiles creados todavía.</p>';
        return;
    }
    
    users.forEach(u => {
        list.innerHTML += `
            <div class="profile-card" data-username="${u.username}" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                <img src="${u.avatar}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--accent-primary); margin-bottom: 10px;">
                <div style="font-weight: 600;">${u.username}</div>
                <div style="font-size: 0.8em; color: var(--accent-success);">${parseFloat(u.balance).toFixed(2)}€</div>
            </div>
        `;
    });
}

// modal para los q no tienen 18
function initAgeGate() {
    const ageModal = document.getElementById('age-gate-modal');
    if (!ageModal) return;

    const btnAccept = document.getElementById('btn-accept-age');
    const btnReject = document.getElementById('btn-reject-age');

    // usamos showModal para que el navegador oscurezca el fondo por nosotros
    if (!localStorage.getItem('ageVerified')) {
        ageModal.showModal();
    } else {
        // si ya entro antes arrancamos las animaciones del tiron
        document.body.classList.add('start-animations');
    }

    // si le da a aceptar
    if (btnAccept) {
        btnAccept.addEventListener('click', () => {
            localStorage.setItem('ageVerified', 'true');
            ageModal.close();
            
            // activamos las animaciones solo cuando el usuario acepta el cartel
            setTimeout(() => {
                document.body.classList.add('start-animations');
            }, 200);
        });
    }

    // si le da a rechazar se va a google
    if (btnReject) {
        btnReject.addEventListener('click', () => {
            window.location.href = "https://www.google.com";
        });
    }
}

// para ocultar o mostrar el menu lateral
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const btnToggle = document.getElementById('btn-toggle-sidebar');

    if (btnToggle && sidebar) {
        btnToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
}

// actualiza la barrita de arriba con los datos del user o oculta
function updateTopbar(currentUser) {
    const btnOpenLogin = document.getElementById('btn-open-login');
    const loggedInControls = document.getElementById('logged-in-controls');
    
    if (!currentUser) {
        if (btnOpenLogin) btnOpenLogin.style.display = 'block';
        if (loggedInControls) loggedInControls.style.display = 'none';
        return;
    }
    
    if (btnOpenLogin) btnOpenLogin.style.display = 'none';
    if (loggedInControls) loggedInControls.style.display = 'flex';

    const balanceNode = document.getElementById('user-balance');
    const nameNode = document.getElementById('user-name');
    const avatarNode = document.getElementById('user-avatar');
    const currencyNode = document.getElementById('user-currency');

    if (balanceNode) balanceNode.textContent = parseFloat(currentUser.balance).toFixed(2);
    if (nameNode) nameNode.textContent = currentUser.username;
    if (avatarNode) avatarNode.src = currentUser.avatar;
    if (currencyNode) currencyNode.textContent = currentUser.currency;
}

// pilla los datos y los enchufa en la app
function initUserProfile() {
    // delegacion de eventos para clics en topbar (perfil y balance)
    document.addEventListener('click', (e) => {
        // click en el perfil de usuario abre el modal de perfil
        if (e.target.closest('#user-profile-btn')) {
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) {
                // actualizamos los datos visuales del perfil
                const currentUser = getUser();
                if (!currentUser) return;
                
                const nameNode = document.getElementById('profile-modal-name');
                const avatarNode = document.getElementById('profile-modal-avatar');
                if (nameNode) nameNode.textContent = currentUser.username;
                if (avatarNode) avatarNode.src = currentUser.avatar;
                
                profileModal.showModal();
            }
        }
        
        // click en el balance o boton de añadir abre el wallet modal
        if (e.target.closest('.balance-container') || e.target.closest('#btn-add-funds')) {
            const currentUser = getUser();
            if (!currentUser) return; // la captura principal ya mostro el login
            
            updateWalletModalUI(currentUser);
            const walletModal = document.getElementById('wallet-modal');
            if (walletModal) walletModal.showModal();
        }
        
        // click en cerrar sesion
        if (e.target.closest('#btn-logout')) {
            logoutUser();
            window.location.reload();
        }
        
        // cerrar modal de perfil
        if (e.target.closest('#btn-close-profile')) {
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) profileModal.close();
        }
    });
}

// logica del modal del perfil/wallet
function initWalletModal() {
    const btnCloseWallet = document.getElementById('btn-close-wallet');
    const walletModal = document.getElementById('wallet-modal');

    // cerrar el modal
    if (btnCloseWallet && walletModal) {
        btnCloseWallet.addEventListener('click', () => {
            walletModal.close();
        });
    }

    // tabs de la wallet
    const tabs = document.querySelectorAll('.wallet-tab');
    const tabTransaction = document.getElementById('tab-transaction');
    const tabHistory = document.getElementById('tab-history');
    const transLabel = document.getElementById('transaction-label');
    const btnConfirm = document.getElementById('btn-confirm-transaction');
    
    // variable global para saber en q pestaña estamos
    let currentMode = 'deposit';

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // quitamos active a todas
            tabs.forEach(t => t.classList.remove('active'));
            // se la ponemos a la clickeada
            e.target.classList.add('active');

            const tabName = e.target.dataset.tab;
            
            // ocultar mensajes viejos
            document.getElementById('transaction-msg').textContent = '';
            document.getElementById('transaction-input').value = '';

            if (tabName === 'history') {
                tabTransaction.style.display = 'none';
                tabHistory.style.display = 'block';
            } else {
                tabTransaction.style.display = 'block';
                tabHistory.style.display = 'none';
                currentMode = tabName;
                
                if (currentMode === 'deposit') {
                    transLabel.textContent = 'Cantidad a ingresar';
                    btnConfirm.textContent = 'Confirmar Ingreso';
                    btnConfirm.style.background = 'var(--accent-primary)';
                } else {
                    transLabel.textContent = 'Cantidad a retirar';
                    btnConfirm.textContent = 'Confirmar Retiro';
                    btnConfirm.style.background = '#ef4444'; // rojo peligro
                }
            }
        });
    });

    // botones de cantidades rapidas
    const quickBtns = document.querySelectorAll('.btn-quick');
    const inputTrans = document.getElementById('transaction-input');
    
    quickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.id === 'btn-max-amount') {
                // si es maximo y es retiro le ponemos todo el balance
                if (currentMode === 'withdraw') {
                    const user = getUser();
                    inputTrans.value = user.balance;
                } else {
                    // si es deposito maximo... le ponemos 1000 por poner algo
                    inputTrans.value = 1000;
                }
            } else {
                const val = parseFloat(e.target.dataset.val);
                const currentVal = parseFloat(inputTrans.value) || 0;
                inputTrans.value = currentVal + val;
            }
        });
    });

    // botonazo de confirmar transaccion
    const msgBox = document.getElementById('transaction-msg');
    
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            const amount = parseFloat(inputTrans.value);
            
            // si no puso nada o puso cosas raras
            if (!amount || amount <= 0) {
                msgBox.textContent = 'porfa, pon una cantidad valida';
                msgBox.style.color = '#ef4444';
                return;
            }

            const user = getUser();
            
            // si quiere retirar mas de lo q tiene, pumba error
            if (currentMode === 'withdraw' && amount > user.balance) {
                msgBox.textContent = 'saldo insuficiente brother';
                msgBox.style.color = '#ef4444';
                return;
            }

            // bloqueamos boton y simulamos carga
            const originalText = btnConfirm.textContent;
            btnConfirm.textContent = 'Procesando...';
            btnConfirm.disabled = true;
            msgBox.textContent = '';

            setTimeout(() => {
                // calculamos si suma o resta
                const finalAmount = currentMode === 'deposit' ? amount : -amount;
                const updatedUser = updateBalance(finalAmount);
                
                updateTopbar(updatedUser);
                updateWalletModalUI(updatedUser);
                
                // exito
                msgBox.textContent = '¡transaccion completada! ✔️';
                msgBox.style.color = 'var(--accent-success)';
                inputTrans.value = '';
                
                // devolvemos boton a la vida
                btnConfirm.textContent = originalText;
                btnConfirm.disabled = false;
                
                // quitamos mensaje a los 3 segs
                setTimeout(() => msgBox.textContent = '', 3000);
            }, 1500);
        });
    }
}

// repinta los datos dentro del modal de wallet
function updateWalletModalUI(user) {
    const walletName = document.getElementById('wallet-name');
    const walletBalance = document.getElementById('wallet-balance');
    const walletAvatar = document.getElementById('wallet-avatar');
    const transactionsList = document.getElementById('wallet-transactions');

    if (walletName) walletName.textContent = user.username;
    if (walletBalance) walletBalance.textContent = parseFloat(user.balance).toFixed(2);
    if (walletAvatar) walletAvatar.src = user.avatar;

    // mapeamos todo el array de transacciones para el historial completo
    if (transactionsList) {
        transactionsList.innerHTML = '';
        
        if (!user.transactions || user.transactions.length === 0) {
            transactionsList.innerHTML = '<li style="color: var(--text-secondary); font-style: italic;">No hay transacciones recientes.</li>';
        } else {
            user.transactions.forEach(tx => {
                const li = document.createElement('li');
                li.style.background = 'rgba(255,255,255,0.05)';
                li.style.padding = '12px 15px';
                li.style.borderRadius = '8px';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                
                const isDeposit = tx.type === 'deposit';
                const typeText = isDeposit ? 'Depósito' : 'Retiro';
                const color = isDeposit ? 'var(--accent-success)' : '#ef4444';
                const sign = isDeposit ? '+' : '-';
                const icon = isDeposit ? '⬇️' : '⬆️';
                
                li.innerHTML = `
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span>${icon}</span>
                        <span>
                            <div style="font-weight: 600;">${typeText}</div>
                            <div style="font-size: 0.8em; color: var(--text-secondary);">${tx.date}</div>
                        </span>
                    </div>
                    <span style="color: ${color}; font-weight: bold; font-size: 1.1em;">${sign}${Math.abs(tx.amount)}€</span>
                `;
                transactionsList.appendChild(li);
            });
        }
    }
}

// lista de juegos fake
const GAMES_MOCK_DATA = [
    {
        id: "g_01",
        title: "Gates of Olympus",
        provider: "Pragmatic Play",
        imageClass: "img-placeholder-1"
    },
    {
        id: "g_02",
        title: "Lightning Roulette",
        provider: "Evolution",
        imageClass: "img-placeholder-2"
    },
    {
        id: "g_03",
        title: "Classic Blackjack",
        provider: "NetEnt",
        imageClass: "img-placeholder-3"
    },
    {
        id: "g_04",
        title: "Crash Original",
        provider: "House Games",
        imageClass: "img-placeholder-4"
    }
];

// crea las tarjetitas de los juegos dinamicamente
function renderGameGrid() {
    const gridContainer = document.getElementById('game-grid');
    if (!gridContainer) return;

    // limpiamos x si acaso
    gridContainer.innerHTML = '';

    // usamos fragmento pa no saturar el dom
    const fragment = document.createDocumentFragment();

    GAMES_MOCK_DATA.forEach(game => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'game-card';
        cardWrapper.dataset.gameId = game.id;

        // metemos el html dentro de la carta
        // usamos imagenes falsas simulando los banners de mellstroy
        // si es el Crash, le metemos el onclick directo para abrir el juego
        const clickAction = game.id === 'g_04' ? `onclick="window.openGame('crash')"` : '';

        cardWrapper.innerHTML = `
            <img class="game-image" src="https://placehold.co/400x225/1a1b23/0ea5e9?text=${encodeURIComponent(game.title)}" alt="${game.title}">
            <div class="game-hover-overlay">
                <button class="btn btn-primary" ${clickAction}>Jugar Ahora</button>
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <span class="game-provider">${game.provider}</span>
            </div>
        `;

        fragment.appendChild(cardWrapper);
    });

    // pumb, todo pal html
    gridContainer.appendChild(fragment);
}

// --- LÓGICA DEL JUEGO CRASH ---
let crashInterval;
let currentMultiplier = 1.00;
let isGameRunning = false;
let hasCashedOut = false;
let currentBet = 0;

function initCrashGame() {
    const btnAction = document.getElementById('btn-crash-action');
    const inputBet = document.getElementById('crash-bet-input');
    const multiplierText = document.getElementById('crash-multiplier');
    const statusText = document.getElementById('crash-status-text');
    const msgText = document.getElementById('crash-msg');
    
    // reset visual por si venimos de otra pagina
    if (!isGameRunning) {
        multiplierText.textContent = '1.00x';
        multiplierText.style.color = '#ffffff';
        statusText.textContent = 'Esperando...';
        btnAction.textContent = 'APOSTAR';
        btnAction.style.background = 'var(--accent-primary)';
        msgText.textContent = '';
    }
    
    // evitamos duplicar listeners
    document.getElementById('btn-crash-min').onclick = () => inputBet.value = 10;
    document.getElementById('btn-crash-half').onclick = () => inputBet.value = Math.max(1, (parseFloat(inputBet.value) || 0) / 2);
    document.getElementById('btn-crash-double').onclick = () => inputBet.value = (parseFloat(inputBet.value) || 0) * 2;
    document.getElementById('btn-crash-max').onclick = () => {
        const user = getUser();
        if (user) inputBet.value = user.balance;
    };
    
    // accion principal
    btnAction.onclick = () => {
        const user = getUser();
        if (!user) {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.showModal();
            return;
        }

        if (!isGameRunning) {
            // Empezar juego
            const bet = parseFloat(inputBet.value);
            if (!bet || bet <= 0 || bet > user.balance) {
                msgText.textContent = 'Saldo insuficiente o apuesta inválida';
                msgText.style.color = '#ef4444';
                return;
            }
            
            // restamos la apuesta al empezar (storage se encarga del historial)
            updateBalance(-bet);
            updateTopbar(getUser());
            currentBet = bet;
            
            startGame();
            
        } else {
            // Retirar (Cash Out)
            if (!hasCashedOut) {
                hasCashedOut = true;
                const winAmount = currentBet * currentMultiplier;
                
                // si le da a retirar a tiempo, le sumamos la pasta a su perfil
                updateBalance(winAmount);
                updateTopbar(getUser());
                
                msgText.textContent = `¡Te has retirado con ${winAmount.toFixed(2)}€!`;
                msgText.style.color = 'var(--accent-success)';
                
                btnAction.textContent = 'ESPERANDO...';
                btnAction.disabled = true;
                btnAction.style.background = 'rgba(255,255,255,0.1)';
            }
        }
    };
}

function startGame() {
    const btnAction = document.getElementById('btn-crash-action');
    const multiplierText = document.getElementById('crash-multiplier');
    const statusText = document.getElementById('crash-status-text');
    const msgText = document.getElementById('crash-msg');
    
    isGameRunning = true;
    hasCashedOut = false;
    currentMultiplier = 1.00;
    
    btnAction.textContent = 'RETIRAR';
    btnAction.style.background = '#eab308'; // naranja/amarillo
    btnAction.disabled = false;
    msgText.textContent = '';
    statusText.textContent = 'Volando...';
    
    multiplierText.style.color = 'var(--accent-success)';
    
    // generamos el punto de quiebre (formula asimetrica que favorece crashes tempranos)
    // ej: 100 / un numero aleatorio sesgado hacia arriba
    const e = 100 / (100 - (Math.random() * 100));
    const crashPoint = Math.max(1.00, e * 0.95); 
    
    clearInterval(crashInterval);
    
    crashInterval = setInterval(() => {
        // la velocidad sube de forma exponencial
        currentMultiplier += 0.005 + (currentMultiplier * 0.005);
        
        if (currentMultiplier >= crashPoint) {
            // EXPLOTA
            currentMultiplier = crashPoint;
            multiplierText.textContent = currentMultiplier.toFixed(2) + 'x';
            endGameCrash();
        } else {
            multiplierText.textContent = currentMultiplier.toFixed(2) + 'x';
        }
    }, 50); // 20 fps
}

function endGameCrash() {
    clearInterval(crashInterval);
    isGameRunning = false;
    
    const btnAction = document.getElementById('btn-crash-action');
    const multiplierText = document.getElementById('crash-multiplier');
    const statusText = document.getElementById('crash-status-text');
    
    multiplierText.style.color = '#ef4444'; // rojo sangre
    statusText.textContent = '¡Explotó!';
    
    btnAction.textContent = 'APOSTAR';
    btnAction.style.background = 'var(--accent-primary)';
    btnAction.disabled = false;
    
    if (!hasCashedOut) {
        const msgText = document.getElementById('crash-msg');
        msgText.textContent = 'Has perdido la apuesta...';
        msgText.style.color = '#ef4444';
    }
}
