#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="snazzle-hunt"
REPO_URL="https://github.com/contactsnazzlecreations/Snazzle-hunt-app.git"

printf '\n🦆 Snazzle Shop automatische e-mail instellen\n\n'

gcloud config set project "$PROJECT_ID" >/dev/null

if [ ! -f firebase.json ]; then
  echo "Projectbestanden ophalen uit GitHub..."
  cd "$HOME"
  if [ -d Snazzle-hunt-app/.git ]; then
    cd Snazzle-hunt-app
    git pull --ff-only
  else
    git clone "$REPO_URL"
    cd Snazzle-hunt-app
  fi
fi

echo
printf 'Stap 1/3: vul als SMTP_USER het Gmail-adres in waarmee Snazzle mails verstuurt.\n'
firebase functions:secrets:set SMTP_USER --project "$PROJECT_ID"

echo
printf 'Stap 2/3: vul als SMTP_PASS het 16-cijferige Google app-wachtwoord in.\n'
printf 'Gebruik NIET je normale Google-wachtwoord.\n'
firebase functions:secrets:set SMTP_PASS --project "$PROJECT_ID"

echo
printf 'Stap 3/3: automatische mailfunctie deployen...\n'
firebase deploy --only functions:sendShopOrderEmails --project "$PROJECT_ID"

echo
printf '✅ Klaar. Plaats nu één testbestelling in de Snazzle Shop.\n'
printf 'De beheerders en de klant horen daarna automatisch een e-mail te ontvangen.\n'
