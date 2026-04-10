variable "region" {
  description = "Azure region"
  default     = "koreacentral"
}
variable "environment" {
  description = "Environment name"
  default     = "dev"
}
variable "node_count" {
  description = "Number of AKS nodes"
  default     = 1 
}
variable "node_size" {
  description = "VM Size for regular tier"
  default     = "Standard_D2s_v3"
}
variable "spot_node_size" {
  description = "VM Size for spot tier"
  default     = "Standard_D2s_v3"
}
