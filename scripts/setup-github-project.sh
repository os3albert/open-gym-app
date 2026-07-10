#!/usr/bin/env bash
#
# setup-github-project.sh
#
# Crea (in modo idempotente) il GitHub Project v2 "Open Gym — Roadmap" per
# os3albert/open-gym-app, i campi custom e vi aggiunge tutte le issue del
# repository, impostando per ognuna la stima in ore e la priorità.
#
# PREREQUISITO: il token gh deve avere lo scope "project". Se non lo hai:
#
#     gh auth refresh -s project,read:project
#
# Poi lancia questo script:
#
#     ./scripts/setup-github-project.sh
#
# Lo script è rieseguibile senza effetti collaterali: salta ciò che esiste già.

set -euo pipefail

OWNER="os3albert"
REPO="os3albert/open-gym-app"
PROJECT_TITLE="Open Gym — Roadmap"

log() { printf '\n==> %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 0. Prerequisiti
# ---------------------------------------------------------------------------
command -v gh >/dev/null 2>&1 || { echo "ERRORE: gh CLI non trovata." >&2; exit 1; }

if ! gh auth status 2>&1 | grep -Eq "Token scopes:.*project"; then
  echo "ATTENZIONE: lo scope 'project' sembra mancare dal token gh." >&2
  echo "Se lo script fallisce, esegui prima: gh auth refresh -s project,read:project" >&2
fi

# ---------------------------------------------------------------------------
# 1. Project: crealo solo se non esiste già
# ---------------------------------------------------------------------------
log "Cerco il project \"$PROJECT_TITLE\" per $OWNER..."
PROJECT_NUMBER="$(gh project list --owner "$OWNER" --limit 100 --format json \
  --jq ".projects[] | select(.title == \"$PROJECT_TITLE\") | .number" | head -n1)"

if [[ -z "$PROJECT_NUMBER" ]]; then
  log "Project non trovato: lo creo."
  PROJECT_NUMBER="$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" \
    --format json --jq '.number')"
  echo "Project creato: numero $PROJECT_NUMBER"
else
  echo "Project già esistente: numero $PROJECT_NUMBER"
fi

PROJECT_ID="$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq '.id')"
echo "ID del project: $PROJECT_ID"

# ---------------------------------------------------------------------------
# 2. Campi custom (il campo "Status" è creato di default da GitHub)
# ---------------------------------------------------------------------------
field_id_by_name() { # $1 = nome campo
  gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 100 --format json \
    --jq ".fields[] | select(.name == \"$1\") | .id" | head -n1
}

ensure_field() { # $1 = nome, $2 = data type, $3 = opzioni single-select (opzionale)
  local name="$1" datatype="$2" opts="${3:-}"
  if [[ -n "$(field_id_by_name "$name")" ]]; then
    echo "Campo \"$name\" già presente."
  else
    if [[ -n "$opts" ]]; then
      gh project field-create "$PROJECT_NUMBER" --owner "$OWNER" \
        --name "$name" --data-type "$datatype" --single-select-options "$opts" >/dev/null
    else
      gh project field-create "$PROJECT_NUMBER" --owner "$OWNER" \
        --name "$name" --data-type "$datatype" >/dev/null
    fi
    echo "Campo \"$name\" creato."
  fi
}

log "Assicuro i campi custom..."
ensure_field "Stima (h)" "NUMBER"
ensure_field "Priorità" "SINGLE_SELECT" "P0,P1,P2"

STIMA_FIELD_ID="$(field_id_by_name "Stima (h)")"
PRIO_FIELD_ID="$(field_id_by_name "Priorità")"

prio_option_id() { # $1 = nome opzione (P0/P1/P2)
  gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 100 --format json \
    --jq ".fields[] | select(.name == \"Priorità\") | .options[] | select(.name == \"$1\") | .id" | head -n1
}
P0_OPT="$(prio_option_id P0)"
P1_OPT="$(prio_option_id P1)"
P2_OPT="$(prio_option_id P2)"

[[ -n "$STIMA_FIELD_ID" && -n "$PRIO_FIELD_ID" && -n "$P0_OPT" && -n "$P1_OPT" && -n "$P2_OPT" ]] || {
  echo "ERRORE: impossibile ricavare gli ID dei campi/opzioni del project." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# 3. Aggiungo TUTTE le issue del repo al project (se non già presenti)
# ---------------------------------------------------------------------------
log "Aggiungo le issue di $REPO al project..."
EXISTING_URLS="$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 500 \
  --format json --jq '.items[].content.url // empty')"

gh issue list --repo "$REPO" --state all --limit 500 --json number,url \
  --jq '.[] | "\(.number)\t\(.url)"' | while IFS=$'\t' read -r number url; do
  if grep -qxF "$url" <<<"$EXISTING_URLS"; then
    echo "Issue #$number già nel project."
  else
    gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" >/dev/null
    echo "Issue #$number aggiunta al project."
  fi
done

# ---------------------------------------------------------------------------
# 4. Imposto "Stima (h)" e "Priorità" per ogni item
#    - la stima viene letta dalla riga "⏱️ Stima (AI-assisted): Xh" nel body
#    - la priorità viene letta dalla label "priorita:PX" dell'issue
# ---------------------------------------------------------------------------
log "Imposto i valori dei campi per ogni item..."
ITEMS_TSV="$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 500 \
  --format json \
  --jq ".items[] | select(.content.type == \"Issue\" and .content.repository == \"$REPO\") | \"\(.content.number)\t\(.id)\"")"

while IFS=$'\t' read -r number item_id; do
  [[ -z "${number:-}" ]] && continue

  # Stima (h) dal body dell'issue
  body="$(gh issue view "$number" --repo "$REPO" --json body --jq '.body')"
  stima="$(grep -oE 'Stima \(AI-assisted\): [0-9]+h' <<<"$body" | grep -oE '[0-9]+' | head -n1 || true)"
  if [[ -n "$stima" ]]; then
    gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" \
      --field-id "$STIMA_FIELD_ID" --number "$stima" >/dev/null
    echo "Issue #$number: Stima (h) = $stima"
  else
    echo "Issue #$number: nessuna stima trovata nel body, campo non impostato."
  fi

  # Priorità dalla label priorita:PX
  prio="$(gh issue view "$number" --repo "$REPO" --json labels --jq '.labels[].name' \
    | grep '^priorita:' | head -n1 || true)"
  opt_id=""
  case "${prio#priorita:}" in
    P0) opt_id="$P0_OPT" ;;
    P1) opt_id="$P1_OPT" ;;
    P2) opt_id="$P2_OPT" ;;
  esac
  if [[ -n "$opt_id" ]]; then
    gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" \
      --field-id "$PRIO_FIELD_ID" --single-select-option-id "$opt_id" >/dev/null
    echo "Issue #$number: Priorità = ${prio#priorita:}"
  fi
done <<<"$ITEMS_TSV"

log "Fatto! Board disponibile su: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
