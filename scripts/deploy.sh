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
LOG_FILE="deploy.log"

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

log INFO "Bienvenue dans le script de déploiement OpenShift"

if ! $QUIET; then
  read -p "🧾 Entrez le namespace cible : " NAMESPACE
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

log INFO "Namespace choisi : $NAMESPACE"

if ! $QUIET; then
  echo -e "${CYAN}📋 Que souhaitez-vous déployer ?${NC}"
  echo "  1) Tout déployer"
  echo "  2) Seulement PostgreSQL"
  echo "  3) Seulement Keycloak"
  echo "  4) Seulement Monitoring"
  echo "  5) Seulement Quarkus"
  echo "  6) Seulement Frontend"
  read -p "👉 Choisissez une option (1-6) : " CHOICE
else
  CHOICE=1
  log INFO "Mode silencieux : déploiement complet sélectionné (option 1)"
fi

deploy_postgresql() {
  log INFO "Nettoyage PostgreSQL..."
  run "oc delete deployment postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete service postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete pvc postgresql-pvc --ignore-not-found -n $NAMESPACE"
  run "oc delete route postgresql --ignore-not-found -n $NAMESPACE"

  log INFO "Déploiement PostgreSQL..."
  run "oc apply -f $ROOT_DIR/scripts/deploys-configs/database/postgresql-pvc.yaml -n $NAMESPACE"
  run "oc apply -f $ROOT_DIR/scripts/deploys-configs/database/postgresql-deployment.yaml -n $NAMESPACE"
  run "oc apply -f $ROOT_DIR/scripts/deploys-configs/database/postgresql-service.yaml -n $NAMESPACE"
}

deploy_keycloak() {
  log INFO "Nettoyage Keycloak..."
  run "oc delete deployment keycloak --ignore-not-found -n $NAMESPACE"
  run "oc delete deployment keycloak-postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete service keycloak --ignore-not-found -n $NAMESPACE"
  run "oc delete service keycloak-postgresql --ignore-not-found -n $NAMESPACE"
  run "oc delete route keycloak --ignore-not-found -n $NAMESPACE"
  run "oc delete configmap keycloak-realm-config --ignore-not-found -n $NAMESPACE"

  log INFO "Déploiement ConfigMap Keycloak..."
  run "oc apply -f $ROOT_DIR/infrastructure/keycloak/keycloak-realm-config.yaml -n $NAMESPACE"

  log INFO "Déploiement Keycloak et base..."
  run "oc apply -f $ROOT_DIR/infrastructure/keycloak/keycloak-postgresql-deployment.yaml -n $NAMESPACE"
  run "oc apply -f $ROOT_DIR/infrastructure/keycloak/keycloak-deployment.yaml -n $NAMESPACE"
}

deploy_monitoring() {
  log INFO "Nettoyage Monitoring (Prometheus, Grafana)..."
  run "oc delete deployment prometheus --ignore-not-found -n $NAMESPACE"
  run "oc delete deployment grafana --ignore-not-found -n $NAMESPACE"
  run "oc delete service prometheus --ignore-not-found -n $NAMESPACE"
  run "oc delete service grafana --ignore-not-found -n $NAMESPACE"
  run "oc delete serviceaccount prometheus --ignore-not-found -n $NAMESPACE"
  run "oc delete serviceaccount grafana --ignore-not-found -n $NAMESPACE"

  log INFO "Déploiement ConfigMaps Prometheus..."
  run "oc apply -f $ROOT_DIR/infrastructure/monitoring/prometheus/prometheus-config.yaml -n $NAMESPACE"
  run "oc apply -f $ROOT_DIR/infrastructure/monitoring/prometheus/prometheus-rules.yaml -n $NAMESPACE"

  log INFO "Déploiement Prometheus..."
  run "oc apply -f $ROOT_DIR/infrastructure/monitoring/prometheus/monitoring.yaml -n $NAMESPACE"

  log INFO "Déploiement ConfigMaps Grafana..."
  run "oc apply -f $ROOT_DIR/infrastructure/monitoring/grafana/grafana-dashboard-provider-config.yaml -n $NAMESPACE"
  run "oc apply -f $ROOT_DIR/infrastructure/monitoring/grafana/grafana-dashboard-config.yaml -n $NAMESPACE"

  log INFO "Déploiement Grafana..."
  run "oc apply -f $ROOT_DIR/infrastructure/monitoring/grafana/monitoring.yaml -n $NAMESPACE"
}

