#
# Copyright (C) 2025 Kilimcinin Kör Oğlu <k@keremgok.tr>
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=hermes-euicc
PKG_VERSION:=1.0.0
PKG_RELEASE:=54

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/KilimcininKorOglu/hermes-euicc-manager.git
PKG_SOURCE_VERSION:=HEAD
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Kilimcinin Kör Oğlu <k@keremgok.tr>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/KilimcininKorOglu/euicc-go/app
GO_PKG_BUILD_PKG:=$(GO_PKG)

# 设置版本信息通过 ldflags
GO_PKG_LDFLAGS_X:= \
	main.Version=$(PKG_VERSION) \
	main.Release=$(PKG_RELEASE)

# 添加 OpenWrt 构建标签以启用 UCI 支持
GO_PKG_TAGS:=openwrt

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/hermes-euicc
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=eSIM profile management tool for eUICC devices
  URL:=https://github.com/KilimcininKorOglu/hermes-euicc-manager
  DEPENDS:=$(GO_ARCH_DEPENDS) +coreutils +coreutils-timeout
endef

define Package/hermes-euicc/description
  Hermes eUICC Manager is a command-line tool for managing eSIM profiles
  on eUICC-enabled devices. Supports QMI, MBIM, and AT command drivers.
  
  Features:
   - Profile listing, enabling, disabling, and deletion
   - Profile download via activation codes
   - SM-DS discovery and automatic profile download
   - Notification management
   - Chip information display
   - Cross-platform driver support (QMI, MBIM, AT)
   - UCI configuration support for OpenWRT
endef

define Package/hermes-euicc/conffiles
/etc/config/hermes-euicc
endef

define Package/hermes-euicc/install
	$(call GoPackage/Package/Install/Bin,$(1))
	
	# 重命名二进制文件为 hermes-euicc
	mv $(1)/usr/bin/app $(1)/usr/bin/hermes-euicc
	
	# 创建 UCI 配置目录并安装基础配置文件
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/hermes-euicc.config $(1)/etc/config/hermes-euicc
endef

$(eval $(call GoBinPackage,hermes-euicc))
$(eval $(call BuildPackage,hermes-euicc))
