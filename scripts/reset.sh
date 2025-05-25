#!/bin/bash
set -e

NAMESPACE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --namespace=*)
      NAMESPACE="${1#*=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

if [[ -z "$NAMESPACE" ]]; then
  echo "❌ Erreur : Le namespace doit être fourni avec --namespace=xxx"
  exit 1
fi

echo "Namespace choisi : $NAMESPACE"

# === Options ===
QUIET=false
DRY_RUN=false
NAMESPACE=""

for arg in "$@"; do
  case $arg in
    --quiet) QUIET=true ;;
    --dry-run) DRY_RUN=true ;;
    --namespace=*) NAMESPACE="${arg#*=}" ;;
    --help)
      echo "Usage: $0 [--quiet] [--dry-run] [--namespace=mon-ns]"
      exit 0
      ;;
  esac
done

# Si namespace non fourni en paramètre, le demander
if [[ -z "$NAMESPACE" && "$QUIET" = false ]]; then
  read -p "🔁 Entrez le namespace à réinitialiser : " NAMESPACE
elif [[ -z "$NAMESPACE" ]]; then
  echo "❌ Veuillez spécifier --namespace=... en mode --quiet"
  exit 1
fi

# === Nettoyage ===
echo "🧹 Lancement du nettoyage..."
./clean.sh --quiet $([[ "$DRY_RUN" = true ]] && echo "--dry-run") --namespace="$NAMESPACE"

# === Déploiement ===
echo "🚀 Lancement du déploiement..."
./deploy.sh --quiet $([[ "$DRY_RUN" = true ]] && echo "--dry-run") --namespace="$NAMESPACE"
