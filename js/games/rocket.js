document.addEventListener('DOMContentLoaded', () => {
    if (typeof UI !== 'undefined') UI.init();
    if (typeof Notifications !== 'undefined') Notifications.init();

    const elements = {
        betAmount: document.getElementById('betAmount'),
        btnBet: document.getElementById('btnBet'),
        btnCashout: document.getElementById('btnCashout'),
        multiplier: document.getElementById('multiplierDisplay'),
        status: document.getElementById('gameStatus'),
        rocket: document.getElementById('rocket'),
        explosion: document.getElementById('explosion'),
        history: document.getElementById('crashHistory')
    };

    let gameState = 'IDLE'; // IDLE, FLYING, CRASHED, CASHOUT
    let currentMultiplier = 1.00;
    let crashPoint = 0;
    let betValue = 0;
    let loopId = null;
    let historyData = [1.2, 5.4, 1.0, 2.1, 10.5, 1.4];

    function updateHistoryUI() {
        elements.history.innerHTML = '';
        historyData.forEach(m => {
            const badge = document.createElement('span');
            let colorClass = 'low';
            if (m >= 2.0 && m < 5.0) colorClass = 'medium';
            if (m >= 5.0) colorClass = 'high';
            
            badge.className = `history-badge ${colorClass}`;
            if (colorClass === 'medium') badge.style.color = '#eab308';
            if (colorClass === 'medium') badge.style.backgroundColor = 'rgba(234,179,8,0.2)';
            
            badge.textContent = `${m.toFixed(2)}x`;
            elements.history.appendChild(badge);
        });
    }
    updateHistoryUI();

    function generateRealisticCrash() {
        const r = Math.random();
        if (r < 0.05) return 1.00 + Math.random() * 0.50; // 5% chance to crash before 1.5x
        if (r < 0.20) return 1.50 + Math.random() * 0.50; // 15% chance to crash between 1.5x and 2.0x
        if (r < 0.85) return 2.00 + Math.random() * 8.00; // 65% chance to crash between 2.0x and 10.0x
        return 10.00 + Math.random() * 40.00;             // 15% chance to crash beyond 10.0x (up to 50x)
    }

    function startGame() {
        if (gameState !== 'IDLE') return;
        if (!elements.betAmount) return;

        const amount = parseFloat(elements.betAmount.value);
        if (isNaN(amount) || amount <= 0) {
            return Notifications.error("Apuesta inválida");
        }
        
        const user = getUserData();
        if (!user) {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.showModal();
            return Notifications.error("Debes iniciar sesión para apostar.");
        }
        
        if (user.balance < amount) {
            return Notifications.error("Saldo insuficiente");
        }

        // Deduct bet
        updateBalance(-amount);
        betValue = amount;

        // Visual button transition
        elements.btnBet.style.opacity = '0';
        setTimeout(() => {
            elements.btnBet.classList.add('hidden');
            elements.btnCashout.classList.remove('hidden');
            elements.btnCashout.style.opacity = '0';
            elements.btnCashout.textContent = `Retirar`;
            setTimeout(() => {
                elements.btnCashout.style.opacity = '1';
                elements.btnCashout.classList.add('pulse-glow'); // add a pulse class in css
            }, 50);
        }, 300);

        gameState = 'FLYING';
        crashPoint = generateRealisticCrash();
        currentMultiplier = 1.00;
        
        elements.multiplier.classList.remove('crashed');
        elements.status.textContent = "¡Vuelo en curso!";
        elements.status.style.color = 'var(--cyan)';
        
        elements.rocket.classList.add('flying');
        elements.rocket.style.filter = 'drop-shadow(0 0 10px var(--cyan)) blur(0px)';
        elements.explosion.classList.add('hidden');
        elements.rocket.style.transform = `translateY(0px)`;

        // Update total games stats
        if (typeof updateGameStats === 'function') updateGameStats();

        let startTime = Date.now();
        let lastTime = startTime;
        
        function tick() {
            if (gameState !== 'FLYING') return;

            const now = Date.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            
            // Progressive multiplier logic
            let growthRate = 0.1; // slow initially
            if (currentMultiplier >= 2.0) growthRate = 0.6; // medium speed
            if (currentMultiplier >= 5.0) growthRate = 2.0; // fast speed
            if (currentMultiplier >= 10.0) growthRate = 5.0; // extreme speed
            
            currentMultiplier += growthRate * dt;

            if (currentMultiplier >= crashPoint) {
                crashGame();
                return;
            }

            elements.multiplier.textContent = `${currentMultiplier.toFixed(2)}x`;
            
            // Visual animations (shake, blur)
            const visualY = Math.min(200, currentMultiplier * 10);
            let shakeX = 0;
            if (currentMultiplier > 2.0) {
                shakeX = (Math.random() - 0.5) * (currentMultiplier / 2);
                document.querySelector('.rocket-view').style.transform = `translate(${(Math.random()-0.5)*2}px, ${(Math.random()-0.5)*2}px)`;
            }
            if (currentMultiplier > 5.0) {
                elements.rocket.style.filter = `drop-shadow(0 0 20px var(--cyan)) blur(${Math.min(3, currentMultiplier/4)}px)`;
            }
            
            elements.rocket.style.transform = `translate(${shakeX}px, -${visualY}px)`;
            elements.btnCashout.textContent = `Retirar ${(betValue * currentMultiplier).toFixed(2)}`;

            loopId = requestAnimationFrame(tick);
        }

        if (loopId) cancelAnimationFrame(loopId);
        loopId = requestAnimationFrame(tick);
    }

    function cashout() {
        if (gameState !== 'FLYING') return;
        
        gameState = 'CASHOUT';
        const winAmount = betValue * currentMultiplier;
        updateBalance(winAmount, false);
        
        if (typeof Formatter !== 'undefined') {
            Notifications.success(`¡Retirado a ${currentMultiplier.toFixed(2)}x! +${Formatter.number(winAmount)} EUR`);
        }
        
        elements.btnCashout.classList.remove('pulse-glow');
        elements.btnCashout.style.opacity = '0';
        setTimeout(() => {
            elements.btnCashout.classList.add('hidden');
        }, 300);

        elements.status.textContent = "¡Retirado con éxito!";
        elements.status.style.color = '#00ff00';
    }

    function crashGame() {
        gameState = 'CRASHED';
        cancelAnimationFrame(loopId);
        document.querySelector('.rocket-view').style.transform = 'translate(0,0)'; // reset camera shake
        
        currentMultiplier = crashPoint;
        elements.multiplier.textContent = `${currentMultiplier.toFixed(2)}x`;
        elements.multiplier.classList.add('crashed');
        
        elements.status.textContent = "¡EXPLOSIÓN!";
        elements.status.style.color = '#ff3333';
        
        elements.rocket.classList.remove('flying');
        
        // Show explosion at rocket's last pos
        const transform = elements.rocket.style.transform;
        elements.rocket.style.transform = `scale(0)`; // hide rocket
        elements.explosion.style.transform = transform;
        elements.explosion.classList.remove('hidden');
        
        // Explosion shake
        const container = document.querySelector('.rocket-view');
        container.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
        setTimeout(() => container.style.animation = '', 500);

        if (!elements.btnCashout.classList.contains('hidden')) {
            elements.btnCashout.classList.remove('pulse-glow');
            elements.btnCashout.style.opacity = '0';
            setTimeout(() => elements.btnCashout.classList.add('hidden'), 300);
            Notifications.error("El cohete explotó. Has perdido.");
        }

        // Restore Bet Button
        setTimeout(() => {
            elements.btnBet.classList.remove('hidden');
            setTimeout(() => elements.btnBet.style.opacity = '1', 50);
        }, 300);

        // Add to history
        historyData.unshift(crashPoint);
        if (historyData.length > 10) historyData.pop();
        updateHistoryUI();

        // Reset visual after 3 seconds
        setTimeout(() => {
            if (gameState === 'CRASHED' || gameState === 'CASHOUT') {
                gameState = 'IDLE';
                elements.rocket.style.transform = `scale(1)`;
                elements.rocket.style.filter = 'drop-shadow(0 0 10px var(--cyan)) blur(0px)';
                elements.explosion.classList.add('hidden');
                elements.status.textContent = "Esperando apuesta...";
                elements.status.style.color = 'var(--magenta)';
            }
        }, 3000);
    }

    // Assign events safely
    if (elements.btnBet) elements.btnBet.addEventListener('click', startGame);
    if (elements.btnCashout) elements.btnCashout.addEventListener('click', cashout);

    // Quick bets
    const btnHalf = document.getElementById('btnHalfBet');
    if (btnHalf) {
        btnHalf.addEventListener('click', () => {
            if (elements.betAmount) elements.betAmount.value = (parseFloat(elements.betAmount.value) / 2).toFixed(2);
        });
    }
    
    const btnDouble = document.getElementById('btnDoubleBet');
    if (btnDouble) {
        btnDouble.addEventListener('click', () => {
            if (elements.betAmount) elements.betAmount.value = (parseFloat(elements.betAmount.value) * 2).toFixed(2);
        });
    }

    const btnMax = document.getElementById('btnMaxBet');
    if (btnMax) {
        btnMax.addEventListener('click', () => {
            const user = getUserData();
            if (user && elements.betAmount) {
                elements.betAmount.value = user.balance.toFixed(2);
            } else if (!user) {
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.showModal();
                if (typeof Notifications !== 'undefined') Notifications.error("Debes iniciar sesión para apostar.");
            }
        });
    }
});
