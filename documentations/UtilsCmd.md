# TESTS
## Database
```shell
oc exec -it $(oc get pods -l app=postgresql -o jsonpath='{.items[0].metadata.name}') -- psql -U admin -d mydatabase
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