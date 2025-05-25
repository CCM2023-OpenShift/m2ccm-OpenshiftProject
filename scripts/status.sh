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

if [[ -z "$NAMESPACE" ]]; then
  echo "❌ Usage : $0 <namespace>"
  exit 1
fi

if ! oc get namespace "$NAMESPACE" &> /dev/null; then
  echo "❌ Le namespace '$NAMESPACE' n'existe pas."
  exit 1
fi

echo "🔎 État du namespace : $NAMESPACE"
echo "------------------------------"

# Résumés
oc get deployments -n "$NAMESPACE"
echo ""
oc get services -n "$NAMESPACE"
echo ""
oc get routes -n "$NAMESPACE"
echo ""
oc get pvc -n "$NAMESPACE"
echo ""
oc get configmap -n "$NAMESPACE"
echo ""
oc get pods -n "$NAMESPACE"
