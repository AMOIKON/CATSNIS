# ============================================================
# SCRIPT POWERSHELL — Correction encodage UTF-8 CATUSNIS
# ============================================================
# Exécution : Ouvrir PowerShell dans le dossier contenant ce fichier
#   .\run_fix_encoding.ps1
# ============================================================

$CONTAINER  = "catusnis-mysql"
$DB_USER    = "catusnis_user"
$DB_PASS    = "catusnis_password"
$DB_NAME    = "catusnis_db"
$SQL_FILE   = "$PSScriptRoot\fix_encoding.sql"
$BACKUP_FILE = "$PSScriptRoot\backup_avant_fix_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " CORRECTION ENCODAGE UTF-8 — CATUSNIS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── Vérifier que le conteneur tourne ────────────────────────────────────────
Write-Host "`n[1/4] Vérification du conteneur Docker..." -ForegroundColor Yellow
$running = docker ps --filter "name=$CONTAINER" --format "{{.Names}}"
if ($running -ne $CONTAINER) {
    Write-Host "❌ Le conteneur '$CONTAINER' n'est pas démarré." -ForegroundColor Red
    Write-Host "   Lance : docker-compose up -d catusnis-mysql" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ Conteneur '$CONTAINER' actif." -ForegroundColor Green

# ── Backup de la base avant modification ────────────────────────────────────
Write-Host "`n[2/4] Backup de la base de données..." -ForegroundColor Yellow
Write-Host "   Destination : $BACKUP_FILE"

docker exec $CONTAINER mysqldump `
    -u $DB_USER `
    -p$DB_PASS `
    --default-character-set=utf8mb4 `
    $DB_NAME > $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $BACKUP_FILE).Length / 1KB
    Write-Host "✅ Backup créé : $([math]::Round($size, 1)) KB" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backup échoué — continuer quand même ? (O/N)" -ForegroundColor Red
    $rep = Read-Host
    if ($rep -ne "O" -and $rep -ne "o") { exit 1 }
}

# ── Copier le fichier SQL dans le conteneur ──────────────────────────────────
Write-Host "`n[3/4] Transfert du script SQL..." -ForegroundColor Yellow
docker cp $SQL_FILE "${CONTAINER}:/tmp/fix_encoding.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Impossible de copier le fichier SQL." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Script copié dans le conteneur." -ForegroundColor Green

# ── Exécuter le script SQL ────────────────────────────────────────────────────
Write-Host "`n[4/4] Exécution de la correction..." -ForegroundColor Yellow
Write-Host "   (Cette opération peut prendre quelques minutes selon le volume de données)`n"

docker exec $CONTAINER mysql `
    --default-character-set=utf8mb4 `
    -u $DB_USER `
    -p$DB_PASS `
    $DB_NAME `
    -e "SOURCE /tmp/fix_encoding.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host " ✅ CORRECTION TERMINÉE AVEC SUCCÈS" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "`n💡 Prochain(e)s étapes :" -ForegroundColor Cyan
    Write-Host "   1. Vérifier l'affichage dans l'application React"
    Write-Host "   2. Redémarrer le backend Spring Boot si nécessaire"
    Write-Host "   3. Le backup est disponible : $BACKUP_FILE"
} else {
    Write-Host "`n❌ Une erreur est survenue." -ForegroundColor Red
    Write-Host "   Pour restaurer : " -ForegroundColor Gray
    Write-Host "   docker exec -i $CONTAINER mysql -u $DB_USER -p$DB_PASS $DB_NAME < $BACKUP_FILE" -ForegroundColor Gray
}

# Nettoyage fichier temporaire dans le conteneur
docker exec $CONTAINER rm -f /tmp/fix_encoding.sql