deploy_quarkus() {
  log INFO "Nettoyage Quarkus..."
  run "oc delete deployment quarkus-app --ignore-not-found -n $NAMESPACE"
  run "oc delete service quarkus-service --ignore-not-found -n $NAMESPACE"
  run "oc delete route quarkus-route --ignore-not-found -n $NAMESPACE"

  log INFO "Compilation Maven en legacy-jar..."
  if ! $DRY_RUN; then ./mvnw clean package -Dquarkus.package.jar.type=legacy-jar; fi

  if [[ ! -f "$ROOT_DIR/src/main/docker/Dockerfile.legacy-jar" ]]; then
    log ERROR "Dockerfile.legacy-jar introuvable."
    exit 1
  fi

  log INFO "Création de la BuildConfig Quarkus si nécessaire..."
  if oc get bc quarkus-app -n $NAMESPACE &> /dev/null; then
    log INFO "BuildConfig quarkus-app existe déjà"
  else
    run "oc new-build --name=quarkus-app --binary --strategy=docker --to=quarkus-app:latest -n $NAMESPACE"
  fi

  log INFO "Build Quarkus OpenShift..."
  run "oc start-build quarkus-app --from-dir=$ROOT_DIR --follow -n $NAMESPACE"

  log INFO "Déploiement Quarkus..."
  if ! $DRY_RUN; then
    sed "s/__NAMESPACE__/$NAMESPACE/g" "$ROOT_DIR/infrastructure/quarkus-deployment.yaml" | oc apply -n $NAMESPACE -f -
  fi
  run "oc apply -f $ROOT_DIR/infrastructure/quarkus-service.yaml -n $NAMESPACE"
  run "oc apply -f $ROOT_DIR/infrastructure/quarkus-route.yaml -n $NAMESPACE"
}

deploy_frontend() {
  log INFO "Nettoyage Frontend..."
  run "oc delete deployment frontend --ignore-not-found -n $NAMESPACE"
  run "oc delete service frontend --ignore-not-found -n $NAMESPACE"
  run "oc delete route frontend --ignore-not-found -n $NAMESPACE"

  if [[ ! -f "$ROOT_DIR/front/Dockerfile" ]]; then
    log ERROR "Dockerfile non trouvé dans '$ROOT_DIR/front'."
    exit 1
  fi

  log INFO "Création image frontend (build Docker)..."
  if oc get bc frontend -n $NAMESPACE &> /dev/null; then
    log INFO "BuildConfig frontend existe déjà"
  else
    run "oc new-build --name=frontend --binary --strategy=docker --to=frontend:latest -n $NAMESPACE"
  fi

  run "oc start-build frontend --from-dir=$ROOT_DIR/front --follow -n $NAMESPACE"

  log INFO "Déploiement Frontend..."
  if ! $DRY_RUN; then
    sed "s/__NAMESPACE__/$NAMESPACE/g" "$ROOT_DIR/infrastructure/frontend/frontend-deployment.yaml" | oc apply -n $NAMESPACE -f -
  fi
  run "oc apply -f $ROOT_DIR/infrastructure/frontend/frontend-service.yaml -n $NAMESPACE"
  run "oc apply -f $ROOT_DIR/infrastructure/frontend/frontend-route.yaml -n $NAMESPACE"
}

# === Exécution ===
case $CHOICE in
  1) deploy_postgresql; deploy_keycloak; deploy_monitoring; deploy_quarkus; deploy_frontend ;;
  2) deploy_postgresql ;;
  3) deploy_keycloak ;;
  4) deploy_monitoring ;;
  5) deploy_quarkus ;;
  6) deploy_frontend ;;
  *) log ERROR "Option invalide. Fin du script."; exit 1 ;;
esac

log INFO "Attente que tous les pods soient prêts dans le namespace $NAMESPACE..."

TIMEOUT=120
INTERVAL=5
ELAPSED=0

if ! $DRY_RUN; then
  while true; do
    NOT_READY=$(oc get pods -n "$NAMESPACE" --no-headers -o custom-columns=READY:.status.containerStatuses[*].ready | grep -v "^true$" | wc -l)

    if [[ "$NOT_READY" -eq 0 ]]; then
      log SUCCESS "Tous les pods sont prêts."
      break
    fi

    if [[ $ELAPSED -ge $TIMEOUT ]]; then
      log WARN "Timeout atteint, certains pods ne sont pas prêts :"
      oc get pods -n "$NAMESPACE"
      exit 1
    fi

    log INFO "Attente, pods non prêts : $NOT_READY... ($ELAPSED/$TIMEOUT sec)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  done
else
  log INFO "[dry-run] Attente des pods simulée (aucune vérification réelle)"
fi

log SUCCESS "Déploiement terminé dans le namespace : $NAMESPACE"
