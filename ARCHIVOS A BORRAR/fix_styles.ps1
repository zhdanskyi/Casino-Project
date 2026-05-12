$root = "c:\DAM\CLONACION1940\Casino-Project"
$pagesDir = Join-Path $root "pages"

# 1. Add missing CSS to subpages and update user-profile-btn href
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter *.html
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Inject modal.css if not present
    if ($content -notmatch 'modal\.css') {
        $content = $content -replace '(<link rel="stylesheet" href="\.\./css/animations\.css">)', "`$1`n    <link rel=`"stylesheet`" href=`"../css/modal.css`">"
    }

    # Update href of user-profile-btn
    $content = $content -replace '<a href="#" class="user-profile-btn"', '<a href="profile.html" class="user-profile-btn"'

    # Move Logout button to wallet modal
    # First, let's inject a logout button in the wallet modal if we removed the profile modal
    if ($content -notmatch 'id="btn-logout"') {
        $logoutBtn = @"
                <button id="btn-logout" class="btn-secondary" style="border: 1px solid #ef4444; color: #ef4444; padding: 4px 8px; font-size: 0.8em; cursor: pointer; border-radius: 4px; margin-top: 5px;">
                    <i class="fa-solid fa-right-from-bracket"></i> Salir
                </button>
"@
        $content = $content -replace '(<p style="color: #94a3b8; font-size: 0\.9em;">Miembro VIP</p>)', "`$1`n$logoutBtn"
    }

    Set-Content $file.FullName -Value $content -Encoding UTF8
}

# 2. Update index.html user-profile-btn and wallet modal
$indexContent = Get-Content (Join-Path $root "index.html") -Raw -Encoding UTF8
$indexContent = $indexContent -replace '<a href="#" class="user-profile-btn"', '<a href="pages/profile.html" class="user-profile-btn"'

if ($indexContent -notmatch 'id="btn-logout" class="btn-secondary".*?Salir') {
    # It has a profile modal at the end, which has btn-logout. We need to copy btn-logout to wallet modal.
    # Actually, let's just inject the same small button under Miembro VIP
    $logoutBtn = @"
                <button id="btn-logout" class="btn-secondary" style="border: 1px solid #ef4444; color: #ef4444; padding: 4px 8px; font-size: 0.8em; cursor: pointer; border-radius: 4px; margin-top: 5px;">
                    <i class="fa-solid fa-right-from-bracket"></i> Salir
                </button>
"@
    # Only replace if it hasn't been added to wallet-modal yet
    if ($indexContent -notmatch 'id="btn-logout".*?Salir') {
        $indexContent = $indexContent -replace '(?s)(<dialog id="wallet-modal".*?<p style="color: #94a3b8; font-size: 0\.9em;">Miembro VIP</p>)', "`$1`n$logoutBtn"
    }
}
Set-Content (Join-Path $root "index.html") -Value $indexContent -Encoding UTF8

# 3. Update app.js
$appJsPath = Join-Path $root "js\app.js"
$appJsContent = Get-Content $appJsPath -Raw -Encoding UTF8
# Remove the else if that blocks the link
$appJsContent = $appJsContent -replace '(?s)\} else if \(e\.target\.closest\(''\.user-profile-btn''\)\) \{.*?openProfileModal\(\);\s*\}', '}'
Set-Content $appJsPath -Value $appJsContent -Encoding UTF8

Write-Output "Fixes applied."
