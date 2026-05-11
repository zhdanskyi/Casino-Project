document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    Notifications.init();
    UI.init();

    const elements = {
        betAmount: document.getElementById('betAmount'),
        btnPlay: document.getElementById('btnPlay'),
        btnCashout: document.getElementById('btnCashout'),
        status: document.getElementById('gameStatus'),
        grid: document.getElementById('minesGrid')
    };

    // Check VIP Access
    const user = typeof getUserData === 'function' ? getUserData() : Storage.getUser();
    if (!user || !user.isVIP) {
        alert("Acceso denegado: Necesitas Pase VIP para jugar Neon Mines.");
        window.location.href = '../index.html';
        return;
    }

    let isPlaying = false;
    let betValue = 0;
    let gridData = [];
    let revealedCount = 0;
    let totalMines = 3;
    let currentMultiplier = 1.0;

    function initGrid() {
        elements.grid.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const tile = document.createElement('div');
            tile.className = 'mine-tile';
            tile.dataset.index = i;
            tile.addEventListener('click', () => clickTile(i));
            elements.grid.appendChild(tile);
        }
    }
    initGrid();

    function startGame() {
        const amount = parseFloat(elements.betAmount.value);

        if (isNaN(amount) || amount <= 0) {
            return Notifications.error("Apuesta inválida");
        }
        
        const user = typeof getUserData === 'function' ? getUserData() : Storage.getUser();
        if (user.balance < amount) {
            return Notifications.error("Saldo insuficiente");
        }

        if (typeof updateBalance === 'function') {
            updateBalance(-amount);
        } else {
            Storage.updateBalance(-amount);
        }
        
        betValue = amount;
        isPlaying = true;
        revealedCount = 0;
        currentMultiplier = 1.0;

        elements.btnPlay.classList.add('hidden');
        elements.btnCashout.classList.remove('hidden');
        updateCashoutButton();
        elements.status.textContent = "Busca gemas, evita minas";
        elements.status.style.color = 'var(--cyan)';

        if (typeof updateGameStats === 'function') updateGameStats();

        // Distribute mines
        gridData = Array(25).fill('gem');
        let placedMines = 0;
        while (placedMines < totalMines) {
            const idx = Math.floor(Math.random() * 25);
            if (gridData[idx] !== 'bomb') {
                gridData[idx] = 'bomb';
                placedMines++;
            }
        }

        // Reset UI
        Array.from(elements.grid.children).forEach(tile => {
            tile.className = 'mine-tile';
            tile.innerHTML = '';
        });
    }

    function calculateMultiplier() {
        // Simple progressive multiplier based on revealed count and total mines
        const safeTiles = 25 - totalMines;
        // Formula to give progressive odds
        let odds = 1.0;
        for (let i = 0; i < revealedCount; i++) {
            odds *= (25 - i) / (safeTiles - i);
        }
        return odds * 0.95; // House edge
    }

    function clickTile(index) {
        if (!isPlaying) return;
        const tile = elements.grid.children[index];
        if (tile.classList.contains('revealed-gem') || tile.classList.contains('revealed-bomb')) return;

        if (gridData[index] === 'bomb') {
            // Lose
            tile.className = 'mine-tile revealed-bomb';
            tile.innerHTML = '💣';
            endGame(false);
        } else {
            // Safe
            tile.className = 'mine-tile revealed-gem';
            tile.innerHTML = '💎';
            revealedCount++;
            
            currentMultiplier = calculateMultiplier();
            updateCashoutButton();

            if (revealedCount === 25 - totalMines) {
                // Found all gems
                cashout();
            }
        }
    }

    function updateCashoutButton() {
        if (revealedCount === 0) {
            elements.btnCashout.textContent = "Retirar (0.00)";
        } else {
            elements.btnCashout.textContent = `Retirar ${(betValue * currentMultiplier).toFixed(2)}`;
        }
    }

    function endGame(won) {
        isPlaying = false;
        elements.btnPlay.classList.remove('hidden');
        elements.btnCashout.classList.add('hidden');

        // Reveal all
        Array.from(elements.grid.children).forEach((tile, idx) => {
            if (!tile.classList.contains('revealed-gem') && !tile.classList.contains('revealed-bomb')) {
                if (gridData[idx] === 'bomb') {
                    tile.innerHTML = '💣';
                    tile.style.opacity = '0.5';
                } else {
                    tile.innerHTML = '💎';
                    tile.style.opacity = '0.5';
                }
            }
        });

        if (!won) {
            elements.status.textContent = "¡BOOM! Has perdido.";
            elements.status.style.color = '#ff3333';
            Notifications.error("Has pisado una mina.");
        }
    }

    function cashout() {
        if (!isPlaying || revealedCount === 0) return;
        const win = betValue * currentMultiplier;
        
        if (typeof updateBalance === 'function') {
            updateBalance(win, false);
        } else {
            Storage.updateBalance(win);
        }
        
        elements.status.textContent = `¡Retirado con éxito: ${win.toFixed(2)} EUR!`;
        elements.status.style.color = '#00ff00';
        Notifications.success(`¡Retiro exitoso a ${currentMultiplier.toFixed(2)}x!`);
        
        endGame(true);
    }

    elements.btnPlay.addEventListener('click', startGame);
    elements.btnCashout.addEventListener('click', cashout);
});
