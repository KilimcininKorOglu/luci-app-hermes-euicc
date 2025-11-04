/* eSIM Manager - Download Profile Tab JavaScript
Developed by: Giammarco M. <stich86@gmail.com>
Version: 1.0.0
*/

var uploadedFile = null;

var SHOW_LOGS = false;

function fetchEnableLogsConfig(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', L.url('admin', 'modem', 'hermes-euicc', 'api_config'), true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            if (data.success && data.config) {
                SHOW_LOGS = (data.config['hermes-euicc'].json_output == 1 || data.config['hermes-euicc'].json_output === "1");
                if (callback) callback(SHOW_LOGS);
            }
        }
    };
    xhr.send();
}

// ===== DOWNLOADS FUNCTIONS =====

function handleQRFile(input) {
    if (input.files && input.files[0]) {
        var file = input.files[0];
        uploadedFile = file;

        if (!file.type.match('image.*')) {
            alert(_('Please select an image file (JPG, PNG, etc.)'));
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var preview = document.getElementById('qr-preview');
            preview.src = e.target.result;
            var el = document.getElementById('qr-preview-container'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }

            hideDecodeStatus();

            setTimeout(function () {
                decodeQRCode();
            }, 100);
        };
        reader.readAsDataURL(file);
    }
}

function validateLPA(s) {
    if (typeof s !== 'string') return false;
    const p = s.split('$');
    return p.length >= 3 &&
        p[0] === 'LPA:1' &&
        p[1].includes('.') &&
        p[1].length > 2 &&
        /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$/.test(p[1]) &&
        p[2].length > 0;
}

