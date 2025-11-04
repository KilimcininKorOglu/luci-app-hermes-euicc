-- /usr/lib/lua/luci/controller/hermes-euicc.lua
-- Controller for Hermes eUICC Manager LuCI Interface

module("luci.controller.hermes-euicc", package.seeall)

local json = require "luci.jsonc"
local sys = require "luci.sys"
local util = require "luci.util"
local uci = require "luci.model.uci".cursor()

function index()
    -- Main entry with tabs
    local page = entry({"admin", "modem", "hermes-euicc"}, firstchild(), _("Hermes eSIM Manager"), 60)
    page.dependent = false

    -- Tab pages
    entry({"admin", "modem", "hermes-euicc", "info"}, template("hermes-euicc/info"), _("eSIM Info"), 1)
    entry({"admin", "modem", "hermes-euicc", "profiles_view"}, template("hermes-euicc/profiles"), _("Profiles"), 2)
    entry({"admin", "modem", "hermes-euicc", "download_view"}, template("hermes-euicc/download"), _("Download Profile"), 3)
    entry({"admin", "modem", "hermes-euicc", "notifications_view"}, template("hermes-euicc/notifications"), _("Notifications"), 4)
    entry({"admin", "modem", "hermes-euicc", "settings"}, template("hermes-euicc/config"), _("Configuration"), 5)

    -- API endpoints
    entry({"admin", "modem", "hermes-euicc", "api_status"}, call("hermes_status"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_chip_info"}, call("hermes_chip_info"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_profiles"}, call("hermes_profiles"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_toggle"}, call("hermes_toggle"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_config"}, call("hermes_config"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_saveconfig"}, call("hermes_save_config"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_download"}, call("hermes_download_profile"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_delete"}, call("hermes_delete_profile"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_nickname"}, call("hermes_change_nickname"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_notifications"}, call("hermes_notifications"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_notification_process"}, call("hermes_notification_process"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_notification_remove"}, call("hermes_notification_remove"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_notification_process_all"}, call("hermes_notification_process_all"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_notification_process_and_remove_all"}, call("hermes_notification_process_and_remove_all"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_notification_remove_all"}, call("hermes_notification_remove_all"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_auto_notification"}, call("hermes_auto_notification"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_connectivity"}, call("hermes_connectivity_check"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_reboot_status"}, call("reboot_status"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_reboot_modem"}, call("reboot_modem"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_discover_download"}, call("hermes_discover_download"), nil).leaf = true
    entry({"admin", "modem", "hermes-euicc", "api_list_devices"}, call("list_devices"), nil).leaf = true
end

-- Build command line arguments for hermes-euicc
function build_hermes_args()
    local args = {}
    local config = {}

    uci:foreach("hermes-euicc", "hermes-euicc", function(s)
        config = s
    end)

    if not config or not next(config) then
        config = {
            driver = 'auto',
            device = '',
            slot = '1',
            timeout = '30'
        }
    end

    if config.driver and config.driver ~= 'auto' and config.driver ~= '' then
        table.insert(args, "-driver " .. util.shellquote(config.driver))
    end

    if config.device and config.device ~= '' then
        table.insert(args, "-device " .. util.shellquote(config.device))
    end

    if config.slot and config.slot ~= '1' then
        table.insert(args, "-slot " .. config.slot)
    end

    if config.timeout and config.timeout ~= '30' then
        table.insert(args, "-timeout " .. config.timeout)
    end

    return table.concat(args, " ")
end

-- Execute hermes-euicc command
function exec_hermes_command(cmd_args, timeout_seconds)
    local args = build_hermes_args()
    local timeout = timeout_seconds or 30
    local hermes_binary = "/usr/bin/hermes-euicc"
    
    local full_cmd = string.format("timeout %d %s %s %s 2>&1", timeout, hermes_binary, args, cmd_args)
    
    luci.sys.exec("logger -t hermes-euicc 'Executing: " .. full_cmd .. "'")
    
    local result = sys.exec(full_cmd)
    local exit_code = os.execute(full_cmd .. " >/dev/null 2>&1")
    
    if exit_code == 124 then
        luci.sys.exec("logger -t hermes-euicc 'Command timed out'")
        return {success = false, error = "Command timed out"}
    end
    
    if result and result ~= "" then
        local success, data = pcall(json.parse, result)
        if success and data then
            return data
        end
    end
    
    return {success = false, error = "No response from hermes-euicc"}
end

function hermes_connectivity_check()
    local cmd = "ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1"
    local result = os.execute(cmd)
    local connected = (result == 0)

    luci.http.prepare_content("application/json")
    luci.http.write_json({
        success = true,
        connected = connected,
        message = connected and "Internet connection available" or "No internet connection detected"
    })
end

function hermes_status()
    local result = exec_hermes_command("info", 10)

    luci.http.prepare_content("application/json")

    if result.success and result.data then
        luci.http.write_json({
            success = true,
            eid = result.data.eid or "",
            info = result.data  -- Pass full data object for frontend compatibility
        })
    else
        luci.http.write_json({
            success = false,
            error = result.error or "Failed to get eSIM info"
        })
    end
end

function hermes_profiles()
    local result = exec_hermes_command("list", 20)

    luci.http.prepare_content("application/json")

    if result.success and result.data then
        luci.http.write_json({
            success = true,
            profiles = result.data
        })
    else
        luci.http.write_json({
            success = false,
            error = result.error or "Failed to list profiles"
        })
    end
end

function hermes_toggle()
    local iccid = luci.http.formvalue("iccid")
    local action = luci.http.formvalue("action")

    luci.http.prepare_content("application/json")

    if not iccid or not action then
        luci.http.write_json({success = false, error = "Missing parameters"})
        return
    end

    if action ~= "enable" and action ~= "disable" then
        luci.http.write_json({success = false, error = "Invalid action"})
        return
    end

    local cmd = string.format("%s %s", action, util.shellquote(iccid))
    local result = exec_hermes_command(cmd, 30)

    if result.success then
        luci.sys.exec("touch /tmp/hermes_euicc_reboot_needed")
        luci.sys.exec("echo 'Profile " .. action .. "d - modem restart required' > /tmp/hermes_euicc_reboot_reason")
        
        luci.http.write_json({
            success = true,
            message = result.data.message or "Profile " .. action .. "d successfully"
        })
    else
        luci.http.write_json({success = false, error = result.error})
    end
end

function hermes_config()
    local config = {}

    uci:foreach("hermes-euicc", "hermes-euicc", function(s)
        config["hermes-euicc"] = s
    end)

    if not config["hermes-euicc"] then
        config["hermes-euicc"] = {
            driver = 'auto',
            device = '',
            slot = '1',
            timeout = '30',
            reboot_method = 'at',
            reboot_at_command = 'AT+CFUN=1,1',
            reboot_at_device = '/dev/ttyUSB3',
            reboot_qmi_device = '/dev/cdc-wdm0',
            reboot_qmi_slot = '1',
            reboot_mbim_device = '/dev/cdc-wdm0',
            reboot_custom_command = 'echo "Custom reboot"'
        }
    end

    luci.http.prepare_content("application/json")
    luci.http.write_json({success = true, config = config})
end

function hermes_save_config()
    local config_data = luci.http.formvalue("config")

    luci.http.prepare_content("application/json")

    if not config_data then
        luci.http.write_json({success = false, error = "No config data"})
        return
    end

    local config = json.parse(config_data)
    if not config or not config["hermes-euicc"] then
        luci.http.write_json({success = false, error = "Invalid config"})
        return
    end

    uci:delete("hermes-euicc", "hermes-euicc")
    uci:section("hermes-euicc", "hermes-euicc", "hermes-euicc", config["hermes-euicc"])
    uci:commit("hermes-euicc")

    luci.http.write_json({success = true, message = "Config saved"})
end

function hermes_download_profile()
    local activation_code = luci.http.formvalue("activation_code")
    local imei = luci.http.formvalue("imei")
    local confirmation_code = luci.http.formvalue("confirmation_code")

    luci.http.prepare_content("application/json")

    if not activation_code or activation_code == "" then
        luci.http.write_json({success = false, error = "Activation code required"})
        return
    end

    local cmd = "download --code " .. util.shellquote(activation_code) .. " --confirm"

    if imei and imei ~= "" then
        cmd = cmd .. " --imei " .. util.shellquote(imei)
    end

    if confirmation_code and confirmation_code ~= "" then
        cmd = cmd .. " --confirmation-code " .. util.shellquote(confirmation_code)
    end

    local result = exec_hermes_command(cmd, 90)
    luci.http.write_json(result)
end

function hermes_delete_profile()
    local iccid = luci.http.formvalue("iccid")

    luci.http.prepare_content("application/json")

    if not iccid or iccid == "" then
        luci.http.write_json({success = false, error = "ICCID required"})
        return
    end

    local result = exec_hermes_command("delete " .. util.shellquote(iccid), 30)
    luci.http.write_json(result)
end

function hermes_change_nickname()
    local iccid = luci.http.formvalue("iccid")
    local nickname = luci.http.formvalue("nickname")

    luci.http.prepare_content("application/json")

    if not iccid or not nickname then
        luci.http.write_json({success = false, error = "ICCID and nickname required"})
        return
    end

    local cmd = string.format("nickname %s %s", util.shellquote(iccid), util.shellquote(nickname))
    local result = exec_hermes_command(cmd, 30)
    luci.http.write_json(result)
end

function hermes_notifications()
    local result = exec_hermes_command("notifications", 30)

    luci.http.prepare_content("application/json")

    if result.success then
        luci.http.write_json({success = true, notifications = result.data or {}})
    else
        luci.http.write_json(result)
    end
end

function hermes_notification_process()
    local seqNumber = luci.http.formvalue("seqNumber")

    luci.http.prepare_content("application/json")

    if not seqNumber then
        luci.http.write_json({success = false, error = "Sequence number required"})
        return
    end

    local result = exec_hermes_command("notification-handle " .. util.shellquote(seqNumber), 30)
    luci.http.write_json(result)
end

function hermes_notification_remove()
    local seqNumber = luci.http.formvalue("seqNumber")

    luci.http.prepare_content("application/json")

    if not seqNumber then
        luci.http.write_json({success = false, error = "Sequence number required"})
        return
    end

    local result = exec_hermes_command("notification-remove " .. util.shellquote(seqNumber), 30)
    luci.http.write_json(result)
end

function hermes_auto_notification()
    local result = exec_hermes_command("auto-notification", 60)

    luci.http.prepare_content("application/json")
    luci.http.write_json(result)
end

function reboot_status()
    luci.http.prepare_content("application/json")

    local flag_exists = luci.sys.exec("test -f /tmp/hermes_euicc_reboot_needed && echo 'yes' || echo 'no'"):match("yes")
    local reason = ""

    if flag_exists then
        reason = luci.sys.exec("cat /tmp/hermes_euicc_reboot_reason 2>/dev/null"):gsub("\n", "")
        if not reason or reason == "" then
            reason = "Profile changes require modem restart"
        end
    end

    luci.http.write_json({
        success = true,
        reboot_needed = flag_exists or false,
        reason = reason
    })
end

function reboot_modem()
    luci.http.prepare_content("application/json")

    luci.sys.exec("rm -f /tmp/hermes_euicc_reboot_needed /tmp/hermes_euicc_reboot_reason")

    local config = {}
    uci:foreach("hermes-euicc", "hermes-euicc", function(s) config = s end)

    if not config.reboot_method then
        config.reboot_method = 'at'
        config.reboot_at_device = '/dev/ttyUSB3'
        config.reboot_at_command = 'AT+CFUN=1,1'
    end

    local reboot_cmd = ""
    local method = ""

    if config.reboot_method == 'at' then
        reboot_cmd = string.format("printf '%s\\r\\n' > %s", 
            config.reboot_at_command or 'AT+CFUN=1,1',
            config.reboot_at_device or '/dev/ttyUSB3')
        method = "AT"
    elseif config.reboot_method == 'qmi' then
        local dev = config.reboot_qmi_device or '/dev/cdc-wdm0'
        local slot = config.reboot_qmi_slot or '1'
        reboot_cmd = string.format("uqmi -d %s --uim-power-off --uim-slot=%s && sleep 2 && uqmi -d %s --uim-power-on --uim-slot=%s", 
            dev, slot, dev, slot)
        method = "QMI"
    elseif config.reboot_method == 'mbim' then
        local dev = config.reboot_mbim_device or '/dev/cdc-wdm0'
        reboot_cmd = string.format("mbimcli -d %s --set-radio-state=off && sleep 2 && mbimcli -d %s --set-radio-state=on", dev, dev)
        method = "MBIM"
    elseif config.reboot_method == 'custom' then
        reboot_cmd = config.reboot_custom_command or 'echo "No command"'
        method = "Custom"
    end

    local success = luci.sys.exec(reboot_cmd)

    luci.http.write_json({
        success = true,
        message = "Modem reboot initiated using " .. method .. " method"
    })
end

function hermes_chip_info()
    local result = exec_hermes_command("chip-info", 10)

    luci.http.prepare_content("application/json")

    if result.success and result.data then
        local data = result.data

        -- Format storage information for easy display
        if data.euicc_info2 and data.euicc_info2.ext_card_resource then
            local res = data.euicc_info2.ext_card_resource
            data.storage_formatted = {
                free_nvm_bytes = res.free_non_volatile_memory or 0,
                free_ram_bytes = res.free_volatile_memory or 0,
                free_nvm_kb = math.floor((res.free_non_volatile_memory or 0) / 1024),
                free_ram_kb = math.floor((res.free_volatile_memory or 0) / 1024),
                free_nvm_mb = string.format("%.2f", (res.free_non_volatile_memory or 0) / 1048576),
                installed_apps = res.installed_application or 0
            }
        end

        luci.http.write_json({
            success = true,
            data = data
        })
    else
        luci.http.write_json({
            success = false,
            error = result.error or "Failed to get chip information"
        })
    end
end

function hermes_discover_download()
    local server = luci.http.formvalue("server")
    local imei = luci.http.formvalue("imei")

    luci.http.prepare_content("application/json")

    local cmd = "discover-download"

    if server and server ~= "" then
        cmd = cmd .. " --server " .. util.shellquote(server)
    end

    if imei and imei ~= "" then
        cmd = cmd .. " --imei " .. util.shellquote(imei)
    end

    -- 60 second timeout for discovery + download
    local result = exec_hermes_command(cmd, 60)

    -- If successful, set reboot flag
    if result.success and result.data and result.data.message then
        if result.data.message:find("downloaded") then
            luci.sys.exec("touch /tmp/hermes_euicc_reboot_needed")
            luci.sys.exec("echo 'Profile downloaded from SM-DS - modem restart required' > /tmp/hermes_euicc_reboot_reason")
        end
    end

    luci.http.write_json(result)
end

-- List available devices in /dev directory
function list_devices()
    local fs = require("nixio.fs")
    local devices = {}

    -- AT devices (serial ports)
    local at_devices = {}
    -- QMI/MBIM devices
    local qmi_devices = {}

    local dir = fs.dir("/dev")
    if dir then
        for entry in dir do
            local full_path = "/dev/" .. entry

            -- AT devices: ttyUSB*, ttyACM*
            if entry:match("^ttyUSB") or entry:match("^ttyACM") then
                table.insert(at_devices, full_path)
            end

            -- QMI/MBIM devices: cdc-wdm*, wwan*, mhi_*
            if entry:match("^cdc%-wdm") or entry:match("^wwan") or entry:match("^mhi_") then
                table.insert(qmi_devices, full_path)
            end
        end
    end

    -- Sort devices alphabetically
    table.sort(at_devices)
    table.sort(qmi_devices)

    -- Combine all devices
    for _, dev in ipairs(at_devices) do
        table.insert(devices, dev)
    end
    for _, dev in ipairs(qmi_devices) do
        table.insert(devices, dev)
    end

    luci.http.prepare_content("application/json")
    luci.http.write_json({
        success = true,
        devices = devices,
        at_devices = at_devices,
        qmi_devices = qmi_devices
    })
end
