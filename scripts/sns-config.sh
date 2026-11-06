#!/bin/sh
# Build su Vercel: crea js/sns-config.js (non versionato) dalle variabili del
# progetto SNS_SUPABASE_URL e SNS_SUPABASE_KEY, così console sul telefono e show
# sul computer si parlano anche sul sito pubblico. Senza variabili non fa nulla:
# console e show funzionano solo nello stesso browser.
if [ -n "$SNS_SUPABASE_URL" ] && [ -n "$SNS_SUPABASE_KEY" ]; then
  printf "window.SNS_CONFIG = { url: '%s', key: '%s' };\n" "$SNS_SUPABASE_URL" "$SNS_SUPABASE_KEY" > js/sns-config.js
  echo "sns-config.js creato"
else
  echo "SNS_SUPABASE_URL/KEY assenti: sns-config.js non creato"
fi
