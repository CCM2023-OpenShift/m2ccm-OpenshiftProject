# Makefile principal pour gestion des scripts OpenShift

# Répertoire des scripts
SCRIPTS_DIR := ./scripts

# Namespace par défaut (modifiable via la ligne de commande)
NAMESPACE ?= lmagniez03-dev

# Aide
.PHONY: help
help:
	@echo "📘 Commandes disponibles :"
	@echo ""
	@echo "  make deploy      NAMESPACE=<ns>   ➤ Déployer les composants dans le namespace"
	@echo "  make clean       NAMESPACE=<ns>   ➤ Nettoyer les composants dans le namespace"
	@echo "  make reset       NAMESPACE=<ns>   ➤ Nettoyer puis déployer dans le namespace"
	@echo "  make status      NAMESPACE=<ns>   ➤ Afficher l'état des pods"
	@echo "  make help                          ➤ Afficher cette aide"
	@echo ""
	@echo "🔧 Namespace utilisé par défaut : '$(NAMESPACE)' (modifiable avec NAMESPACE=...)"

# Déploiement
.PHONY: deploy
deploy:
	@echo "🚀 Déploiement dans le namespace : $(NAMESPACE)"
	@bash ./$(SCRIPTS_DIR)/deploy.sh --namespace=$(NAMESPACE)

clean:
	@echo "🧹 Nettoyage dans le namespace : $(NAMESPACE)"
	@bash ./$(SCRIPTS_DIR)/clean.sh --namespace=$(NAMESPACE)

reset:
	@echo "♻️  Réinitialisation dans le namespace : $(NAMESPACE)"
	@$(MAKE) clean NAMESPACE=$(NAMESPACE)
	@$(MAKE) deploy NAMESPACE=$(NAMESPACE)

status:
	@echo "📊 État des pods dans le namespace : $(NAMESPACE)"
	@bash ./$(SCRIPTS_DIR)/status.sh --namespace=$(NAMESPACE)
