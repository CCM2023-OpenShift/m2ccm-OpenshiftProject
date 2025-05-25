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

# === Options globales ===
QUIET=false
DRY_RUN=false
LOG_FILE="clean.log"

# === Couleurs ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# === Logger ===
log() {
  local level="$1"
  local msg="$2"
  local colored=""

  case "$level" in
    INFO)    colored="${CYAN}ℹ️  $msg${NC}" ;;
    SUCCESS) colored="${GREEN}✅ $msg${NC}" ;;
    WARN)    colored="${YELLOW}⚠️  $msg${NC}" ;;
    ERROR)   colored="${RED}❌ $msg${NC}" ;;
    *)       colored="$msg" ;;
  esac

  echo -e "$colored"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $level: $msg" >> "$LOG_FILE"
}

# === Exécuteur conditionnel ===
run() {
  if $DRY_RUN; then
    log INFO "[dry-run] $*"
  else
    eval "$@"
  fi
}

# === Gestion des arguments ===
for arg in "$@"; do
  case $arg in
    --quiet) QUIET=true ;;
    --dry-run) DRY_RUN=true ;;
    --help)
      echo "Usage: $0 [--quiet] [--dry-run]"
      exit 0
      ;;
  esac
done

log INFO "🧹 Bienvenue dans le script de nettoyage OpenShift"

if ! $QUIET; then
  read -p "🧾 Entrez le namespace à nettoyer : " NAMESPACE
else
  NAMESPACE="${NAMESPACE:-default}"
  log INFO "Mode silencieux : namespace = $NAMESPACE"
fi

if [[ -z "$NAMESPACE" ]]; then
  log ERROR "Le namespace est obligatoire."
  exit 1
fi

if ! oc get namespace "$NAMESPACE" &> /dev/null; then
  log ERROR "Le namespace '$NAMESPACE' n'existe pas."
  exit 1
fi

log INFO "🎯 Namespace cible : $NAMESPACE"

if ! $QUIET; then
  echo -e "${CYAN}📋 Que souhaitez-vous nettoyer ?${NC}"
  echo "  1) Tout nettoyer"
  echo "  2) Seulement PostgreSQL"
  echo "  3) Seulement Keycloak"
  echo "  4) Seulement Monitoring"
  echo "  5) Seulement Quarkus"
  read -p "👉 Choisissez une option (1-5) : " CHOICE
else
  CHOICE=1
  log INFO "Mode silencieux : nettoyage complet sélectionné (option 1)"
fi

clean_postgresql() {
  log INFO "🔻 Suppression PostgreSQL..."
  run "oc delete deployment postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete service postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete pvc postgresql-pvc --ignore-not-found -n $NAMESPACE"
  run "oc delete route postgresql --ignore-not-found -n $NAMESPACE"
}

clean_keycloak() {
  log INFO "🔻 Suppression Keycloak..."
  run "oc delete deployment keycloak --ignore-not-found -n $NAMESPACE"
  run "oc delete deployment keycloak-postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete service keycloak --ignore-not-found -n $NAMESPACE"
  run "oc delete service keycloak-postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete route keycloak --ignore-not-found -n $NAMESPACE"
  run "oc delete configmap keycloak-realm-config --ignore-not-found -n $NAMESPACE"
}

clean_monitoring() {
  log INFO "🔻 Suppression Monitoring (Prometheus + Grafana)..."
  run "oc delete deployment prometheus --ignore-not-found -n $NAMESPACE"
  run "oc delete deployment grafana --ignore-not-found -n $NAMESPACE"
  run "oc delete service prometheus --ignore-not-found -n $NAMESPACE"
  run "oc delete service grafana --ignore-not-found -n $NAMESPACE"
  run "oc delete serviceaccount prometheus --ignore-not-found -n $NAMESPACE"
  run "oc delete serviceaccount grafana --ignore-not-found -n $NAMESPACE"
  run "oc delete configmap prometheus-config --ignore-not-found -n $NAMESPACE"
  run "oc delete configmap prometheus-rules --ignore-not-found -n $NAMESPACE"
  run "oc delete configmap grafana-dashboard-provider-config --ignore-not-found -n $NAMESPACE"
  run "oc delete configmap grafana-dashboard-config --ignore-not-found -n $NAMESPACE"
}

clean_quarkus() {
  log INFO "🔻 Suppression Quarkus..."
  run "oc delete deployment quarkus-app --ignore-not-found -n $NAMESPACE"
  run "oc delete service quarkus-service --ignore-not-found -n $NAMESPACE"
  run "oc delete route quarkus-route --ignore-not-found -n $NAMESPACE"
}

# === Exécution selon le choix ===
case $CHOICE in
  1) clean_postgresql; clean_keycloak; clean_monitoring; clean_quarkus ;;
  2) clean_postgresql ;;
  3) clean_keycloak ;;
  4) clean_monitoring ;;
  5) clean_quarkus ;;
  *) log ERROR "Option invalide."; exit 1 ;;
esac

log SUCCESS "✅ Nettoyage terminé dans le namespace $NAMESPACE."
