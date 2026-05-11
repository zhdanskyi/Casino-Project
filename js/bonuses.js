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

    function renderBonuses() {
        const container = document.getElementById('bonusContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const claimed = getClaimedBonuses();

        availableBonuses.forEach(bonus => {
            const isClaimed = claimed.includes(bonus.id);
            const canClaim = bonus.progress >= 100 && !isClaimed;
            
            const card = document.createElement('div');
            card.className = 'bonus-card fade-in';
            
            card.innerHTML = `
                <i class="fa-solid ${bonus.icon} bonus-icon"></i>
                <h3 class="bonus-title">${bonus.title}</h3>
                <p class="bonus-desc">${bonus.desc}</p>
                
                <div class="bonus-progress">
                    <div class="bonus-progress-label">
                        <span>Progreso</span>
                        <span>${bonus.progress}%</span>
                    </div>
                    <div class="level-bar-container">
                        <div class="level-bar" style="width: ${bonus.progress}%; ${bonus.progress < 100 ? 'background: #555; box-shadow: none;' : ''}"></div>
                    </div>
                </div>
                
                <button class="btn-primary w-100 claim-btn" data-id="${bonus.id}" ${!canClaim ? 'disabled' : ''} style="${!canClaim ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
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

    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
});
