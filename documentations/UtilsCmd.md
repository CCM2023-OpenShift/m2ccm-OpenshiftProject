# TESTS
## Database
#### COMPTE SANS DROIT
```shell
oc exec -it postgresql-deployment-667798fc49-4crtk -- psql -U myuser -d mydb
```
#### COMPTE ADMIN
```shell
oc exec -it postgresql-deployment-667798fc49-4crtk -- psql -U postgres -d mydb
```
```sql
SELECT version();
```
# Resources
## GET
```shell
oc get deployments -n prohart80-dev
```
### service
```shell
oc get svc -n prohart80-dev
```
# PVC
## GET
```shell
oc get pvc -n prohart80-dev postgresql-pvc
```
## DELETE
```shell
oc delete pvc -n prohart80-dev postgresql-pvc
```
# Images
```shell
oc get is quarkus-app -n prohart80-dev
```
# Terraform
## apply
```shell
terraform apply -auto-approve
```