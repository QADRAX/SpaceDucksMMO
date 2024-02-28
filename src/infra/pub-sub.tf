resource "azurerm_web_pubsub" "web_pubsub" {
  name                = "${local.prefix}-pubsub"
  resource_group_name = azurerm_resource_group.app_resource_group.name
  location            = azurerm_resource_group.app_resource_group.location
  sku                 = "Free_F1"

  identity {
    type = "UserAssigned"
    identity_ids = [
      azurerm_user_assigned_identity.managed_identity.id
    ]
  }
}
    
