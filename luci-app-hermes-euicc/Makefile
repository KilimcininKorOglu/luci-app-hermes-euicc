# SPDX-License-Identifier: AGPL-3.0-only

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-hermes-euicc
PKG_VERSION:=1.0.1
PKG_RELEASE:=51
PKG_MAINTAINER:=Giammarco M. <stich86@gmail.com>
PKG_LICENSE:=AGPL-3.0-only

LUCI_TITLE:=LuCI Hermes eUICC - eSIM Profile Manager
LUCI_DESCRIPTION:=LuCI web interface for managing eSIM profiles via Hermes eUICC Manager. \
 Provides a modern web interface for eSIM profile management using Hermes eUICC. \
 Features include: \
  - Profile listing, enabling, disabling, and deletion \
  - Profile download via QR code or manual entry \
  - SM-DS discovery and automatic profile download \
  - Notification management (process, remove) \
  - Support for AT, QMI, and MBIM APDU drivers \
  - Chip information display (storage, capabilities, versions) \
  - Dark mode support

LUCI_DEPENDS:=+luci-base +coreutils +coreutils-timeout +uqmi +mbim-utils
LUCI_EXTRA_DEPENDS:=hermes-euicc
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

$(eval $(call BuildPackage,luci-app-hermes-euicc))