function decodeQRCode() {
    if (!uploadedFile) {
        return;
    }

    // Clear all fields before start
    document.getElementById('qr-activation-code').value = '';
    document.getElementById('smdp-server-address').value = '';
    document.getElementById('activation-code').value = '';
    document.getElementById('confirmation-code').value = '';

    var el = document.getElementById('qr-decode-loading'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
    hideDecodeStatus(false);

    var reader = new FileReader();
    reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            var code = jsQR(imageData.data, imageData.width, imageData.height);

            document.getElementById('qr-decode-loading').style.display = 'none';

            if (code) {
                validLPA = validateLPA(code.data);
                if (validLPA) {
                    document.getElementById('qr-activation-code').value = code.data;
                    var el = document.getElementById('qr-activation-code-container'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                    var el = document.getElementById('qr-decode-success'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }

                    setTimeout(function () {
                        document.getElementById('qr-decode-success').style.display = 'none';
                    }, 5000);
                } else {
                    document.getElementById('qr-decode-error-message').textContent = _('Invalid LPA Address, check QR code again or enter eSIM detail manually');
                    var el = document.getElementById('qr-decode-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                }
            } else {
                document.getElementById('qr-decode-error-message').textContent = _('No QR code found in the image. Please try a clearer image.');
                var el = document.getElementById('qr-decode-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
            }
        };
        img.onerror = function () {
            document.getElementById('qr-decode-loading').style.display = 'none';
            document.getElementById('qr-decode-error-message').textContent = _('Failed to load image. Please try another file.');
            var el = document.getElementById('qr-decode-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(uploadedFile);
}

function clearQRUpload() {
    document.getElementById('qr-file').value = '';
    document.getElementById('qr-preview-container').style.display = 'none';
    document.getElementById('qr-activation-code-container').style.display = 'none';
    uploadedFile = null;
    hideDecodeStatus();

    // Clear all fields
    document.getElementById('qr-activation-code').value = '';
    document.getElementById('smdp-server-address').value = '';
    document.getElementById('activation-code').value = '';
    document.getElementById('confirmation-code').value = '';

    // Hide previous messages
    document.getElementById('download-success').style.display = 'none';
    document.getElementById('download-error').style.display = 'none';
}

function hideDecodeStatus(all = true) {
    document.getElementById('qr-decode-success').style.display = 'none';
    document.getElementById('qr-decode-error').style.display = 'none';
    if (all) {
        document.getElementById('qr-decode-loading').style.display = 'none';
    }
}

function downloadProfile() {
    var smdpServerAddress = document.getElementById('smdp-server-address').value.trim();
    var QRactivationCode = document.getElementById('qr-activation-code').value.trim();
    var activationCode = document.getElementById('activation-code').value.trim();
    var confirmationCode = document.getElementById('confirmation-code').value.trim();

    if (!QRactivationCode && (!smdpServerAddress || !activationCode)) {
        alert(_('Please enter a server and activation code or upload a QR code image'));
        return;
    }

    // Check storage before download
    checkStorageBeforeDownload(function (proceed) {
        if (proceed) {
            proceedWithDownload(smdpServerAddress, QRactivationCode, activationCode, confirmationCode);
        }
    });
}

function checkStorageBeforeDownload(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', L.url('admin', 'modem', 'hermes-euicc', 'api_chip_info'), true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.success && data.data && data.data.storage) {
                        var freeBytes = data.data.storage.free_non_volatile_memory || 0;
                        var freeKB = Math.floor(freeBytes / 1024);
                        var freeMB = (freeBytes / 1048576).toFixed(2);

                        // Check if storage is low (less than 500KB)
                        if (freeBytes < 512000) {
                            var msg = 'Warning: Low storage!\n\n' +
                                'Available: ' + freeKB + ' KB (' + freeMB + ' MB)\n' +
                                'Recommended: 500 KB minimum\n\n' +
                                'Profile installation may fail due to insufficient storage.\n\n' +
                                'Do you want to continue anyway?';

                            if (confirm(_(msg))) {
                                callback(true);
                            } else {
                                callback(false);
                            }
                        } else {
                            // Storage is sufficient, proceed
                            callback(true);
                        }
                    } else {
                        // Chip info not available, proceed anyway
                        callback(true);
                    }
                } catch (e) {
                    // Error parsing response, proceed anyway
                    callback(true);
                }
            } else {
                // Failed to get chip info, proceed anyway (backward compatibility)
                callback(true);
            }
        }
    };
    xhr.send();
}

function proceedWithDownload(smdpServerAddress, QRactivationCode, activationCode, confirmationCode) {


    document.getElementById('download-success').style.display = 'none';
    document.getElementById('download-error').style.display = 'none';
    var el = document.getElementById('download-loading'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', L.url('admin', 'modem', 'hermes-euicc', 'api_download'), true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            document.getElementById('download-loading').style.display = 'none';

            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);

                    if (data.success) {
                        var successMessage = 'Profile download completed successfully';
                        document.getElementById('download-success-message').textContent = successMessage;
                        var el = document.getElementById('download-success'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }

                        if (SHOW_LOGS && data.data) {
                            showDownloadLogs('Download Profile', data);
                        }

                        setTimeout(function () {
                            if (typeof loadProfiles === 'function') {
                                loadProfiles();
                                clearForm();
                            }
                        }, 2000);
                    } else {
                        var errorMessage = data.error || 'Unknown error occurred';
                        document.getElementById('download-error-message').textContent = errorMessage;
                        var el = document.getElementById('download-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }

                        if (SHOW_LOGS && data) {
                            showDownloadLogs('Download Profile - Error', data);
                        }
                    }

                } catch (e) {
                    document.getElementById('download-error-message').textContent = 'Invalid response format';
                    var el = document.getElementById('download-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                    console.error('JSON parsing error:', e);
                }
            } else {
                document.getElementById('download-error-message').textContent = 'Failed to download profile (HTTP ' + xhr.status + ')';
                var el = document.getElementById('download-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
            }
        }
    };

    if (QRactivationCode) {
        var params = 'activation_code=' + encodeURIComponent(QRactivationCode);
        if (confirmationCode) {
            params += '&confirmation_code=' + encodeURIComponent(confirmationCode);
        }
    }

    if (smdpServerAddress && activationCode) {
        var lpaCode = 'LPA:1$' + smdpServerAddress + '$' + activationCode;
        var params = 'activation_code=' + encodeURIComponent(lpaCode);
        if (confirmationCode) {
            params += '&confirmation_code=' + encodeURIComponent(confirmationCode);
        }
        xhr.send(params);
    } else {
        xhr.send(params);
    }
}

function clearForm() {
    document.getElementById('activation-code').value = '';
    document.getElementById('confirmation-code').value = '';
    clearQRUpload();
    document.getElementById('download-success').style.display = 'none';
    document.getElementById('download-error').style.display = 'none';
    document.getElementById('output-logs-section').style.display = 'none';
    clearDownloadLogs();
}

