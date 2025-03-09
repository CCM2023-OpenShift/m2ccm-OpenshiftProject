terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.10"
    }
  }
}

provider "kubernetes" {
  host     = "https://api.rm3.7wse.p1.openshiftapps.com:6443"
  token    = "sha256~mpBhP4em0z3zyUmSyJOnv-Q6qJGdIbfhNq3i1fNbEAM"
  insecure = true
}

module "postgresql" {
  source      = "./modules/postgresql"
  namespace   = var.namespace
  db_name     = "mydatabase"
  db_user     = "admin"
  db_password = "SuperSecret"
}
