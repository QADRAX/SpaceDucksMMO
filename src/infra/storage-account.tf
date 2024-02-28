resource "azurerm_storage_account" "storage" {
  name                     = lower("${local.prefix}storage")
  resource_group_name      = azurerm_resource_group.app_resource_group.name
  location                 = azurerm_resource_group.app_resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  identity {
    type = "UserAssigned"
    identity_ids = [
      azurerm_user_assigned_identity.managed_identity.id
    ]
  }
}
