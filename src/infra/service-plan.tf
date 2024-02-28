resource "azurerm_service_plan" "service_plan" {
  name = "${local.prefix}-plan"

  location            = azurerm_resource_group.app_resource_group.location
  resource_group_name = azurerm_resource_group.app_resource_group.name

  os_type  = "Windows"
  sku_name = "B1"
}
