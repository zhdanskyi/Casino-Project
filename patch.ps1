$ErrorActionPreference = "Stop"

$root = "c:\DAM\CLONACION1940\Casino-Project"
$pagesDir = Join-Path $root "pages"
$jsDir = Join-Path $root "js\games"

# 1. Modals
$indexContent = Get-Content (Join-Path $root "index.html") -Raw -Encoding UTF8

# Extract wallet modal
$walletModal = ""
if ($indexContent -match '(?s)(<dialog id="wallet-modal".*?</dialog>)') {
    $walletModal = $matches[1]
}

# Extract login modal
$loginModal = ""
if ($indexContent -match '(?s)(<dialog id="login-modal".*?</dialog>)') {
    $loginModal = $matches[1]
}

$modals = "`n`n    <!-- Modales Globales -->`n    $walletModal`n    $loginModal`n"

# 2. Topbar definition
$topbarHtml = @"
    <header class="topbar">
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
    </header>
"@

# Process HTML files
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter *.html
foreach ($file in $htmlFiles) {
    # Skip rocket.html to avoid re-patching it incorrectly since it's already mostly done manually
    if ($file.Name -eq "rocket.html") {
        # Just ensure modals and app.js are in rocket.html
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        if ($content -notmatch 'id="login-modal"') {
            $content = $content -replace '(</body>)', "$modals`$1"
        }
        Set-Content $file.FullName -Value $content -Encoding UTF8
        continue
    }

    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Remove aside
    $content = $content -replace '(?s)<aside class="sidebar">.*?</aside>\s*', ''
    
    # Replace header topbar
    $content = $content -replace '(?s)<header class="topbar">.*?</header>', $topbarHtml
    
    # Ensure <main class="main-content">
    if ($content -notmatch '<main class="main-content">') {
        if ($content -match '(?s)<div class="game-layout">') {
            $content = $content -replace '(?s)(<div class="game-layout">.*)(<div id="toast-container">)', "<main class=`"main-content`">`n        `$1</main>`n    `$2"
        }
        elseif ($content -match '(?s)<div class="profile-layout">') {
            $content = $content -replace '(?s)(<div class="profile-layout">.*)(<div id="toast-container">)', "<main class=`"main-content`">`n        `$1</main>`n    `$2"
        }
    }

    # Inject modals
    if ($content -notmatch 'id="login-modal"') {
        if ($content -match '<div id="toast-container">') {
            $content = $content -replace '(<div id="toast-container">)', "$modals`n    `$1"
        } else {
            $content = $content -replace '(</body>)', "$modals`n`$1"
        }
    }

    # Inject app.js and storage.js
    if ($content -notmatch 'app\.js') {
        $content = $content -replace '(<script src="\.\./js/ui\.js"></script>)', "`$1`n    <script src=`"../js/app.js`"></script>"
    }

    Set-Content $file.FullName -Value $content -Encoding UTF8
}

Write-Output "HTML Patching complete."

# Process JS files
$jsFiles = @("aviator.js", "slots.js", "poker.js", "mines.js")

foreach ($filename in $jsFiles) {
    $path = Join-Path $jsDir $filename
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        
        # Replace simple getUserData check
        $content = $content -replace 'const user = typeof getUserData === ''function'' \? getUserData\(\) : Storage\.getUser\(\);', "const user = typeof getUserData !== 'undefined' ? getUserData() : null;"
        $content = $content -replace 'const user = getUserData\(\);', "const user = typeof getUserData !== 'undefined' ? getUserData() : null;"

        # Replace return conditions for no user
        $replacement = @"
if (!user) {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.showModal();
            return typeof Notifications !== 'undefined' ? Notifications.error("Debes iniciar sesión para jugar.") : null;
        }
"@
        $content = $content -replace 'if \(!user\) return Notifications\.error\("[^"]+"\);', $replacement
        $content = $content -replace 'if \(!user\) return;', $replacement

        # Update max bet button check
        $maxBetRepl = @"
if (user && elements.betAmount) {
                elements.betAmount.value = user.balance.toFixed(2);
            } else if (!user) {
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.showModal();
                if (typeof Notifications !== 'undefined') Notifications.error("Debes iniciar sesión para apostar.");
            }
"@
        $content = $content -replace '(?s)if\s*\(user && elements\.betAmount\)\s*\{\s*elements\.betAmount\.value = user\.balance\.toFixed\(2\);\s*\}', $maxBetRepl

        # Aviator has slightly different max bet: if(user) updateBet(user.balance);
        $maxBetReplAv = @"
if(user) updateBet(user.balance);
        else if (!user) {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.showModal();
            if (typeof Notifications !== 'undefined') Notifications.error("Debes iniciar sesión para apostar.");
        }
"@
        $content = $content -replace 'if\s*\(user\)\s*updateBet\(user\.balance\);', $maxBetReplAv

        Set-Content $path -Value $content -Encoding UTF8
    }
}

Write-Output "JS Patching complete."
