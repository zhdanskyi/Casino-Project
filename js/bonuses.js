document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    Notifications.init();
    UI.init();

    // Default bonuses
    const availableBonuses = [
        {
            id: 'welcome_bonus',
            title: 'Bono de Bienvenida',
            desc: 'Reclama 50€ gratis por registrarte en CasinoHub hoy mismo. ¡Empieza a ganar!',
            icon: 'fa-handshake',
            amount: 50,
            progress: 100
        },
        {
            id: 'reload_bonus',
            title: 'Bono de Recarga Semanal',
            desc: 'Juega regularmente y obtén 20€ cada semana. Progreso actual de juego: 75%',
            icon: 'fa-bolt',
            amount: 20,
            progress: 75
        },
        {
            id: 'referral_bonus',
            title: 'Bono de Referidos',
            desc: 'Invita a un amigo y cuando se registre obtendrás 100€. 0/1 amigos invitados.',
            icon: 'fa-users',
            amount: 100,
            progress: 0
        }
    ];

    function getClaimedBonuses() {
        const claimed = localStorage.getItem('claimedBonuses');
        return claimed ? JSON.parse(claimed) : [];
    }

    function setBonusClaimed(id) {
        const claimed = getClaimedBonuses();
        if (!claimed.includes(id)) {
            claimed.push(id);
            localStorage.setItem('claimedBonuses', JSON.stringify(claimed));
        }
    }

    // --- LÓGICA DE CAJAS DIARIAS ---
    window.openDailyCase = function(day, element) {
        const user = typeof getUserData === 'function' ? getUserData() : null;
        if (!user) {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.showModal();
            return;
        }

        // Animación de temblor
        element.classList.add('shake');
        
        setTimeout(() => {
            element.classList.remove('shake');
            
            let prize = 0;
            const rand = Math.random() * 100;
            
            if (day === 7) {
                // Caja Legendaria (Día 7)
                if (rand < 5) prize = 100.00;
                else if (rand < 20) prize = 20.00;
                else if (rand < 50) prize = 10.00;
                else prize = 2.00 + (Math.random() * 3); // Entre 2 y 5 euros
            } else {
                // Cajas Normales (Día 1-6)
                if (rand < 1) prize = 100.00;
                else if (rand < 5) prize = 10.00 + (Math.random() * 10);
                else if (rand < 25) prize = 1.00 + (Math.random() * 2);
                else prize = 0.10 + (Math.random() * 0.40);
            }

            prize = parseFloat(prize.toFixed(2));
            
            // Actualizar saldo
            Storage.updateBalance(prize);
            
            if (typeof Notifications !== 'undefined') {
                Notifications.success(`¡Has abierto la caja del Día ${day} y ganado ${prize} EUR! 🎁`);
            }
            
            // Efecto visual de deshabilitar la caja (simulado)
            element.style.opacity = '0.5';
            element.style.pointerEvents = 'none';
            element.querySelector('.case-icon').className = 'fa-solid fa-box-open case-icon';
            
        }, 1000);
    };

    function renderBonuses() {
        const container = document.getElementById('bonusContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const claimed = getClaimedBonuses();

        availableBonuses.forEach((bonus, index) => {
            const isClaimed = claimed.includes(bonus.id);
            const canClaim = bonus.progress >= 100 && !isClaimed;
            
            // Determinar clase de acento
            let accentClass = 'bonus-welcome';
            if (index === 1) accentClass = 'bonus-reload';
            if (index === 2) accentClass = 'bonus-referral';

            const card = document.createElement('div');
            card.className = `modern-bonus-card ${accentClass} fade-in`;
            
            card.innerHTML = `
                <div class="bonus-header">
                    <div class="bonus-icon-wrapper">
                        <i class="fa-solid ${bonus.icon}"></i>
                    </div>
                    <div class="bonus-info">
                        <h3>${bonus.title}</h3>
                        <p>${bonus.desc}</p>
                    </div>
                </div>
                
                <div class="bonus-progress">
                    <div class="bonus-progress-label" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: #94a3b8;">
                        <span>Progreso</span>
                        <span>${bonus.progress}%</span>
                    </div>
                    <div class="level-bar-container" style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div class="level-bar" style="width: ${bonus.progress}%; height: 100%; transition: width 1s ease; ${accentClass === 'bonus-welcome' ? 'background: var(--cyan)' : accentClass === 'bonus-reload' ? 'background: var(--magenta)' : 'background: #10b981'}; box-shadow: 0 0 10px rgba(255,255,255,0.1);"></div>
                    </div>
                </div>
                
                <button class="btn-primary w-100 claim-btn" data-id="${bonus.id}" ${!canClaim ? 'disabled' : ''} style="margin-top: auto; ${!canClaim ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    ${isClaimed ? 'Reclamado' : (bonus.progress >= 100 ? 'Reclamar Bono' : 'Bloqueado')}
                </button>
            `;
            
            container.appendChild(card);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.claim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                claimBonus(id);
            });
        });
    }

    function claimBonus(id) {
        const bonus = availableBonuses.find(b => b.id === id);
        if (!bonus) return;
        
        const claimed = getClaimedBonuses();
        if (claimed.includes(id)) {
            return Notifications.error("Este bono ya ha sido reclamado.");
        }

        // Add funds
        Storage.updateBalance(bonus.amount);
        setBonusClaimed(id);
        
        Notifications.success(`¡Has reclamado ${bonus.amount} EUR con éxito!`);
        
        // Re-render
        renderBonuses();
    }

    renderBonuses();
});
