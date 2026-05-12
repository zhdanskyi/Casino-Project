// Gestión de almacenamiento

function getUserData() {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('casinoUsers')) || [];
    } catch(e) {
        users = [];
    }

    let activeUser = localStorage.getItem('activeUser');
    if (!activeUser) {
        return null;
    }

    let user = users.find(u => u.username === activeUser);
    if (!user) {
        return null;
    }
    
    // Asegurar que exista el saldo
    if (user.balance == null) user.balance = 1000;
    if (!user.currency || user.currency === "€") user.currency = "EUR";

    // Asegurar que existan las estadísticas
    if (!user.stats) {
        user.stats = {
            totalWon: 0,
            totalDeposited: 1000,
            totalLost: 0,
            gamesPlayed: 0
        };
    }
    if (user.isVIP === undefined) user.isVIP = false;
    
    // Comprobar progresión de nivel basado en ganancias totales
    let currentLevel = 1;
    if (user.stats.totalWon >= 10000) currentLevel = 5;
    else if (user.stats.totalWon >= 5000) currentLevel = 4;
    else if (user.stats.totalWon >= 1000) currentLevel = 3;
    else if (user.stats.totalWon >= 100) currentLevel = 2;
    
    if (user.level !== currentLevel) {
        user.level = currentLevel;
        // Se puede despachar un evento de subida de nivel si es necesario
    }

    return user;
}

function saveUserData(userData) {
    if (!userData) return;
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('casinoUsers')) || [];
    } catch(e) {
        users = [];
    }
    const index = users.findIndex(u => u.username === userData.username);
    if (index !== -1) {
        users[index] = userData;
    } else {
        users.push(userData);
    }
    localStorage.setItem('casinoUsers', JSON.stringify(users));
    window.dispatchEvent(new Event('userBalanceChanged'));
}

function resetUserData() {
    localStorage.removeItem('casinoUsers');
    localStorage.removeItem('activeUser');
    getUserData(); // disparar creación de usuario por defecto
    window.dispatchEvent(new Event('userBalanceChanged'));
}

function updateBalance(amount, isDeposit = false) {
    const user = getUserData();
    if (!user) return 0;
    
    user.balance += amount;
    
    if (!user.transactions) user.transactions = [];
    user.transactions.unshift({
        date: new Date().toLocaleString(),
        amount: amount,
        type: amount >= 0 ? 'deposit' : 'withdraw'
    });
    
    // Actualizar estadísticas
    if (isDeposit) {
        user.stats.totalDeposited += amount;
    } else {
        if (amount > 0) user.stats.totalWon += amount;
        else if (amount < 0) user.stats.totalLost += Math.abs(amount);
    }
    
    saveUserData(user);
    return user.balance;
}

function updateGameStats() {
    const user = getUserData();
    if (!user) return;
    if (!user.stats) user.stats = { totalWon: 0, totalDeposited: 0, totalLost: 0, gamesPlayed: 0 };
    user.stats.gamesPlayed++;
    saveUserData(user);
}

function purchaseVIP() {
    const user = getUserData();
    if (!user || user.isVIP) return false;
    
    if (user.balance >= 1000) {
        user.balance -= 1000;
        user.isVIP = true;
        
        user.transactions.unshift({
            date: new Date().toLocaleString(),
            amount: -1000,
            type: 'withdraw'
        });
        
        saveUserData(user);
        return true;
    }
    return false;
}

// Funciones auxiliares usadas por el resto de la app:
const Storage = {
    init: function() {
        // No auto-login en el inicio
        if (!localStorage.getItem('casinoUsers')) {
            localStorage.setItem('casinoUsers', JSON.stringify([]));
        }
    },
    getAllUsers: function() {
        const usersStr = localStorage.getItem('casinoUsers');
        return usersStr ? JSON.parse(usersStr) : [];
    },
    registerUser: function(name) {
        let users = this.getAllUsers();
        if (users.find(u => u.username.toLowerCase() === name.toLowerCase())) return null;
        
        const newUser = {
            username: name,
            balance: 1000,
            currency: "EUR",
            level: 1,
            xp: 0,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
            transactions: [],
            stats: {
                totalWon: 0,
                totalDeposited: 1000,
                totalLost: 0,
                gamesPlayed: 0
            },
            isVIP: false,
            bgImage: null
        };
        users.push(newUser);
        localStorage.setItem('casinoUsers', JSON.stringify(users));
        return newUser;
    },
    loginUser: function(name) {
        const users = this.getAllUsers();
        if (users.find(u => u.username === name)) {
            localStorage.setItem('activeUser', name);
            window.dispatchEvent(new Event('userBalanceChanged'));
            return true;
        }
        return false;
    },
    logoutUser: function() {
        localStorage.removeItem('activeUser');
        window.dispatchEvent(new Event('userBalanceChanged'));
    },
    hasAcceptedAgeGate: function() {
        return localStorage.getItem('ageVerified') === 'true';
    },
    acceptAgeGate: function() {
        localStorage.setItem('ageVerified', 'true');
    },
    // Alias de funciones globales
    getUser: getUserData,
    saveUser: saveUserData,
    updateBalance: updateBalance,
    setBalance: function(amount) {
        const user = getUserData();
        const diff = amount - user.balance;
        return updateBalance(diff);
    }
};

window.getUserData = getUserData;
window.saveUserData = saveUserData;
window.resetUserData = resetUserData;
window.updateBalance = updateBalance;
window.updateGameStats = updateGameStats;
window.purchaseVIP = purchaseVIP;
