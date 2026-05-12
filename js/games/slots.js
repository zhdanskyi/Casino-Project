document.addEventListener('DOMContentLoaded', () => {
    if (typeof UI !== 'undefined') UI.init();
    if (typeof Notifications !== 'undefined') Notifications.init();

    const symbols = ['🍒', '🍋', '🍉', '7️⃣', '💎', '👑'];
    const multipliers = {
        '🍒': 2, '🍋': 5, '🍉': 10, '7️⃣': 25, '💎': 50, '👑': 100
    };

    const elements = {
        betAmount: document.getElementById('betAmount'),
        status: document.getElementById('slotStatus'),
        lever: document.getElementById('lever'),
        leverArm: document.getElementById('leverArm'),
        inners: [
            document.getElementById('inner1'),
            document.getElementById('inner2'),
            document.getElementById('inner3')
        ],
        reels: [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ],
        jackpotMini: document.getElementById('jackpotMini'),
        jackpotMinor: document.getElementById('jackpotMinor'),
        jackpotMega: document.getElementById('jackpotMega'),
        jackpotUltra: document.getElementById('jackpotUltra')
    };

    let isSpinning = false;
    let jackpots = { mini: 10.00, minor: 50.00, mega: 200.00, ultra: 1000.00 };

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = (progress * (end - start)) + start;
            obj.textContent = `${current.toFixed(2)} €`;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function updateJackpotsUI(animate = false, oldJackpots = null) {
        if (!animate) {
            if (elements.jackpotMini) elements.jackpotMini.textContent = `${jackpots.mini.toFixed(2)} €`;
            if (elements.jackpotMinor) elements.jackpotMinor.textContent = `${jackpots.minor.toFixed(2)} €`;
            if (elements.jackpotMega) elements.jackpotMega.textContent = `${jackpots.mega.toFixed(2)} €`;
            if (elements.jackpotUltra) elements.jackpotUltra.textContent = `${jackpots.ultra.toFixed(2)} €`;
        } else {
            if (elements.jackpotMini && oldJackpots) animateValue(elements.jackpotMini, oldJackpots.mini, jackpots.mini, 500);
            if (elements.jackpotMinor && oldJackpots) animateValue(elements.jackpotMinor, oldJackpots.minor, jackpots.minor, 500);
            if (elements.jackpotMega && oldJackpots) animateValue(elements.jackpotMega, oldJackpots.mega, jackpots.mega, 500);
            if (elements.jackpotUltra && oldJackpots) animateValue(elements.jackpotUltra, oldJackpots.ultra, jackpots.ultra, 500);
        }
    }
    updateJackpotsUI();

    function initReels() {
        elements.inners.forEach(inner => {
            inner.innerHTML = '';
            for (let i = 0; i < 40; i++) {
                const sym = document.createElement('div');
                sym.className = 'slot-symbol';
                sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                inner.appendChild(sym);
            }
            inner.style.transform = `translateY(0px)`;
        });
    }
    initReels();

    function triggerWinEffects(isJackpot = false) {
        const wrapper = document.querySelector('.slot-machine-wrapper');
        const body = document.querySelector('.slot-machine-body');

        // Screen Shake
        wrapper.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
        setTimeout(() => wrapper.style.animation = '', 500);

        // Flash Effect
        body.style.boxShadow = `0 0 100px ${isJackpot ? 'var(--magenta)' : 'var(--cyan)'}`;
        setTimeout(() => body.style.boxShadow = '', 1000);

        // LED Flash Sequence
        const bulbs = document.querySelectorAll('.led-bulb');
        bulbs.forEach((bulb, i) => {
            bulb.style.animation = `led-blink 0.1s infinite ${i * 0.05}s`;
            setTimeout(() => {
                bulb.style.animation = '';
            }, 2000);
        });
    }

    async function spin() {
        if (isSpinning) return;

        const amount = parseFloat(elements.betAmount.value);
        if (isNaN(amount) || amount <= 0) return Notifications.error("Apuesta inválida");

        const user = typeof getUserData !== 'undefined' ? getUserData() : null;
        if (!user) {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.showModal();
            return typeof Notifications !== 'undefined' ? Notifications.error("Debes iniciar sesiÃ³n para jugar.") : null;
        }
        if (user.balance < amount) return Notifications.error("Saldo insuficiente");

        updateBalance(-amount);
        isSpinning = true;
        elements.status.textContent = "¡BUENA SUERTE!";
        elements.status.style.color = '#fff';

        // Animate lever with vibration and snappy rebound
        if (elements.lever) {
            elements.lever.classList.add('lever-pulled');
            if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

            setTimeout(() => {
                elements.lever.classList.remove('lever-pulled');
            }, 600);
        }

        // Increase jackpots
        const oldJackpots = { ...jackpots };
        jackpots.mini += amount * 0.01;
        jackpots.minor += amount * 0.02;
        jackpots.mega += amount * 0.05;
        jackpots.ultra += amount * 0.10;
        updateJackpotsUI(true, oldJackpots);

        elements.reels.forEach(r => r.classList.remove('win'));
        if (typeof updateGameStats === 'function') updateGameStats();

        const resultIndices = [
            Math.floor(Math.random() * symbols.length),
            Math.floor(Math.random() * symbols.length),
            Math.floor(Math.random() * symbols.length)
        ];

        // Random outcome logic with jackpot bias
        const luck = Math.random();
        if (luck > 0.98) { // Huge win (Jackpot)
            const w = Math.floor(Math.random() * symbols.length);
            resultIndices.fill(w);
        } else if (luck > 0.85) { // Medium win
            const w = Math.floor(Math.random() * symbols.length);
            resultIndices[0] = w;
            resultIndices[1] = w;
        }

        const promises = elements.inners.map((inner, index) => {
            return new Promise(resolve => {
                const targetSymbol = symbols[resultIndices[index]];
                inner.innerHTML = '';

                // Physical cylinder feel: many symbols
                const symbolCount = 50 + (index * 20);
                for (let i = 0; i < symbolCount; i++) {
                    const sym = document.createElement('div');
                    sym.className = 'slot-symbol';
                    sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                    inner.appendChild(sym);
                }

                const finalSym = document.createElement('div');
                finalSym.className = 'slot-symbol';
                finalSym.textContent = targetSymbol;
                inner.appendChild(finalSym);

                inner.style.transition = 'none';
                inner.style.transform = 'translateY(0px)';
                inner.offsetHeight; // force reflow

                elements.reels[index].classList.add('spinning');

                // Explicit Top-to-Bottom spin: Strip moves UP, symbols appear to fall DOWN
                const duration = 3 + index * 0.5;
                // Cubic-bezier for a strong mechanical "stop" at the bottom
                inner.style.transition = `transform ${duration}s cubic-bezier(0.15, 0, 0.15, 1)`;
                const targetY = -(inner.children.length - 1) * 200; 
                inner.style.transform = `translateY(${targetY}px)`;

                setTimeout(() => {
                    elements.reels[index].classList.remove('spinning');
                    if (navigator.vibrate) navigator.vibrate(20); // Small thud
                    resolve(targetSymbol);
                }, duration * 1000);
            });
        });

        const results = await Promise.all(promises);

        let win = 0;
        let isJackpot = false;
        let winningPlate = null;

        if (results[0] === results[1] && results[1] === results[2]) {
            const sym = results[0];
            win = amount * multipliers[sym];
            elements.reels.forEach(r => r.classList.add('win'));

            if (sym === '👑') {
                win += jackpots.ultra; jackpots.ultra = 1000.00; isJackpot = true; winningPlate = 'plateUltra';
            } else if (sym === '💎') {
                win += jackpots.mega; jackpots.mega = 200.00; isJackpot = true; winningPlate = 'plateMega';
            } else if (sym === '7️⃣') {
                win += jackpots.minor; jackpots.minor = 50.00; isJackpot = true; winningPlate = 'plateMinor';
            } else if (sym === '🍉') {
                win += jackpots.mini; jackpots.mini = 10.00; isJackpot = true; winningPlate = 'plateMini';
            }
        } else if (results[0] === results[1]) {
            win = amount * (multipliers[results[0]] * 0.2);
            elements.reels[0].classList.add('win');
            elements.reels[1].classList.add('win');
        }

        if (win > 0) {
            updateBalance(win, false);
            updateJackpotsUI();

            // Visual feedback
            const wrapper = document.querySelector('.slot-machine-wrapper');
            wrapper.classList.add('win-flash');
            wrapper.style.animation = 'shake 0.5s ease-in-out';

            setTimeout(() => {
                wrapper.style.animation = '';
                wrapper.classList.remove('win-flash');
            }, 2000);

            elements.status.textContent = `+${Formatter.number(win)} EUR`;
            elements.status.style.color = 'var(--cyan)';

            triggerWinEffects(isJackpot);

            if (winningPlate) {
                const plate = document.getElementById(winningPlate);
                plate.classList.add('win-flash');
                setTimeout(() => plate.classList.remove('win-flash'), 2000);
            }

            if (isJackpot) {
                Notifications.success(`¡JACKPOT! +${Formatter.number(win)} EUR`);
            } else {
                Notifications.success(`¡GANASTE! +${Formatter.number(win)} EUR`);
            }
        } else {
            elements.status.textContent = "SUERTE LA PRÓXIMA";
            elements.status.style.color = '#94a3b8';
        }

        isSpinning = false;
    }

    if (elements.lever) elements.lever.addEventListener('click', () => { if (!isSpinning) spin(); });
});


