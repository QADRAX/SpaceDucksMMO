resource "azurerm_servicebus_namespace" "service_bus" {
  name                = "${local.prefix}-service-bus"
  resource_group_name = azurerm_resource_group.app_resource_group.name
  location            = azurerm_resource_group.app_resource_group.location
  sku                 = "Basic"

  identity {
    type = "UserAssigned"
    identity_ids = [
      azurerm_user_assigned_identity.managed_identity.id
    ]
  }
}