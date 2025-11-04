/* eSIM Profile Manager - Chip Information Module
Developed by: Giammarco M. <stich86@gmail.com>
Version: 1.0.0
*/

var chipInfoLoaded = false;

function loadChipInfoIfNeeded() {
    if (!chipInfoLoaded) {
        chipInfoLoaded = true;
        loadChipInfo();
    }
}

function loadChipInfo() {
    var loadingEl = document.getElementById('chip-info-loading');
    var contentEl = document.getElementById('chip-info-content');
    var errorEl = document.getElementById('chip-info-error');

    if (loadingEl) loadingEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', L.url('admin', 'modem', 'hermes-euicc', 'api_chip_info'), true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (loadingEl) loadingEl.style.display = 'none';

            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success && response.data) {
                        displayChipInfo(response.data);
                        if (contentEl) {
                            contentEl.classList.remove('hidden');
                            contentEl.style.display = 'block';
                        }
                    } else {
                        showChipInfoError(response.error || _('Failed to load chip information'));
                    }
                } catch (e) {
                    showChipInfoError(_('Failed to parse response'));
                }
            } else {
                showChipInfoError(_('Failed to load chip information (HTTP ') + xhr.status + ')');
            }
        }
    };
    xhr.send();
}

function showChipInfoError(message) {
    var errorEl = document.getElementById('chip-info-error');
    var errorMsgEl = document.getElementById('chip-info-error-message');

    if (errorMsgEl) errorMsgEl.textContent = message;
    if (errorEl) errorEl.style.display = 'block';
}

function displayChipInfo(info) {
    // Update Basic Information section with chip-info data
    if (info.euicc_info2) {
        var profileVersionEl = document.getElementById('esim-profile-version');
        var svnEl = document.getElementById('esim-svn');
        var firmwareEl = document.getElementById('esim-firmware');

        if (profileVersionEl) profileVersionEl.textContent = info.euicc_info2.profile_version || _('Not available');
        if (svnEl) svnEl.textContent = info.euicc_info2.svn || _('Not available');
        if (firmwareEl) firmwareEl.textContent = info.euicc_info2.euicc_firmware_ver || _('Not available');
    }

    // Update Memory Information with ext_card_resource
    if (info.euicc_info2 && info.euicc_info2.ext_card_resource) {
        var nvMemEl = document.getElementById('esim-nv-memory');
        var vMemEl = document.getElementById('esim-v-memory');
        var appsEl = document.getElementById('esim-apps');

        var nvMem = info.euicc_info2.ext_card_resource.free_non_volatile_memory;
        var vMem = info.euicc_info2.ext_card_resource.free_volatile_memory;
        var apps = info.euicc_info2.ext_card_resource.installed_application;

        if (nvMemEl) nvMemEl.textContent = (nvMem === 0 || nvMem === undefined) ? _('Not available') : nvMem + ' bytes';
        if (vMemEl) vMemEl.textContent = (vMem === 0 || vMem === undefined) ? _('Not available') : vMem + ' bytes';
        if (appsEl) appsEl.textContent = (apps === 0 || apps === undefined) ? _('Not available') : apps;
    }

    // Display storage information
    if (info.storage_formatted) {
        var storageEl = document.getElementById('storage-info');
        if (storageEl) {
            storageEl.innerHTML =
                '<div class="chip-info-card">' +
                '<h4>' + _('Storage Information') + '</h4>' +
                '<div class="storage-item">' +
                '<span class="storage-label">' + _('Free Storage:') + '</span> ' +
                '<span class="storage-value">' + info.storage_formatted.free_nvm_mb + ' MB (' +
                info.storage_formatted.free_nvm_kb.toLocaleString() + ' KB)</span>' +
                '</div>' +
                '<div class="storage-item">' +
                '<span class="storage-label">' + _('Free RAM:') + '</span> ' +
                '<span class="storage-value">' + info.storage_formatted.free_ram_kb.toLocaleString() + ' KB</span>' +
                '</div>' +
                '<div class="storage-item">' +
                '<span class="storage-label">' + _('Installed Apps:') + '</span> ' +
                '<span class="storage-value">' + info.storage_formatted.installed_apps + '</span>' +
                '</div>' +
                createStorageBar(info.storage_formatted.free_nvm_bytes) +
                '</div>';
        }
    }

    // Display capabilities
    if (info.euicc_info2 && info.euicc_info2.uicc_capability) {
        var capEl = document.getElementById('capabilities-info');
        if (capEl) {
            var capHtml = '<div class="chip-info-card"><h4>' + _('Capabilities') + '</h4><ul class="capability-list">';
            info.euicc_info2.uicc_capability.forEach(function (cap) {
                capHtml += '<li>' + formatCapability(cap) + '</li>';
            });
            capHtml += '</ul></div>';
            capEl.innerHTML = capHtml;
        }
    }

    // Display version information
    if (info.euicc_info2) {
        var versionEl = document.getElementById('version-info');
        if (versionEl) {
            versionEl.innerHTML =
                '<div class="chip-info-card">' +
                '<h4>' + _('Version Information') + '</h4>' +
                '<div class="version-item"><span class="version-label">' + _('Profile Version:') + '</span> ' +
                (info.euicc_info2.profile_version || _('Not available')) + '</div>' +
                '<div class="version-item"><span class="version-label">' + _('SGP.22 Version:') + '</span> ' +
                (info.euicc_info2.svn || _('Not available')) + '</div>' +
                '<div class="version-item"><span class="version-label">' + _('Firmware:') + '</span> ' +
                (info.euicc_info2.euicc_firmware_ver || _('Not available')) + '</div>' +
                '<div class="version-item"><span class="version-label">' + _('GlobalPlatform:') + '</span> ' +
                (info.euicc_info2.global_platform_version || _('Not available')) + '</div>' +
                '</div>';
        }
    }

    // Display EID
    if (info.eid) {
        var eidEl = document.getElementById('eid-display');
        if (eidEl) {
            eidEl.textContent = info.eid;
        }
    }
}

function createStorageBar(freeBytes) {
    // Don't show storage bar if no valid data
    if (!freeBytes || freeBytes === 0) {
        return '';
    }

    // Assume typical eUICC has ~2MB total storage
    var totalBytes = 2 * 1024 * 1024;
    var usedBytes = totalBytes - freeBytes;
    var usedPercent = (usedBytes / totalBytes) * 100;

    var barClass = 'storage-progress-bar';
    if (usedPercent > 80) {
        barClass += ' danger';
    } else if (usedPercent > 60) {
        barClass += ' warning';
    }

    return '<div class="storage-progress">' +
        '<div class="' + barClass + '" style="width: ' + usedPercent.toFixed(1) + '%"></div>' +
        '</div>' +
        '<div class="storage-percent">' + usedPercent.toFixed(1) + '% ' + _('Used') + '</div>';
}

function formatCapability(cap) {
    var capMap = {
        'contactless': _('Contactless Support'),
        'usim': _('USIM Support'),
        'isim': _('ISIM Support'),
        'javacard': _('JavaCard Support'),
        'multipleusim': _('Multiple USIM Support'),
        'gba': _('Generic Bootstrapping Architecture'),
        'bertlv': _('BER-TLV Support')
    };
    return capMap[cap] || cap;
}
