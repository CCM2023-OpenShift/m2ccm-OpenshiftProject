#!/bin/bash

configFolder="./deploys-config/database"

echo "🔄 Suppression des anciennes ressources PostgreSQL..."
oc delete deployment postgresql --ignore-not-found
oc delete service postgresql --ignore-not-found
oc delete pvc postgresql-pvc --ignore-not-found
oc delete route postgresql --ignore-not-found
echo "✅ Suppression terminée."

echo "🚀 Déploiement de PostgreSQL..."
oc apply -f $configFolder/postgresql-pvc.yaml
oc apply -f $configFolder/postgresql-deployment.yaml
oc apply -f $configFolder/postgresql-service.yaml
echo "⏳ Attente du démarrage du pod..."
sleep 10

echo "🌐 Exposition du service PostgreSQL..."
oc expose service postgresql

echo "📦 Liste des pods PostgreSQL :"
oc get pods -l app=postgresql
