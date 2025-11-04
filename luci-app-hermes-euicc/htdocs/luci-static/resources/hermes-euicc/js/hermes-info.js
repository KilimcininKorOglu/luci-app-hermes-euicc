/* eSIM Profile Manager - Info Tab JavaScript
Developed by: Giammarco M. <stich86@gmail.com>
Version: 1.0.0
*/

function loadESIMInfo() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', L.url('admin', 'modem', 'hermes-euicc', 'api_status'), true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            document.getElementById('esim-info-error').style.display = 'none';
            document.getElementById('esim-info-content').style.display = 'none';
            document.getElementById('esim-info-loading').style.display = 'none';

            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                if (data.success && data.eid) {
                    // hermes-euicc info only provides EID
                    document.getElementById('esim-eid').textContent = data.eid || '-';

                    // Set basic info to default values - will be populated by chip-info
                    document.getElementById('esim-profile-version').textContent = '-';
                    document.getElementById('esim-svn').textContent = '-';
                    document.getElementById('esim-firmware').textContent = '-';
                    document.getElementById('esim-nv-memory').textContent = '-';
                    document.getElementById('esim-v-memory').textContent = '-';
                    document.getElementById('esim-apps').textContent = '-';

                    var contentEl = document.getElementById('esim-info-content');
                    if (contentEl) {
                        contentEl.classList.remove('hidden');
                        contentEl.style.display = 'block';
                    }

                    // Load detailed chip info which contains all other fields
                    loadChipInfoIfNeeded();

                } else {
                    var errorMsg = data.error || data.message || 'Unknown error';
                    document.getElementById('esim-error-message').textContent = errorMsg;
                    document.getElementById('esim-info-error').style.display = 'block';
                }
            } else {
                document.getElementById('esim-error-message').textContent = 'Failed to load eSIM information';
                document.getElementById('esim-info-error').style.display = 'block';
            }
        }
    };
    xhr.send();
}