terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0.2"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}

locals {
  prefix = "SpaceDucks"
}

resource "azurerm_resource_group" "app_resource_group" {
  name     = "${local.prefix}-rg"
  location = "westeurope"
}
