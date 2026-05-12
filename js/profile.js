document.addEventListener('DOMContentLoaded', () => {
    if (typeof UI !== 'undefined') UI.init();
    if (typeof Notifications !== 'undefined') Notifications.init();

    const elements = {
        name: document.getElementById('profileName'),
        avatar: document.getElementById('profileBigAvatar'),
        level: document.getElementById('profileLevel'),
        xpText: document.getElementById('profileXpText'),
        levelBar: document.getElementById('profileLevelBar'),
        bgContainer: document.getElementById('profileBackground'),
        bgSelector: document.getElementById('bgSelector'),
        btnViewBg: document.getElementById('btnViewBg'),
        statWon: document.getElementById('statWon'),
        statDeposited: document.getElementById('statDeposited'),
        statLost: document.getElementById('statLost'),
        statGames: document.getElementById('statGames'),
        mobileBtn: document.getElementById('mobileMenuBtn'),
        sidebar: document.getElementById('sidebar'),
        fullBgModal: document.getElementById('full-bg-modal'),
        fullBgImg: document.getElementById('full-bg-img')
    };

    const backgrounds = [
        { level: 1, url: '' }, // Default
        { level: 2, url: '../utils/img/imgRicardo.jpg' },
        { level: 3, url: '../utils/img/imgRuben.jpeg' },
        { level: 4, url: '../utils/img/imgStepan.jpeg' },
        { level: 5, url: '../utils/img/imgVitali.jpeg' }
    ];

    function getLevelThreshold(level) {
        if (level >= 5) return 10000;
        if (level === 4) return 5000;
        if (level === 3) return 1000;
        if (level === 2) return 100;
        return 0;
    }

    function updateProfileView() {
        const user = getUserData();
        if (!user) return;
        
        if(elements.name) elements.name.textContent = user.username;
        if(elements.avatar) elements.avatar.innerHTML = `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        
        // Stats
        if(elements.statWon) elements.statWon.textContent = Formatter.currency(user.stats.totalWon, user.currency);
        if(elements.statDeposited) elements.statDeposited.textContent = Formatter.currency(user.stats.totalDeposited, user.currency);
        if(elements.statLost) elements.statLost.textContent = Formatter.currency(user.stats.totalLost, user.currency);
        if(elements.statGames) elements.statGames.textContent = user.stats.gamesPlayed.toString();
        
        // Level logic
        if(elements.level) elements.level.textContent = user.level;
        
        let currentThreshold = getLevelThreshold(user.level);
        let nextThreshold = getLevelThreshold(user.level + 1);
        
        if (user.level >= 5) {
            elements.xpText.textContent = `(Max Level)`;
            elements.levelBar.style.width = '100%';
        } else {
            let progress = ((user.stats.totalWon - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
            progress = Math.max(0, Math.min(100, progress));
            elements.xpText.textContent = `(${user.stats.totalWon.toFixed(0)} / ${nextThreshold} EUR Ganados)`;
            elements.levelBar.style.width = `${progress}%`;
        }

        // Apply saved BG
        if (user.bgImage && elements.bgContainer) {
            elements.bgContainer.style.backgroundImage = `url('${user.bgImage}')`;
        } else if (elements.bgContainer) {
            elements.bgContainer.style.backgroundImage = 'none';
            elements.bgContainer.style.backgroundColor = 'var(--bg-card)';
        }
        
        renderBackgroundGallery(user);
    }

    function renderBackgroundGallery(user) {
        if (!elements.bgSelector) return;
        elements.bgSelector.innerHTML = '';
        
        backgrounds.forEach(bg => {
            const isUnlocked = user.level >= bg.level;
            const thumb = document.createElement('div');
            thumb.className = `bg-thumb ${isUnlocked ? 'unlocked' : 'locked'} ${user.bgImage === bg.url ? 'active' : ''}`;
            
            if (bg.url) {
                thumb.style.backgroundImage = `url('${bg.url}')`;
            } else {
                thumb.style.background = 'linear-gradient(45deg, #1e293b, #0f172a)';
                thumb.innerHTML = '<i class="fa-solid fa-ban" style="font-size: 12px; opacity: 0.5;"></i>';
            }
            
            if (!isUnlocked) {
                const lock = document.createElement('div');
                lock.className = 'lock-overlay';
                lock.innerHTML = `<i class="fa-solid fa-lock"></i><span style="font-size:10px; margin-top:4px;">Nvl ${bg.level}</span>`;
                thumb.appendChild(lock);
            } else {
                thumb.addEventListener('click', () => {
                    user.bgImage = bg.url;
                    localStorage.setItem('casino_user', JSON.stringify(user));
                    if (typeof UI !== 'undefined' && UI.applyGlobalBackground) {
                        UI.applyGlobalBackground();
                    }
                    updateProfileView();
                    Notifications.success("Fondo actualizado globalmente");
                });
            }
            
            elements.bgSelector.appendChild(thumb);
        });
    }

    // Modal view bg
    if (elements.btnViewBg) {
        elements.btnViewBg.addEventListener('click', () => {
            const user = getUserData();
            if (user && user.bgImage) {
                elements.fullBgImg.src = user.bgImage;
                elements.fullBgModal.showModal();
            } else {
                Notifications.info("No tienes un fondo seleccionado");
            }
        });
    }

    if (elements.fullBgModal) {
        elements.fullBgModal.addEventListener('click', (e) => {
            if (e.target === elements.fullBgModal) elements.fullBgModal.close();
        });
        const content = elements.fullBgModal.querySelector('.modal-content');
        if (content) {
            content.addEventListener('click', () => elements.fullBgModal.close());
        }
    }

    // Init
    updateProfileView();
    window.addEventListener('userBalanceChanged', updateProfileView);

    // Change avatar
    if (elements.avatar) {
        elements.avatar.addEventListener('click', () => {
            const newUrl = prompt("Introduce la URL de tu nueva imagen de avatar:");
            if (newUrl) {
                const user = getUserData();
                user.avatar = newUrl;
                saveUserData(user);
                updateProfileView();
                Notifications.success("Avatar actualizado");
            }
        });
    }

    // View Background
    if (elements.btnViewBg && elements.fullBgModal) {
        elements.btnViewBg.addEventListener('click', () => {
            const user = getUserData();
            if (user && user.bgImage) {
                elements.fullBgImg.src = user.bgImage;
            } else {
                elements.fullBgImg.src = '';
                elements.fullBgImg.style.background = 'var(--bg-card)';
            }
            elements.fullBgModal.showModal();
        });
        
        elements.fullBgModal.addEventListener('click', () => {
            elements.fullBgModal.close();
        });
    }

    if (elements.mobileBtn && elements.sidebar) {
        elements.mobileBtn.addEventListener('click', () => {
            elements.sidebar.classList.toggle('open');
        });
    }
});
