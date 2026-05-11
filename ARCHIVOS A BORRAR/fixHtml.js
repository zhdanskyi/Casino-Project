const fs = require('fs');
const path = require('path');

const root = 'c:\\DAM\\CLONACION1940\\Casino-Project';
const pagesDir = path.join(root, 'pages');

// 1. TAREA 1 & 2: Get modals from index.html
const indexHtmlPath = path.join(root, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Replace logo in index.html to be a link
indexHtml = indexHtml.replace(
    /<div class="topbar-logo">([\s\S]*?)<\/div>/,
    '<a href="index.html" class="topbar-logo" style="text-decoration: none;">\n                    $1\n                </a>'
);
fs.writeFileSync(indexHtmlPath, indexHtml);

// Extract modals
const walletModalMatch = indexHtml.match(/<dialog id="wallet-modal"[\s\S]*?<\/dialog>/);
const loginModalMatch = indexHtml.match(/<dialog id="login-modal"[\s\S]*?<\/dialog>/);
const profileModalMatch = indexHtml.match(/<dialog id="profile-modal"[\s\S]*?<\/dialog>/); 
const vipModalMatch = indexHtml.match(/<dialog id="vip-modal"[\s\S]*?<\/dialog>/);

const modalsHtml = `\n    <!-- Modales inyectados -->\n    ${walletModalMatch[0]}\n    ${loginModalMatch[0]}\n    ${profileModalMatch ? profileModalMatch[0] : ''}\n    ${vipModalMatch ? vipModalMatch[0] : ''}\n`;

// Define the new topbar for subpages
const topbarHtml = `    <header class="topbar">
        <div class="topbar-content">
            <div class="topbar-left">
                <!-- Logo del Casino -->
                <a href="../index.html" class="topbar-logo" style="text-decoration: none;">
                    <i class="fa-solid fa-dice-d20"></i> <span class="logo-text">CasinoHub</span>
                </a>

                <!-- Enlaces de Navegación -->
                <nav class="topbar-nav" id="mobileNav">
                    <a href="../index.html" class="nav-item">
                        <i class="fa-solid fa-house"></i> Inicio
                    </a>

                    <!-- Menú Desplegable para Juegos -->
                    <div class="mega-menu-wrapper">
                        <a href="../index.html#games-section" class="nav-item active">
                            <i class="fa-solid fa-gamepad"></i> Juegos <i class="fa-solid fa-chevron-down"
                                style="font-size: 12px; margin-left: 5px;"></i>
                        </a>

                        <div class="mega-menu">
                            <a href="aviator.html" class="mega-menu-item">
                                <img src="../assets/images/games/aviator.jpg" alt="Aviator">
                                Aviator
                            </a>
                            <a href="poker.html" class="mega-menu-item">
                                <img src="../assets/images/games/poker.jpg" alt="Poker">
                                Cyber Poker
                            </a>
                            <a href="mines.html" class="mega-menu-item">
                                <img src="../assets/images/games/mines.jpg" alt="Mines">
                                Mines
                            </a>
                            <a href="rocket.html" class="mega-menu-item">
                                <img src="../assets/images/games/rocket.jpg" alt="Rocket">
                                Rocket Crash
                            </a>
                            <a href="slots.html" class="mega-menu-item">
                                <img src="../assets/images/games/slots.jpg" alt="Slots">
                                Slots
                            </a>
                        </div>
                    </div>

                    <a href="bonuses.html" class="nav-item">
                        <i class="fa-solid fa-gift"></i> Promociones
                    </a>
                </nav>
            </div>

            <div class="topbar-right">
                <!-- Controles de Usuario (Saldo y Perfil) -->
                <div class="user-controls">
                    <div class="balance-display">
                        <i class="fa-solid fa-wallet"></i>
                        <span id="userBalance" class="balance-amount">0.00 EUR</span>
                    </div>
                    <button id="addFundsBtn" class="add-funds-btn"><i class="fa-solid fa-plus add-funds-icon"
                            style="display:none;"></i><span class="add-funds-text">+ Añadir Saldo</span></button>
                    <a href="#" class="user-profile-btn" style="cursor: pointer;">
                        <div class="user-avatar" id="userAvatarBtn">?</div>
                        <span id="userNameBtn">Invitado</span>
                    </a>
                </div>

                <!-- Botón de Menú Móvil -->
                <button id="mobileMenuBtn" class="mobile-menu-btn"><i class="fa-solid fa-bars"></i></button>
            </div>
        </div>
    </header>`;

// Process HTML files
const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove aside
    content = content.replace(/<aside class="sidebar">[\s\S]*?<\/aside>\s*/g, '');

    // Replace header
    content = content.replace(/<header class="topbar">[\s\S]*?<\/header>/g, topbarHtml);

    // Make sure main-content exists.
    if (!content.includes('<main class="main-content">') && content.includes('<div class="game-layout">')) {
        content = content.replace(/<div class="game-layout">/, '<main class="main-content">\n        <div class="game-layout">');
        content = content.replace(/<\/body>/, '</main>\n</body>'); 
    } else if (!content.includes('<main class="main-content">') && content.includes('<div class="profile-layout">')) {
        content = content.replace(/<div class="profile-layout">/, '<main class="main-content">\n        <div class="profile-layout">');
        content = content.replace(/<\/body>/, '</main>\n</body>'); 
    }

    // Inject modals before <div id="toast-container"> or <script> or </body>
    if (!content.includes('id="login-modal"')) {
        if (content.includes('<div id="toast-container">')) {
            content = content.replace('<div id="toast-container">', modalsHtml + '\n    <div id="toast-container">');
        } else if (content.includes('<script')) {
            content = content.replace(/(<script.*?>)/, modalsHtml + '\n    $1');
        } else {
            content = content.replace('</body>', modalsHtml + '\n</body>');
        }
    }

    // Ensure app.js and storage.js are included
    if (!content.includes('app.js')) {
        content = content.replace(/<script src="\.\.\/js\/ui\.js"><\/script>/, '<script src="../js/ui.js"></script>\n    <script src="../js/app.js"></script>');
    }
    
    fs.writeFileSync(filePath, content);
}

console.log("HTML changes applied.");
