import { getUser, updateBalance } from '../utils/storage.js';

// al cargar el dom, inicializamos todo
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initProfileUI();
    initDepositButtons();
});

// esto abre o cierra el menu lateral
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const btnToggle = document.getElementById('btn-toggle-sidebar');

    if (btnToggle && sidebar) {
        btnToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
}

// actualiza la interfaz con los datos del usuario
function initProfileUI() {
    const user = getUser();
    updateHeaderUI(user);

    // actualiza los datos en la tarjeta del main
    const profileName = document.getElementById('profile-page-name');
    const profileAvatar = document.getElementById('profile-page-avatar');

    if (profileName) profileName.textContent = user.username;
    if (profileAvatar) profileAvatar.src = user.avatar;
}

// pinta los datos en la barra de arriba
function updateHeaderUI(user) {
    const balanceNode = document.getElementById('user-balance');
    const nameNode = document.getElementById('user-name');
    const avatarNode = document.getElementById('user-avatar');

    if (balanceNode) balanceNode.textContent = parseFloat(user.balance).toFixed(2);
    if (nameNode) nameNode.textContent = user.username;
    if (avatarNode) avatarNode.src = user.avatar;
}

// listener para los botones de meter dinero
function initDepositButtons() {
    const buttons = document.querySelectorAll('.btn-deposit');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // saca el data-amount del html y lo pasa a numero
            const amount = parseFloat(e.target.dataset.amount);

            // llama a la funcion de storage para sumar
            const updatedUser = updateBalance(amount);

            // repinta la barra de arriba con el dinero nuevo
            updateHeaderUI(updatedUser);

            // efectito visual en el texto del dinero
            const balanceNode = document.getElementById('user-balance');
            balanceNode.style.color = '#fff';
            setTimeout(() => balanceNode.style.color = '', 300);
        });
    });
}
