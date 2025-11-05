/* eSIM Profile Manager - Configuration Tab JavaScript 
Developed by: Giammarco M. <stich86@gmail.com>
Version: 1.0.0
*/

var configLoaded = false;
var availableDevices = {
    at_devices: [],
    qmi_devices: []
};

function loadConfigIfNeeded() {
    if (!configLoaded) {
        configLoaded = true;
        loadConfig();
        loadAvailableDevices();
    }
}

var currentConfig = {};

// Load available devices from /dev
function loadAvailableDevices() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', L.url('admin', 'modem', 'hermes-euicc', 'api_list_devices'), true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                availableDevices.at_devices = data.at_devices || [];
                availableDevices.qmi_devices = data.qmi_devices || [];
                populateDeviceDropdowns();
            }
        }
    };
    xhr.send();
}

// Populate all device dropdowns with available devices
function populateDeviceDropdowns() {
    // AT devices
    populateDeviceSelect('at_device', availableDevices.at_devices, '/dev/ttyUSB3');
    populateDeviceSelect('reboot_at_device', availableDevices.at_devices, '/dev/ttyUSB3');

    // QMI/MBIM devices
    populateDeviceSelect('qmi_device', availableDevices.qmi_devices, '/dev/cdc-wdm0');
    populateDeviceSelect('mbim_device', availableDevices.qmi_devices, '/dev/cdc-wdm0');
    populateDeviceSelect('reboot_qmi_device', availableDevices.qmi_devices, '/dev/cdc-wdm0');
    populateDeviceSelect('reboot_mbim_device', availableDevices.qmi_devices, '/dev/cdc-wdm0');
}

// Populate a single device select dropdown
function populateDeviceSelect(selectId, devices, defaultValue) {
    var select = document.getElementById(selectId);
    if (!select) return;

    var currentValue = select.value;

    // Clear existing options
    select.innerHTML = '';

    // Add placeholder if no devices
    if (devices.length === 0) {
        var option = document.createElement('option');
        option.value = '';
        option.text = _('No devices found');
        select.add(option);
    } else {
        // Add available devices
        devices.forEach(function(device) {
            var option = document.createElement('option');
            option.value = device;
            option.text = device;
            select.add(option);
        });
    }

    // Add "Custom" option at the end
    var customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.text = _('Custom - Manual Entry');
    select.add(customOption);

    // Restore previous value if it exists in the list
    if (currentValue && currentValue !== '') {
        var found = false;
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value === currentValue) {
                select.value = currentValue;
                found = true;
                break;
            }
        }
        // If not found, add it as custom and select it
        if (!found && currentValue !== 'custom') {
            var customValueOption = document.createElement('option');
            customValueOption.value = currentValue;
            customValueOption.text = currentValue + ' (' + _('Custom') + ')';
            select.insertBefore(customValueOption, customOption);
            select.value = currentValue;
        }
    } else if (devices.length > 0) {
        // Default to first device if no value set
        select.value = devices[0];
    }
}

// Handle device select change - show/hide custom input
function onDeviceSelectChange(selectElement) {
    var selectId = selectElement.id;
    var customInputId = selectId + '_custom';
    var customInput = document.getElementById(customInputId);

    if (!customInput) return;

    if (selectElement.value === 'custom') {
        // Show custom input field
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        // Hide custom input field
        customInput.style.display = 'none';
        customInput.value = '';
    }
}

