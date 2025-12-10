# Script PowerShell pour creer les utilisateurs de test
# Usage: .\create-test-users.ps1

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Obtenir le repertoire du script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TestsDir = Split-Path -Parent $ScriptDir

# Charger la configuration
$ConfigPath = Join-Path $TestsDir "config\test-config.json"
$Config = Get-Content $ConfigPath -Encoding UTF8 | ConvertFrom-Json

if ($env:API_BASE_URL) {
    $env:API_BASE = $env:API_BASE_URL
} else {
    $env:API_BASE = $Config.environments.local.api_base
}
$ApiBase = $env:API_BASE

$separator = "=" * 60
Write-Host $separator -ForegroundColor Cyan
Write-Host "Creation des utilisateurs de test" -ForegroundColor Cyan
Write-Host $separator -ForegroundColor Cyan
Write-Host "API Base URL: $ApiBase" -ForegroundColor Gray
Write-Host ""

function Create-TestUser {
    param(
        [string]$Username,
        [string]$Email,
        [string]$Password,
        [string]$FirstName,
        [string]$LastName,
        [string]$Role
    )
    
    Write-Host "Creation de l'utilisateur: $Username ($Role)..." -ForegroundColor Yellow
    
    # Essayer les deux formats
    $payload1 = @{
        username = $Username
        email = $Email
        password = $Password
        first_name = $FirstName
        last_name = $LastName
        role = $Role
    }
    
    $payload2 = @{
        username = $Username
        email = $Email
        password = $Password
        firstName = $FirstName
        lastName = $LastName
        role = $Role
    }
    
    # Essayer le premier format (snake_case)
    try {
        $body = $payload1 | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$ApiBase/auth/register/" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  [OK] Utilisateur $Username cree avec succes" -ForegroundColor Green
        return $true
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        
        if ($statusCode -eq 400) {
            try {
                $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorMsg = $errorContent.error
                
                # Vérifier si l'utilisateur existe déjà (plusieurs variations possibles)
                if ($errorMsg -match "deja|already|exists|existe|utilis|Username.*email.*deja|email.*username.*deja|already.*used|already.*exists") {
                    Write-Host "  [INFO] Utilisateur $Username existe deja" -ForegroundColor Yellow
                    return $true
                } elseif ($errorMsg -match "first_name est requis|first_name.*requis") {
                    # Ne pas essayer camelCase si le backend exige snake_case
                    Write-Host "  [ERREUR] Le backend exige first_name et last_name (snake_case)" -ForegroundColor Red
                    Write-Host "  [DEBUG] Erreur: $errorMsg" -ForegroundColor Gray
                    return $false
                } else {
                    # Autre erreur, essayer camelCase
                    Write-Host "  [DEBUG] Erreur avec format snake_case: $errorMsg, essai avec camelCase..." -ForegroundColor Gray
                }
            } catch {
                # Ignorer l'erreur de parsing mais continuer
                Write-Host "  [DEBUG] Erreur 400 non parsable, essai avec camelCase..." -ForegroundColor Gray
            }
        } elseif ($statusCode -eq $null) {
            Write-Host "  [ERREUR] Impossible de se connecter a l'API ($ApiBase)" -ForegroundColor Red
            Write-Host "     Assurez-vous que le backend est demarre" -ForegroundColor Yellow
            return $false
        }
        
        # Essayer le second format (camelCase)
        try {
            $body = $payload2 | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$ApiBase/auth/register/" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
            Write-Host "  [OK] Utilisateur $Username cree avec succes" -ForegroundColor Green
            return $true
        } catch {
            $statusCode2 = $null
            if ($_.Exception.Response) {
                $statusCode2 = $_.Exception.Response.StatusCode.value__
            }
            if ($statusCode2 -eq 400) {
                try {
                    $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json
                    $errorMsg = $errorContent.error
                    if ($errorMsg -match "deja|already|exists|existe|utilise|utilisé") {
                        Write-Host "  [INFO] Utilisateur $Username existe deja" -ForegroundColor Yellow
                        return $true
                    } else {
                        Write-Host "  [ERREUR]: $errorMsg" -ForegroundColor Red
                        # Si l'erreur indique que le format est mauvais, ne pas continuer
                        if ($errorMsg -match "first_name|first_name est requis") {
                            Write-Host "  [INFO] Le backend exige le format snake_case (first_name, last_name)" -ForegroundColor Yellow
                        }
                    }
                } catch {
                    Write-Host "  [ERREUR] Erreur HTTP $statusCode2 (non parsable)" -ForegroundColor Red
                    Write-Host "  [DEBUG] Response: $($_.Exception.Message)" -ForegroundColor Gray
                }
            } else {
                Write-Host "  [ERREUR] Erreur HTTP $statusCode2" -ForegroundColor Red
            }
        }
    }
    
    return $false
}

