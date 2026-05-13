/*
  Aviator game logic:
  - Inicializa la interfaz y notificaciones.
  - Controla el vuelo de un avión que evita bombas y aterriza en islas.
  - Maneja apuestas, ganancias y detección de colisiones.
*/
document.addEventListener("DOMContentLoaded", () => {
  if (typeof UI !== "undefined") UI.init();
  if (typeof Notifications !== "undefined") Notifications.init();

  const elements = {
    betAmount: document.getElementById("betAmount"),
    btnBet: document.getElementById("btnBet"),
    status: document.getElementById("gameStatus"),
    multiplier: document.getElementById("multiplierDisplay"),
    plane: document.getElementById("plane"),
    container: document.querySelector(".aviator-view"),
    islandContainer: document.getElementById("islandContainer"),
    countdown: document.getElementById("countdownOverlay"),
  };

  // Estado del juego y valores de apuesta
  let gameState = "IDLE";
  let betValue = 0;
  let winAmount = 0;
  let loopId = null;
  let spawnInterval = null;
  let distanceTraveled = 0;

  // Physics
  let planeY = 60;
  let velocity = 0;
  const gravity = 0.15;
  const lift = -3.5;

  // Objects
  let gameObjects = [];
  let lastSpawnY = 50;

  // Inicia una nueva partida: valida la apuesta, descuenta saldo, resetea estado y comienza la cuenta regresiva.
  function startGame() {
    if (gameState !== "IDLE") return;

    const amount = parseFloat(elements.betAmount.value);
    if (isNaN(amount) || amount <= 0)
      return Notifications.error("Apuesta inválida");

    const user = typeof getUserData !== "undefined" ? getUserData() : null;
    if (!user) {
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.showModal();
      return typeof Notifications !== "undefined"
        ? Notifications.error("Debes iniciar sesiÃ³n para jugar.")
        : null;
    }
    if (user.balance < amount) return Notifications.error("Saldo insuficiente");

    updateBalance(-amount);
    betValue = amount;
    winAmount = amount;
    distanceTraveled = 0;

    gameState = "COUNTDOWN";
    elements.btnBet.classList.add("hidden");
    elements.status.textContent = "Preparando...";
    elements.multiplier.textContent = `${Formatter.number(winAmount)} EUR`;

    elements.plane.classList.remove("crashed-plane");
    elements.islandContainer.innerHTML = "";
    gameObjects = [];

    planeY = 60;
    velocity = 0;
    elements.plane.style.bottom = `${planeY}%`;
    elements.plane.style.transform = `rotate(0deg)`;

    if (typeof updateGameStats === "function") updateGameStats();

    // COUNTDOWN
    let count = 3;
    elements.countdown.style.display = "block";
    elements.countdown.textContent = count;
    elements.countdown.classList.add("pulse-glow");

    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        elements.countdown.textContent = count;
      } else if (count === 0) {
        elements.countdown.textContent = "GO!";
        elements.countdown.style.color = "#00ff00";
      } else {
        clearInterval(countInterval);
        elements.countdown.style.display = "none";
        elements.countdown.style.color = "#fff";
        elements.countdown.classList.remove("pulse-glow");
        startFlight();
      }
    }, 1000);
  }

  // Comienza el vuelo del avión: inicia el bucle de spawn de objetos y la simulación de física.
  function startFlight() {
    gameState = "FLYING";
    elements.status.textContent = "¡Volando!";

    // Dynamic spawn interval based on distance
    function spawnLoop() {
      if (gameState !== "FLYING") return;
      spawnObject();
      const nextSpawn = Math.max(1200, 2500 - distanceTraveled / 10);
      spawnInterval = setTimeout(spawnLoop, nextSpawn);
    }
    spawnLoop();

    function tick() {
      if (gameState !== "FLYING") return;

      distanceTraveled++;

      // Physics
      velocity += gravity;
      planeY -= velocity * 0.5;

      // Limits
      if (planeY > 92) {
        planeY = 92;
        velocity = 0;
      }

      elements.plane.style.bottom = `${planeY}%`;

      let rotation = velocity * 4;
      rotation = Math.max(-25, Math.min(50, rotation));
      elements.plane.style.transform = `rotate(${rotation}deg)`;

      // Check water collision (Lowered limit for realism)
      if (planeY <= 15) {
        loseGame("Caíste al agua");
        return;
      }

      checkCollisions();
      loopId = requestAnimationFrame(tick);
    }
    loopId = requestAnimationFrame(tick);
  }

  function flap() {
    if (gameState !== "FLYING") return;
    velocity = lift;
  }

  elements.container.addEventListener("mousedown", flap);
  elements.container.addEventListener("touchstart", (e) => {
    e.preventDefault();
    flap();
  });

  function spawnObject() {
    if (gameState !== "FLYING") return;

    const obj = document.createElement("div");
    obj.className = "game-obj";

    let type = "cloud";
    let isIsland = false;

    // Probability shifts as distance increases (Saturación Progresiva)
    const bombChance = Math.min(0.4, 0.1 + distanceTraveled / 1000);
    const islandChance = Math.max(0.05, 0.2 - distanceTraveled / 2000);

    const r = Math.random();

    if (r < islandChance) {
      isIsland = true;
      type = "island";
      obj.className = "island";
      obj.style.bottom = "10%"; // Anchored to bottom sea area
    } else {
      obj.className = "cloud";
      // Smart placement: avoid same Y as last spawn
      let targetY;
      do {
        targetY = 25 + Math.random() * 60;
      } while (Math.abs(targetY - lastSpawnY) < 15);
      lastSpawnY = targetY;

      obj.style.bottom = `${targetY}%`;
      obj.style.width = "80px";
      obj.style.height = "60px";

      const r2 = Math.random();
      if (r2 < bombChance) {
        type = "bomb";
        obj.innerHTML = "💣";
        obj.style.fontSize = "32px";
      } else if (r2 < 0.6) {
        type = "multiplier";
        const mult = (1.1 + Math.random() * 1.5).toFixed(1);
        obj.innerHTML = `<span style="color:#d97706; font-weight:900;">${mult}x</span>`;
        obj.dataset.val = mult;
      } else {
        type = "money";
        obj.innerHTML = "💎";
      }
    }

    obj.style.position = "absolute";
    obj.style.left = `${window.innerWidth + 100}px`;
    elements.islandContainer.appendChild(obj);

    gameObjects.push({
      el: obj,
      type: type,
      x: window.innerWidth + 100,
      isIsland,
    });
  }

  function checkCollisions() {
    const planeRect = elements.plane.getBoundingClientRect();
    const scrollSpeed = 4 + distanceTraveled / 500; // Speed increases

    for (let i = gameObjects.length - 1; i >= 0; i--) {
      const objData = gameObjects[i];
      const objRect = objData.el.getBoundingClientRect();

      objData.x -= scrollSpeed;
      objData.el.style.left = `${objData.x}px`;

      if (objData.x < -300) {
        if (objData.el.parentNode)
          objData.el.parentNode.removeChild(objData.el);
        gameObjects.splice(i, 1);
        continue;
      }

      // Refined Hitbox
      const pHit = {
        left: planeRect.left + 20,
        right: planeRect.right - 20,
        top: planeRect.top + 15,
        bottom: planeRect.bottom - 10,
      };

      if (
        pHit.left < objRect.right &&
        pHit.right > objRect.left &&
        pHit.top < objRect.bottom &&
        pHit.bottom > objRect.top
      ) {
        handleCollision(objData, pHit, objRect);

        if (objData.type !== "island") {
          if (objData.el.parentNode)
            objData.el.parentNode.removeChild(objData.el);
          gameObjects.splice(i, 1);
        }
      }
    }
  }

  function handleCollision(objData, pHit, objRect) {
    if (objData.type === "bomb") {
      winAmount *= 0.6;
      Notifications.warning("¡Bomba! -40% ganancias");
      elements.multiplier.textContent = `${Formatter.number(winAmount)} EUR`;
      elements.container.style.animation = "shake 0.4s";
      setTimeout(() => (elements.container.style.animation = ""), 400);
    } else if (objData.type === "multiplier") {
      const mult = parseFloat(objData.el.dataset.val);
      winAmount *= mult;
      Notifications.success(`Bonus ${mult}x!`);
      elements.multiplier.textContent = `${Formatter.number(winAmount)} EUR`;
    } else if (objData.type === "money") {
      const bonus = betValue * 0.25;
      winAmount += bonus;
      Notifications.success(`¡Diamante +${Formatter.number(bonus)} EUR!`);
      elements.multiplier.textContent = `${Formatter.number(winAmount)} EUR`;
    } else if (objData.type === "island") {
      // Generous landing hitbox: if plane bottom is near island top
      if (velocity > 0 && pHit.bottom <= objRect.top + 45) {
        winGame();
      } else {
        loseGame("Colisión con tierra");
      }
    }
  }

  function winGame() {
    gameState = "IDLE";
    cancelAnimationFrame(loopId);
    clearTimeout(spawnInterval);

    updateBalance(winAmount, false);
    Notifications.success(
      `¡Aterrizaje Perfecto! +${Formatter.number(winAmount)} EUR`,
    );
    elements.status.textContent = "Misión cumplida";
    elements.status.style.color = "#00ff00";
    endRound();
  }

  function loseGame(reason) {
    gameState = "CRASHED";
    cancelAnimationFrame(loopId);
    clearTimeout(spawnInterval);

    Notifications.error(`${reason}.`);
    elements.status.textContent = "¡MAYDAY!";
    elements.status.style.color = "#ff3333";
    elements.plane.classList.add("crashed-plane");

    setTimeout(endRound, 2500);
  }

  function endRound() {
    gameState = "IDLE";
    elements.btnBet.classList.remove("hidden");
  }

  if (elements.btnBet) elements.btnBet.addEventListener("click", startGame);

  // Bet controls
  const updateBet = (val) => {
    if (elements.betAmount) elements.betAmount.value = val.toFixed(2);
  };
  document
    .getElementById("btnHalfBet")
    ?.addEventListener("click", () =>
      updateBet(parseFloat(elements.betAmount.value) / 2),
    );
  document
    .getElementById("btnDoubleBet")
    ?.addEventListener("click", () =>
      updateBet(parseFloat(elements.betAmount.value) * 2),
    );
  document.getElementById("btnMaxBet")?.addEventListener("click", () => {
    const user = typeof getUserData !== "undefined" ? getUserData() : null;
    if (user) updateBet(user.balance);
    else if (!user) {
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.showModal();
      if (typeof Notifications !== "undefined")
        Notifications.error("Debes iniciar sesiÃ³n para apostar.");
    } else if (!user) {
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.showModal();
      if (typeof Notifications !== "undefined")
        Notifications.error("Debes iniciar sesiÃ³n para apostar.");
    }
  });
});
