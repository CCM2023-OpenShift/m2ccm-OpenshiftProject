terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35.1"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

module "postgresql" {
  source = "./modules/postgresql"
}
