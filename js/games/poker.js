/*
  Poker game logic:
  - Genera una baraja aleatoria, reparte cartas y simula una mano básica de Texas Hold'em.
  - Evalúa combinaciones simples y gestiona acciones de apuesta, pasar, subir y retirarse.
*/
document.addEventListener("DOMContentLoaded", () => {
  if (typeof UI !== "undefined") UI.init();
  if (typeof Notifications !== "undefined") Notifications.init();

  const elements = {
    betAmount: document.getElementById("betAmount"),
    btnDeal: document.getElementById("btnDeal"),
    btnFold: document.getElementById("btnFold"),
    btnCall: document.getElementById("btnCall"),
    btnRaise: document.getElementById("btnRaise"),
    dealerCards: document.getElementById("dealerCards"),
    playerCards: document.getElementById("playerCards"),
    communityCards: document.getElementById("communityCards"),
    potChips: document.getElementById("potChips"),
    potAmountText: document.getElementById("potAmountText"),
    status: document.getElementById("pokerStatus"),
    actions: document.getElementById("pokerActions"),
  };

  const suits = ["♠", "♥", "♦", "♣"];
  const values = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  let deck = [];
  let currentBet = 0;
  let pot = 0;
  let playerHand = [];
  let dealerHand = [];
  let communityHand = [];
  let phase = 0; // 0=Idle, 1=Pre-Flop, 2=Flop, 3=Turn, 4=River

  // Genera la baraja completa de 52 cartas y la mezcla aleatoriamente.
  function generateDeck() {
    deck = [];
    for (let suit of suits) {
      for (let val of values) {
        deck.push({ val, suit });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  function createCardElement(card, hidden = false) {
    const el = document.createElement("div");
    if (hidden) {
      el.className = "playing-card card-back";
    } else {
      const isRed = card.suit === "♥" || card.suit === "♦";
      el.className = `playing-card ${isRed ? "red" : ""}`;
      el.innerHTML = `
                <div>${card.val} ${card.suit}</div>
                <div class="card-center">${card.suit}</div>
                <div class="card-bottom-right">${card.val} ${card.suit}</div>
            `;
    }
    return el;
  }

  function addChipsToPot(amount) {
    pot += amount;
    elements.potAmountText.textContent = `Bote: ${pot}€`;

    // Add visual chips
    const chipCount = Math.min(20, Math.ceil(amount / 5));
    for (let i = 0; i < chipCount; i++) {
      const chip = document.createElement("div");
      chip.className = "poker-chip";
      chip.style.transform = `translate(${(Math.random() - 0.5) * 20}px, ${(Math.random() - 0.5) * 20}px)`;
      elements.potChips.appendChild(chip);
    }
  }

  function getCardValue(val) {
    if (val === "A") return 14;
    if (val === "K") return 13;
    if (val === "Q") return 12;
    if (val === "J") return 11;
    return parseInt(val);
  }

  // Very basic evaluation: High card / Pair / Three of a kind in 7 cards
  function evaluateHand(holeCards, commCards) {
    const allCards = [...holeCards, ...commCards];
    const counts = {};
    allCards.forEach((c) => {
      counts[c.val] = (counts[c.val] || 0) + 1;
    });

    let score = 0;
    let maxCount = 0;

    for (let val in counts) {
      if (counts[val] > maxCount) {
        maxCount = counts[val];
      }
    }

    // Base max card score
    let highCard = 0;
    allCards.forEach((c) => {
      if (getCardValue(c.val) > highCard) highCard = getCardValue(c.val);
    });

    if (maxCount === 4) score = 400 + highCard;
    else if (maxCount === 3) score = 300 + highCard;
    else if (maxCount === 2) score = 200 + highCard;
    else score = highCard;

    return score;
  }

  // Realiza la apuesta inicial, reparte mano del jugador y dealer, y pasa al pre-flop.
  function deal() {
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
    currentBet = amount;
    pot = 0;
    elements.potChips.innerHTML = "";
    addChipsToPot(amount); // Player bet
    addChipsToPot(amount); // Dealer match

    generateDeck();

    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    communityHand = [];

    elements.communityCards.innerHTML = "";
    elements.playerCards.innerHTML = "";
    elements.dealerCards.innerHTML = "";

    elements.playerCards.appendChild(createCardElement(playerHand[0]));
    elements.playerCards.appendChild(createCardElement(playerHand[1]));

    elements.dealerCards.appendChild(createCardElement(dealerHand[0], true));
    elements.dealerCards.appendChild(createCardElement(dealerHand[1], true));

    phase = 1; // Pre-Flop
    elements.status.textContent = "Pre-Flop: ¿Pasar o Subir?";
    elements.btnDeal.disabled = true;
    elements.actions.style.display = "flex";

    if (typeof updateGameStats === "function") updateGameStats();
  }

  function nextPhase() {
    if (phase === 1) {
      // Flop
      phase = 2;
      communityHand.push(deck.pop(), deck.pop(), deck.pop());
      elements.communityCards.appendChild(createCardElement(communityHand[0]));
      elements.communityCards.appendChild(createCardElement(communityHand[1]));
      elements.communityCards.appendChild(createCardElement(communityHand[2]));
      elements.status.textContent = "Flop: ¿Pasar o Subir?";
    } else if (phase === 2) {
      // Turn
      phase = 3;
      communityHand.push(deck.pop());
      elements.communityCards.appendChild(createCardElement(communityHand[3]));
      elements.status.textContent = "Turn: ¿Pasar o Subir?";
    } else if (phase === 3) {
      // River
      phase = 4;
      communityHand.push(deck.pop());
      elements.communityCards.appendChild(createCardElement(communityHand[4]));
      elements.status.textContent = "River: Última apuesta";
    } else if (phase === 4) {
      resolveGame(false);
    }
  }

  function resolveGame(playerFolded) {
    elements.actions.style.display = "none";
    elements.btnDeal.disabled = false;
    phase = 0;

    if (playerFolded) {
      elements.status.textContent = "Te retiraste. Gana el Dealer.";
      elements.status.style.color = "#ff3333";
      Notifications.error("Te retiraste.");
      return;
    }

    // Reveal dealer cards
    elements.dealerCards.innerHTML = "";
    elements.dealerCards.appendChild(createCardElement(dealerHand[0]));
    elements.dealerCards.appendChild(createCardElement(dealerHand[1]));

    // Fill community if player went all in early
    while (communityHand.length < 5) {
      const c = deck.pop();
      communityHand.push(c);
      elements.communityCards.appendChild(createCardElement(c));
    }

    const playerScore = evaluateHand(playerHand, communityHand);
    const dealerScore = evaluateHand(dealerHand, communityHand);

    if (playerScore > dealerScore) {
      updateBalance(pot, false);
      elements.status.textContent = "¡GANASTE!";
      elements.status.style.color = "var(--cyan)";
      Notifications.success(
        `¡Ganaste el bote de ${Formatter.number(pot)} EUR!`,
      );
      // move chips to player
      elements.potChips.style.transition = "transform 0.5s";
      elements.potChips.style.transform = "translateY(200px)";
    } else if (playerScore < dealerScore) {
      elements.status.textContent = "Gana el Dealer.";
      elements.status.style.color = "#ff3333";
      Notifications.error("Has perdido la mano.");
    } else {
      updateBalance(pot / 2, false); // Return half pot (player's share)
      elements.status.textContent = "Empate.";
      elements.status.style.color = "#fff";
      Notifications.success("Empate. Bote dividido.");
    }
  }

  if (elements.btnDeal) elements.btnDeal.addEventListener("click", deal);

  if (elements.btnFold)
    elements.btnFold.addEventListener("click", () => {
      resolveGame(true);
    });

  if (elements.btnCall)
    elements.btnCall.addEventListener("click", () => {
      nextPhase();
    });

  if (elements.btnRaise)
    elements.btnRaise.addEventListener("click", () => {
      const user = typeof getUserData !== "undefined" ? getUserData() : null;
      if (!user) {
        const loginModal = document.getElementById("login-modal");
        if (loginModal) loginModal.showModal();
        return typeof Notifications !== "undefined"
          ? Notifications.error("Debes iniciar sesiÃ³n para jugar.")
          : null;
      }
      if (user.balance < currentBet) {
        return Notifications.error("Saldo insuficiente para subir.");
      }
      updateBalance(-currentBet);
      addChipsToPot(currentBet); // Player raises
      addChipsToPot(currentBet); // Dealer calls instantly for simplicity
      currentBet *= 2;
      nextPhase();
    });
});