function Test-Login {
    param(
        [string]$Username,
        [string]$Password
    )
    
    try {
        $body = @{
            username = $Username
            password = $Password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$ApiBase/auth/login/" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Creer les utilisateurs de test
$usersCreated = 0
$usersFailed = 0

foreach ($role in @("patient", "doctor", "admin")) {
    $userData = $Config.test_data.test_users.$role
    if ($userData) {
        # Vérifier si le rôle admin est supporté
        if ($role -eq "admin") {
            Write-Host "Creation de l'utilisateur: $($userData.username) ($role)..." -ForegroundColor Yellow
            Write-Host "  [WARN] Le role 'admin' n'est peut-etre pas supporte par l'API" -ForegroundColor Yellow
            Write-Host "  [INFO] L'API accepte uniquement 'patient' ou 'doctor'" -ForegroundColor Yellow
            Write-Host ""
            # On peut soit skip, soit essayer avec role='doctor' pour les tests
            # Pour l'instant, on skip
            continue
        }
        # Gerer les deux formats de nom (firstName/first_name)
        $firstName = "Test"
        $props = $userData.PSObject.Properties.Name
        if ($props -contains "firstName") {
            $firstName = $userData.firstName
        } elseif ($props -contains "first_name") {
            $firstName = $userData.first_name
        }
        
        $lastName = "User"
        if ($props -contains "lastName") {
            $lastName = $userData.lastName
        } elseif ($props -contains "last_name") {
            $lastName = $userData.last_name
        }
        
        # Si toujours pas trouvé, utiliser des valeurs par défaut basées sur le rôle
        if ($firstName -eq "Test") {
            $firstName = "Test"
        }
        if ($lastName -eq "User") {
            $lastName = $role.Substring(0,1).ToUpper() + $role.Substring(1)
        }
        
        $success = Create-TestUser `
            -Username $userData.username `
            -Email $userData.email `
            -Password $userData.password `
            -FirstName $firstName `
            -LastName $lastName `
            -Role $userData.role
        
        if ($success) {
            $usersCreated++
            # Tester la connexion
            if (Test-Login -Username $userData.username -Password $userData.password) {
                Write-Host "  [OK] Login test reussi pour $($userData.username)" -ForegroundColor Green
            } else {
                Write-Host "  [WARN] Login test echoue pour $($userData.username)" -ForegroundColor Yellow
            }
        } else {
            $usersFailed++
        }
        Write-Host ""
    }
}

$separator = "=" * 60
Write-Host $separator -ForegroundColor Cyan
Write-Host "Resume: $usersCreated crees/verifies, $usersFailed echecs" -ForegroundColor Cyan
Write-Host $separator -ForegroundColor Cyan

if ($usersFailed -gt 0) {
    Write-Host ""
    Write-Host "[WARN] Certains utilisateurs n'ont pas pu etre crees." -ForegroundColor Yellow
    Write-Host "   Verifiez que:" -ForegroundColor Yellow
    Write-Host "   1. Le backend est demarre" -ForegroundColor Yellow
    Write-Host "   2. L'API est accessible" -ForegroundColor Yellow
    Write-Host "   3. La base de donnees est configuree" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "[OK] Tous les utilisateurs de test sont prets!" -ForegroundColor Green
    exit 0
}
