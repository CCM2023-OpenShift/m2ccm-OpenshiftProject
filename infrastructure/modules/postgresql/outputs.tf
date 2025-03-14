output "database_url" {
  value = "postgresql://${var.db_user}:${var.db_password}@postgresql-service.${var.namespace}.svc.cluster.local:5432/${var.db_name}"
  sensitive = true
}
