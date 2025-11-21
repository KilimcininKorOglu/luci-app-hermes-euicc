# SPDX-License-Identifier: MIT

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-hermes-euicc
PKG_VERSION:=1.0.1
PKG_RELEASE:=66
PKG_MAINTAINER:=Kilimcinin Kör Oğlu <k@keremgok.tr>
PKG_LICENSE:=MIT

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

LUCI_DEPENDS:=+luci-base +coreutils +coreutils-timeout +uqmi +mbim-utils +hermes-euicc
//LUCI_EXTRA_DEPENDS:=hermes-euicc
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-hermes-euicc/postinst
#!/bin/sh
# 智能配置文件管理
if [ -z "$${IPKG_INSTROOT}" ]; then
	# 检查配置文件是否已存在
	if [ -f /etc/config/hermes-euicc ]; then
		# 配置文件已存在（由后端程序提供）
		# 检查是否是基础配置（只有5个选项）
		option_count=$$(grep -c "^[[:space:]]*option " /etc/config/hermes-euicc)
		if [ "$$option_count" -le 5 ]; then
			# 是基础配置，用完整配置替换
			echo "Upgrading hermes-euicc configuration to full version..."
			cp -f /usr/share/luci-app-hermes-euicc/hermes-euicc.config /etc/config/hermes-euicc
		else
			# 已经是完整配置，保留用户修改
			echo "Keeping existing hermes-euicc configuration..."
		fi
	else
		# 配置文件不存在，创建完整配置
		echo "Creating hermes-euicc configuration..."
		mkdir -p /etc/config
		cp -f /usr/share/luci-app-hermes-euicc/hermes-euicc.config /etc/config/hermes-euicc
	fi
fi
exit 0
endef

define Package/luci-app-hermes-euicc/install
	# 安装 Controller
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
	$(INSTALL_DATA) ./luasrc/controller/hermes-euicc.lua $(1)/usr/lib/lua/luci/controller/hermes-euicc.lua
	
	# 安装 CBI Model
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/model/cbi
	$(INSTALL_DATA) ./luasrc/model/cbi/hermes-euicc.lua $(1)/usr/lib/lua/luci/model/cbi/hermes-euicc.lua
	
	# 安装 View 模板
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/view/hermes-euicc
	$(INSTALL_DATA) ./luasrc/view/hermes-euicc/*.htm $(1)/usr/lib/lua/luci/view/hermes-euicc/
	
	# 安装静态资源
	$(INSTALL_DIR) $(1)/www/luci-static/resources/hermes-euicc
	cp -pR ./htdocs/luci-static/resources/hermes-euicc/* $(1)/www/luci-static/resources/hermes-euicc/
	
	# 安装菜单定义
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/menu.d/luci-app-hermes-euicc.json $(1)/usr/share/luci/menu.d/luci-app-hermes-euicc.json
	
	# 安装 ACL 权限（如果存在）
	[ ! -f ./root/usr/share/rpcd/acl.d/luci-app-hermes-euicc.json ] || { \
		$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d; \
		$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-hermes-euicc.json $(1)/usr/share/rpcd/acl.d/luci-app-hermes-euicc.json; \
	}
	
	# 安装完整配置文件模板到 /usr/share（不直接安装到 /etc/config）
	$(INSTALL_DIR) $(1)/usr/share/luci-app-hermes-euicc
	$(INSTALL_DATA) ./root/etc/config/hermes-euicc $(1)/usr/share/luci-app-hermes-euicc/hermes-euicc.config
endef

$(eval $(call BuildPackage,luci-app-hermes-euicc))