function showDownloadLogs(operation, dataObject) {
    var logsSection = document.getElementById('output-logs-section');
    var logsContent = document.getElementById('output-logs-content');

    // Show logs section 
    logsSection.style.display = 'block';

    // Create timestamp 
    var timestamp = new Date().toLocaleTimeString();
    var isSuccess = operation.indexOf('Success') !== -1;
    var isError = operation.indexOf('Error') !== -1;

    var headerColor = isSuccess ? '#28a745' : (isError ? '#dc3545' : '#007bff');

    // Create div for the operation
    var headerDiv = document.createElement('div');
    headerDiv.style.color = headerColor;
    headerDiv.style.fontWeight = 'bold';
    headerDiv.style.marginBottom = '5px';
    headerDiv.style.paddingBottom = '5px';
    headerDiv.textContent = '[' + timestamp + '] ' + operation;

    // Create div for JSON output
    var contentDiv = document.createElement('div');
    contentDiv.style.marginBottom = '15px';
    contentDiv.style.padding = '5px';
    contentDiv.style.backgroundColor = '#ffffff';
    contentDiv.style.borderRadius = '3px';
    contentDiv.style.wordBreak = 'break-all';
    contentDiv.style.overflowWrap = 'break-word';

    // Format the data object
    var formattedOutput = '';
    try {
        if (typeof dataObject === 'string') {
            var lines = dataObject.split('\n');
            lines.forEach(function (line) {
                if (line.trim().startsWith('{')) {
                    var jsonObj = JSON.parse(line);
                    var jsonStr = JSON.stringify(jsonObj, function (key, value) {
                        if (typeof value === 'string' && value.length > 100) {
                            return value.substring(0, 100) + '...[truncated]';
                        }
                        return value;
                    }, 2);
                    formattedOutput += jsonStr + '\n\n';
                } else if (line.trim() !== '') {
                    formattedOutput += line + '\n';
                }
            });
        } else if (typeof dataObject === 'object' && dataObject !== null) {
            formattedOutput = JSON.stringify(dataObject, function (key, value) {
                if (typeof value === 'string' && value.length > 100) {
                    return value.substring(0, 100) + '...[truncated]';
                }
                return value;
            }, 2);
        } else {
            formattedOutput = String(dataObject);
        }
    } catch (e) {
        formattedOutput = String(dataObject);
        if (formattedOutput.length > 500) {
            formattedOutput = formattedOutput.substring(0, 500) + '...[truncated]';
        }
    }

    contentDiv.textContent = formattedOutput;

    logsContent.appendChild(headerDiv);
    logsContent.appendChild(contentDiv);
    logsContent.scrollTop = logsContent.scrollHeight;
}

function clearDownloadLogs() {
    var logsContent = document.getElementById('output-logs-content');
    logsContent.innerHTML = '';
}

// Load logs config
fetchEnableLogsConfig(function (enableLogs) {
});

// SM-DS Discover and Download
function discoverAndDownload() {
    var server = document.getElementById('smds-server').value.trim();
    var imei = document.getElementById('smds-imei').value.trim();

    // Check storage before discover-download
    checkStorageBeforeDownload(function (proceed) {
        if (proceed) {
            proceedWithDiscoverDownload(server, imei);
        }
    });
}

function proceedWithDiscoverDownload(server, imei) {
    var btn = document.getElementById('discover-download-btn');

    // Hide all messages
    document.getElementById('discover-download-loading').style.display = 'none';
    document.getElementById('discover-download-success').style.display = 'none';
    document.getElementById('discover-download-error').style.display = 'none';
    document.getElementById('discover-download-info').style.display = 'none';

    // Show loading
    var el = document.getElementById('discover-download-loading'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
    btn.disabled = true;

    var formData = 'server=' + encodeURIComponent(server) + '&imei=' + encodeURIComponent(imei);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', L.url('admin', 'modem', 'hermes-euicc', 'api_discover_download'), true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            document.getElementById('discover-download-loading').style.display = 'none';
            btn.disabled = false;

            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);

                    if (response.success && response.data && response.data.message) {
                        var msg = response.data.message;

                        if (msg.indexOf('downloaded') !== -1) {
                            // Profile downloaded successfully
                            document.getElementById('discover-download-success-message').textContent =
                                'Profile downloaded successfully! Please reboot modem to activate.';
                            var el = document.getElementById('discover-download-success'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }

                            // Check reboot status to show banner
                            if (typeof checkRebootStatus === 'function') {
                                setTimeout(checkRebootStatus, 500);
                            }
                        } else if (msg.indexOf('no profiles') !== -1) {
                            // No profiles available
                            document.getElementById('discover-download-info-message').textContent =
                                'No profiles available for this device from SM-DS.';
                            var el = document.getElementById('discover-download-info'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                        } else {
                            // Other success message
                            document.getElementById('discover-download-success-message').textContent = msg;
                            var el = document.getElementById('discover-download-success'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                        }
                    } else {
                        // Error response
                        document.getElementById('discover-download-error-message').textContent =
                            response.error || 'Discovery failed';
                        var el = document.getElementById('discover-download-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                    }
                } catch (e) {
                    document.getElementById('discover-download-error-message').textContent =
                        'Failed to parse response';
                    var el = document.getElementById('discover-download-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
                }
            } else {
                document.getElementById('discover-download-error-message').textContent =
                    'Request failed (HTTP ' + xhr.status + ')';
                var el = document.getElementById('discover-download-error'); if (el) { el.classList.remove('hidden'); el.style.display = 'block'; }
            }
        }
    };
    xhr.send(formData);
}