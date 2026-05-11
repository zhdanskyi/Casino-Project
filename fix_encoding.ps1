$root = "c:\DAM\CLONACION1940\Casino-Project"
$pagesDir = Join-Path $root "pages"
$jsDir = Join-Path $root "js\games"

$files = (Get-ChildItem -Path $pagesDir -Filter *.html).FullName + (Get-ChildItem -Path $jsDir -Filter *.js).FullName

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    
    $content = $content.Replace("AÃ±adir", "Añadir")
    $content = $content.Replace("MenÃº", "Menú")
    $content = $content.Replace("NavegaciÃ³n", "Navegación")
    $content = $content.Replace("BotÃ³n", "Botón")
    $content = $content.Replace("MÃ³vil", "Móvil")
    $content = $content.Replace("sesiÃ³n", "sesión")
    $content = $content.Replace("explÃ­citas", "explícitas")
    $content = $content.Replace("mÃ¡s", "más")
    $content = $content.Replace("AÃ±os", "Años")
    $content = $content.Replace("aÃ±os", "años")
    $content = $content.Replace("MenÃº", "Menú")
    $content = $content.Replace("PromociÃ³n", "Promoción")
    $content = $content.Replace("ConfiguraciÃ³n", "Configuración")
    
    [System.IO.File]::WriteAllText($file, $content, (New-Object System.Text.UTF8Encoding($false)))
}
Write-Output "Encoding fixes applied."
