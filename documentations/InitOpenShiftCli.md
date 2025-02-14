# 1️⃣ Install Openshift CLI

## MacOs
```shell
brew install openshift-cli
```

## Windows
```batch
choco install openshift-cli
```

## Linux
```shell
apt install openshift-cli
```

# Vérifier installation
```shell
oc version
```

# 2️⃣ Se connecter à ton OpenShift Developer Sandbox
## Trouver la ligne de commande pour se connecter
 - Se rendre sur l'url https://www.redhat.com/fr/products/trials et cliquez sur "Essayer"
 - Tout en bas à gauche "Developper sandbox"
 - Dans la catégorie Red hat / Openshift cliquer sur "Launch"
 - Une fois sur le site (tel que : https://console-openshift-console.apps.rm3.7wse.p1.openshiftapps.com/):
 - Une fois sur la console OpenShift (https://console-openshift-console.apps...), clique sur "?" en haut à droite.
 - Sélectionne "Command Line Tools". 
 - Copie la commande oc login fournie.

## Se connecter
# ⚠️ Ne fonctionne pas sur la co de l'UPJV car port non autorisé
```shell
oc login --token=sha256~xxxxx --server=https://api.rm3.7wse.p1.openshiftapps.com:6443 
```

## Tester
```shell
oc whoami
oc project
```
 