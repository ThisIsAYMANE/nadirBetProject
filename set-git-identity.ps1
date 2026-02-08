# Run this once - replace with YOUR new GitHub account name and email
# Use the email that is linked to your GitHub account (Settings → Emails on github.com)

$newName = "ThisIsAYMANE"   # or your display name, e.g. "Aymane Maali"
$newEmail = "maaliaymane24@gmail.com"   # MUST be the email linked to your GitHub account

git config --global user.name $newName
git config --global user.email $newEmail

Write-Host "Git identity set to: $newName <$newEmail>"
Write-Host ""
Write-Host "Next: clear old GitHub login so next push asks for the new account."
Write-Host "Run: cmdkey /delete:git:https://github.com"
Write-Host "Then run: git push (you will be asked to sign in with the new account)"