function loadConfig() {
    var el = document.getElementById('config-loading'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
    document.getElementById('config-content').style.display = 'none';
    document.getElementById('config-error').style.display = 'none';
    document.getElementById('config-success').style.display = 'none';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', L.url('admin', 'modem', 'hermes-euicc', 'api_config'), true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            document.getElementById('config-loading').style.display = 'none';

            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                if (data.success) {
                    currentConfig = data.config;
                    populateForm(data.config);
                    var el = document.getElementById('config-content'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                } else {
                    document.getElementById('config-error-message').textContent = data.error || _('Unknown error');
                    var el = document.getElementById('config-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                }
            } else {
                document.getElementById('config-error-message').textContent = _('Failed to load configuration');
                var el = document.getElementById('config-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
            }
        }
    };
    xhr.send();
}

function populateForm(config) {
    // hermes-euicc settings - everything is now unified under config['hermes-euicc']
    if (config['hermes-euicc']) {
        // Global settings
        document.getElementById('apdu_backend').value = config['hermes-euicc'].apdu_backend || 'at';

        // Device settings - set after device dropdowns are populated
        setDeviceValue('at_device', config['hermes-euicc'].at_device || '/dev/ttyUSB3');
        setDeviceValue('qmi_device', config['hermes-euicc'].qmi_device || '/dev/cdc-wdm0');
        document.getElementById('qmi_sim_slot').value = config['hermes-euicc'].qmi_sim_slot || '1';
        setDeviceValue('mbim_device', config['hermes-euicc'].mbim_device || '/dev/cdc-wdm0');
        document.getElementById('mbim_proxy').value = config['hermes-euicc'].mbim_proxy || '0';

        // Reboot settings
        document.getElementById('reboot_method').value = config['hermes-euicc'].reboot_method || 'at';
        document.getElementById('reboot_at_command').value = config['hermes-euicc'].reboot_at_command || 'AT+CFUN=1,1';
        setDeviceValue('reboot_at_device', config['hermes-euicc'].reboot_at_device || '/dev/ttyUSB3');
        setDeviceValue('reboot_qmi_device', config['hermes-euicc'].reboot_qmi_device || '/dev/cdc-wdm0');
        document.getElementById('reboot_qmi_slot').value = config['hermes-euicc'].reboot_qmi_slot || config['hermes-euicc'].qmi_sim_slot || '1';
        setDeviceValue('reboot_mbim_device', config['hermes-euicc'].reboot_mbim_device || '/dev/cdc-wdm0');
        document.getElementById('reboot_custom_command').value = config['hermes-euicc'].reboot_custom_command || 'echo "Custom reboot command here"';

        // Logs settings
        document.getElementById('json_output').value = config['hermes-euicc'].json_output || '0';

        // Notification settings
        document.getElementById('enable_bulk_notification').value = config['hermes-euicc'].enable_bulk_notification || '0';

    } else {
        // Set default values if no configuration exists
        setDefaultValues();
    }

    // Update field visibility based on current selections
    onBackendChange();
    onRebootMethodChange();
}

// Helper function to set device value in dropdown or custom field
function setDeviceValue(selectId, value) {
    var select = document.getElementById(selectId);
    if (!select) return;

    // Try to find the value in the dropdown
    var found = false;
    for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value) {
            select.value = value;
            found = true;
            break;
        }
    }

    // If not found in dropdown, use custom option
    if (!found && value && value !== '') {
        var customOption = null;
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value === 'custom') {
                customOption = select.options[i];
                break;
            }
        }

        if (customOption) {
            // Add custom value option before the "Custom" option
            var customValueOption = document.createElement('option');
            customValueOption.value = value;
            customValueOption.text = value + ' (' + _('Custom') + ')';
            select.insertBefore(customValueOption, customOption);
            select.value = value;
        }
    }
}

function setDefaultValues() {
    // Global settings defaults
    document.getElementById('apdu_backend').value = 'at';

    // Device settings defaults
    document.getElementById('at_device').value = '/dev/ttyUSB3';
    document.getElementById('qmi_device').value = '/dev/cdc-wdm0';
    document.getElementById('qmi_sim_slot').value = '1';
    document.getElementById('mbim_device').value = '/dev/cdc-wdm0';
    document.getElementById('mbim_proxy').value = '0';

    // Reboot settings defaults
    document.getElementById('reboot_method').value = 'at';
    document.getElementById('reboot_at_command').value = 'AT+CFUN=1,1';
    document.getElementById('reboot_at_device').value = '/dev/ttyUSB3';
    document.getElementById('reboot_qmi_device').value = '/dev/cdc-wdm0';
    document.getElementById('reboot_qmi_slot').value = '1';
    document.getElementById('reboot_mbim_device').value = '/dev/cdc-wdm0';
    document.getElementById('reboot_custom_command').value = 'echo "Custom reboot command here"';

    // Logs settings
    document.getElementById('json_output').value = '0';

    // Notification settings
    document.getElementById('enable_bulk_notification').value = '0';
}

function onBackendChange() {
    const backend = document.getElementById('apdu_backend').value;

    // Hide all device settings
    document.getElementById('at-device-setting').style.display = 'none';
    document.getElementById('qmi-device-setting').style.display = 'none';
    document.getElementById('qmi-sim-slot-setting').style.display = 'none';
    document.getElementById('mbim-device-setting').style.display = 'none';
    document.getElementById('mbim-proxy-setting').style.display = 'none';

    // Show only relevant settings
    if (backend === 'at') {
        document.getElementById('at-device-setting').style.display = 'flex';
    } else if (backend === 'uqmi') {
        document.getElementById('qmi-device-setting').style.display = 'flex';
        document.getElementById('qmi-sim-slot-setting').style.display = 'flex';
    } else if (backend === 'mbim') {
        document.getElementById('mbim-device-setting').style.display = 'flex';
        document.getElementById('mbim-proxy-setting').style.display = 'flex';
    }

    // Update reboot method visibility
    onRebootMethodChange();
}

