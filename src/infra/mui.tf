resource "azurerm_user_assigned_identity" "managed_identity" {
  name                = "${local.prefix}-identity"
  resource_group_name = azurerm_resource_group.app_resource_group.name
  location            = azurerm_resource_group.app_resource_group.location
}