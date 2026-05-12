// models/userDTO.js no lo necesitamos mas como estructura fija, pero lo podemos mantener como plantilla
// vamos a usar storage.js como la base de datos completa

const dbKey = 'casino_users_db';
const sessionKey = 'casino_current_session';

// pilla todos los usuarios de la "base de datos"
export function getAllUsers() {
    const db = localStorage.getItem(dbKey);
    return db ? JSON.parse(db) : [];
}

// guarda toda la lista de usuarios
function saveUsers(users) {
    localStorage.setItem(dbKey, JSON.stringify(users));
}

// pilla el usuario activo
export function getUser() {
    const currentUsername = localStorage.getItem(sessionKey);
    if (!currentUsername) return null;
    
    const users = getAllUsers();
    return users.find(u => u.username === currentUsername) || null;
}

// registra un nuevo usuario con 1000 pavos
export function registerUser(username) {
    if (!username || username.trim() === '') return null;
    
    const users = getAllUsers();
    // verificamos q no exista ya
    if (users.find(u => u.username === username)) return null;
    
    const newUser = {
        id: 'u_' + Date.now(),
        username: username.trim(),
        balance: 1000.00, // empezamos fuertes
        currency: '€',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff`,
        transactions: []
    };
    
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

// hace el login
export function loginUser(username) {
    const users = getAllUsers();
    const user = users.find(u => u.username === username);
    if (user) {
        localStorage.setItem(sessionKey, username);
        return true;
    }
    return false;
}

// cierra sesion
export function logoutUser() {
    localStorage.removeItem(sessionKey);
}

// le suma (o resta) pasta al usuario activo y lo guarda en su perfil especifico
export function updateBalance(amount) {
    const currentUsername = localStorage.getItem(sessionKey);
    if (!currentUsername) return null;
    
    let users = getAllUsers();
    let userIndex = users.findIndex(u => u.username === currentUsername);
    
    if (userIndex === -1) return null;
    
    let user = users[userIndex];
    user.balance += amount;
    
    // guarda el ingreso en el historial
    user.transactions.unshift({
        type: amount > 0 ? 'deposit' : 'withdrawal',
        amount: amount,
        date: new Date().toLocaleString()
    });
    
    // actualizamos el usuario en la base de datos general
    users[userIndex] = user;
    saveUsers(users);
    
    return user;
}
