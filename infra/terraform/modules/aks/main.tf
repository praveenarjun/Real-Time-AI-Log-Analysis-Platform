variable "resource_group_name" {}
variable "location" {}
variable "environment" {}
variable "node_count" {}
variable "node_size" {}
variable "spot_node_size" {}


resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-log-analyzer-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "aks-log-analyzer"

  # ---------------------------------------------------------
  # 1. System Node Pool (The "Brain")
  # ---------------------------------------------------------
  # Azure requires at least 2 vCPUs and 4GB RAM for System Pools.
  # B-series VMs are not supported for the System Pool.
  default_node_pool {
    name                = "systempool"
    node_count          = var.node_count
    vm_size             = "Standard_D2s_v3" # Explicitly set to bypass SKU error
    type                = "VirtualMachineScaleSets"
    os_disk_type        = "Managed"
    
    # Label to help distinguish it from the Spot pool
    node_labels = {
      "pool_type" = "system"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  # Necessary for pull access to ACR if not defined elsewhere
  role_based_access_control_enabled = true
}

# ---------------------------------------------------------
# 2. User Node Pool (The "Muscle" - SPOT)
# ---------------------------------------------------------
resource "azurerm_kubernetes_cluster_node_pool" "spotpool" {
  name                  = "spotpool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.aks.id
  vm_size               = var.spot_node_size
  node_count            = 1 # Keep it at 1 to save credits

  # Spot Configuration
  priority        = "Spot"
  eviction_policy = "Delete"
  spot_max_price  = -1 # Pay up to the current market price

  # Critical Labels & Taints for Scheduling
  node_labels = {
    "agentpool"                              = "spotpool"
    "kubernetes.azure.com/scalesetpriority" = "spot"
  }

  # This Taint prevents the "Brain" pods from accidentally running here
  node_taints = [
    "kubernetes.azure.com/scalesetpriority=spot:NoSchedule"
  ]
}

# ---------------------------------------------------------
# Outputs
# ---------------------------------------------------------
output "kubelet_identity_object_id" {
  value = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}

output "aks_id" {
  value = azurerm_kubernetes_cluster.aks.id
}