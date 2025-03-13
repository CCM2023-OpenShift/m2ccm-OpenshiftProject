resource "kubernetes_deployment" "postgresql_deployment" {
  metadata {
    name      = "postgresql-deployment"
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
            name  = "POSTGRESQL_DATABASE"
            value = var.db_name
          }
          env {
            name  = "POSTGRESQL_USER"
            value = var.db_user
          }
          env {
            name  = "POSTGRESQL_PASSWORD"
            value = var.db_password
          }
          env {
            name  = "POSTGRESQL_ADMIN_PASSWORD"
            value = var.db_admin_password
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
          empty_dir {}  # Utilisation d'un emptyDir au lieu d'un PVC
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