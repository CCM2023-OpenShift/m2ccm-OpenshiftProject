variable "namespace" {
  description = "Namespace dans lequel déployer PostgreSQL"
  type        = string
  default     = "prohart80-dev"
}

variable "db_name" {
  description = "Nom de la base PostgreSQL"
  type        = string
  default     = "mydatabase"
}

variable "db_user" {
  description = "Nom d'utilisateur PostgreSQL"
  type        = string
  default     = "quarkus"
}

variable "db_password" {
  description = "Mot de passe PostgreSQL"
  type        = string
  sensitive   = true
  default     = "QuarkusSecret"
}

variable "db_admin_password" {
    description = "Admin password for PostgreSQL"
    type        = string
    sensitive   = true
    default     = "SuperSecretAdmin"
}
