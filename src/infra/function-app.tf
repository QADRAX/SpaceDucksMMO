
resource "azurerm_windows_function_app" "function_app" {
  name = "${local.prefix}-functions"

  location            = azurerm_resource_group.app_resource_group.location
  resource_group_name = azurerm_resource_group.app_resource_group.name
  service_plan_id     = azurerm_service_plan.service_plan.id

  storage_account_name       = azurerm_storage_account.storage.name
  storage_account_access_key = azurerm_storage_account.storage.primary_access_key

  site_config {

  }

  identity {
    type = "UserAssigned"
    identity_ids = [
      azurerm_user_assigned_identity.managed_identity.id
    ]
  }
}