function onRebootMethodChange() {
    const method = document.getElementById('reboot_method').value;

    // Hide all reboot settings
    document.getElementById('at-reboot-setting').style.display = 'none';
    document.getElementById('at-reboot-port-setting').style.display = 'none';
    document.getElementById('qmi-reboot-setting').style.display = 'none';
    document.getElementById('qmi-reboot-slot-setting').style.display = 'none';
    document.getElementById('mbim-reboot-setting').style.display = 'none';
    document.getElementById('custom-reboot-setting').style.display = 'none';

    // Show only relevant settings
    if (method === 'at') {
        document.getElementById('at-reboot-setting').style.display = 'flex';
        document.getElementById('at-reboot-port-setting').style.display = 'flex';
    } else if (method === 'qmi') {
        document.getElementById('qmi-reboot-setting').style.display = 'flex';
        document.getElementById('qmi-reboot-slot-setting').style.display = 'flex';
    } else if (method === 'mbim') {
        document.getElementById('mbim-reboot-setting').style.display = 'flex';
    } else if (method === 'custom') {
        document.getElementById('custom-reboot-setting').style.display = 'flex';
    }
}

function saveConfig() {
    // Validate before saving
    if (!validateConfig()) {
        return;
    }

    document.getElementById('config-error').style.display = 'none';
    document.getElementById('config-success').style.display = 'none';

    // Show loading indicator
    var loadingEl = document.getElementById('config-loading');
    if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.classList.remove('hidden');
    }

    // Hide content during save
    var contentEl = document.getElementById('config-content');
    if (contentEl) {
        contentEl.style.display = 'none';
    }

    // Read all form data and organize it in the unified hermes-euicc structure
    var config = {
        "hermes-euicc": {
            // Global settings
            apdu_backend: document.getElementById('apdu_backend').value,

            // Device settings - get from select or custom input
            at_device: getDeviceValue('at_device'),
            qmi_device: getDeviceValue('qmi_device'),
            qmi_sim_slot: document.getElementById('qmi_sim_slot').value,
            mbim_device: getDeviceValue('mbim_device'),
            mbim_proxy: document.getElementById('mbim_proxy').value,

            // Reboot settings
            reboot_method: document.getElementById('reboot_method').value,
            reboot_at_command: document.getElementById('reboot_at_command').value,
            reboot_at_device: getDeviceValue('reboot_at_device'),
            reboot_qmi_device: getDeviceValue('reboot_qmi_device'),
            reboot_qmi_slot: document.getElementById('reboot_qmi_slot').value,
            reboot_mbim_device: getDeviceValue('reboot_mbim_device'),
            reboot_custom_command: document.getElementById('reboot_custom_command').value,

            // Logs settings
            json_output: document.getElementById('json_output').value,

            // Notification settings
            enable_bulk_notification: document.getElementById('enable_bulk_notification').value
        }
    };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', L.url('admin', 'modem', 'hermes-euicc', 'api_saveconfig'), true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            // Hide loading indicator
            var loadingEl = document.getElementById('config-loading');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }

            // Show content again
            var contentEl = document.getElementById('config-content');
            if (contentEl) {
                contentEl.style.display = 'block';
                contentEl.classList.remove('hidden');
            }

            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                if (data.success) {
                    // Success: just update currentConfig, no message displayed
                    currentConfig = config;
                } else {
                    // Error: show error message
                    document.getElementById('config-error-message').textContent = data.error || _('Unknown error');
                    var el = document.getElementById('config-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                }
            } else {
                // Network error: show error message
                document.getElementById('config-error-message').textContent = _('Failed to save configuration');
                var el = document.getElementById('config-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
            }
        }
    };
    xhr.send('config=' + encodeURIComponent(JSON.stringify(config)));
}

// Helper function to get device value from dropdown or custom input
function getDeviceValue(selectId) {
    var select = document.getElementById(selectId);
    if (!select) return '';

    var selectValue = select.value;

    // If custom option is selected, get value from custom input
    if (selectValue === 'custom') {
        var customInput = document.getElementById(selectId + '_custom');
        return customInput ? customInput.value : '';
    }

    return selectValue;
}

// Utility functions for validation
function validateDevicePath(path) {
    return path && path.startsWith('/dev/');
}

function validateSimSlot(slot) {
    const slotNum = parseInt(slot);
    return !isNaN(slotNum) && slotNum >= 1 && slotNum <= 2;
}

function validateConfig() {
    var backend = document.getElementById('apdu_backend').value;

    // Validate device path based on selected backend
    if (backend === 'at') {
        var atDevice = document.getElementById('at_device').value;
        if (!validateDevicePath(atDevice)) {
            alert(_('AT device path must start with /dev/'));
            return false;
        }
    } else if (backend === 'uqmi') {
        var qmiDevice = document.getElementById('qmi_device').value;
        if (!validateDevicePath(qmiDevice)) {
            alert(_('QMI device path must start with /dev/'));
            return false;
        }

        var qmiSlot = document.getElementById('qmi_sim_slot').value;
        if (!validateSimSlot(qmiSlot)) {
            alert(_('QMI SIM slot must be 1 or 2'));
            return false;
        }
    } else if (backend === 'mbim') {
        var mbimDevice = document.getElementById('mbim_device').value;
        if (!validateDevicePath(mbimDevice)) {
            alert(_('MBIM device path must start with /dev/'));
            return false;
        }
    }

    return true;
}