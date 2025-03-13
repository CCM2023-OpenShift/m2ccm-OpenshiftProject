resource "kubernetes_persistent_volume_claim" "postgresql_pvc" {
  metadata {
    name      = "postgresql-pvc"
    namespace = var.namespace
  }

  spec {
    access_modes       = ["ReadWriteOnce"]
    storage_class_name = "gp3"  # Using AWS EBS gp3 (WaitForFirstConsumer mode)
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }

  timeouts {
    create = "5m"  # Extended timeout for creation
  }

  lifecycle {
    ignore_changes = [
      spec[0].volume_name  # Ignore changes to volume_name after binding
    ]
  }
}

resource "kubernetes_deployment" "postgresql" {
  metadata {
    name      = "postgresql"
    namespace = var.namespace
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "postgresql"
      }
    }
    template {
      metadata {
        labels = {
          app = "postgresql"
        }
      }
      spec {
        security_context {
          run_as_user     = 1013330000
          fs_group        = 1013330000
          run_as_non_root = true
        }
        container {
          name  = "postgresql"
          image = "registry.redhat.io/rhel9/postgresql-15"  # OpenShift-certified image
          env {
            name  = "POSTGRES_DB"
            value = var.db_name
          }
          env {
            name  = "POSTGRES_USER"
            value = var.db_user
          }
          env {
            name  = "POSTGRES_PASSWORD"
            value = var.db_password
          }
          env {
            name  = "POSTGRES_INITDB_ARGS"
            value = "--nosync --no-locale --username=admin"
          }
          env {
            name  = "PGDATA"
            value = "/var/lib/pgsql/data"
          }
          port {
            container_port = 5432
          }
          volume_mount {
            name       = "postgresql-storage"
            mount_path = "/var/lib/pgsql/data"
          }
        }
        volume {
          name = "postgresql-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.postgresql_pvc.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "postgresql" {
  metadata {
    name      = "postgresql-service"
    namespace = var.namespace
  }
  spec {
    selector = {
      app = "postgresql"
    }
    port {
      protocol    = "TCP"
      port        = 5432
      target_port = 5432
    }
  }
}
