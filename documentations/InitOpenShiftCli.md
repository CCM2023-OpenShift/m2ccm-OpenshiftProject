# 1️⃣ Install Openshift CLI

## MacOs
```shell
brew install openshift-cli
```

## Windows
```batch
choco install openshift-cli -y
```

## Linux
```shell
sudo -s
curl -LO https://mirror.openshift.com/pub/openshift-v4/clients/oc/latest/linux/oc.tar.gz
tar -xvzf oc.tar.gz
mv oc /usr/local/bin
```

# Vérifier installation
```shell
oc version
```

# 2️⃣ Se connecter à ton OpenShift Developer Sandbox
## Trouver la ligne de commande pour se connecter
 - Se rendre sur l'url https://console.redhat.com/openshift/sandbox/ et cliquez sur "Essayer"
 - Dans la catégorie Red hat / Openshift cliquer sur "Launch"
 - Une fois sur le site (tel que : https://console-openshift-console.apps.rm3.7wse.p1.openshiftapps.com/):
 - Une fois sur la console OpenShift (https://console-openshift-console.apps...), clique sur "?" en haut à droite.
 - Sélectionne "Command Line Tools". 
 - Cliquer sur "Copier la commande de connexion" et récupérer la commande fournie.

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

## Utiliser le bon porjet
```shell
oc project lmagniez03-dev
```
 