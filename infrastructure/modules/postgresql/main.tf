resource "kubernetes_deployment" "postgresql" {
  metadata {
    name      = "postgresql"
    namespace = "default"
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
        container {
          name  = "postgresql"
          image = "postgres:15"

          env {
            name  = "POSTGRES_USER"
            value = "postgres"
          }
          env {
            name  = "POSTGRES_PASSWORD"
            value = "supersecurepassword"
          }
          env {
            name  = "POSTGRES_DB"
            value = "mydatabase"
          }

          port {
            container_port = 5432
          }

          volume_mount {
            mount_path = "/var/lib/postgresql/data"
            name       = "postgresql-storage"
          }
        }
        volume {
          name = "postgresql-storage"
          persistent_volume_claim {
            claim_name = "postgresql-pvc"
          }
        }
      }
    }
  }
}

resource "kubernetes_persistent_volume_claim" "postgresql_pvc" {
  metadata {
    name      = "postgresql-pvc"
    namespace = "default"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }
}

resource "kubernetes_service" "postgresql" {
  metadata {
    name      = "postgresql"
    namespace = "default"
  }
  spec {
    selector = {
      app = "postgresql"
    }
    port {
      port        = 5432
      target_port = 5432
    }
  }
}
