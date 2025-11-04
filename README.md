# LuCI Web Interface App for Managing eSIM Profiles via Hermes eUICC

## Overview

**luci-app-hermes-euicc** is a LuCI web interface for OpenWrt that enables comprehensive management of eSIM profiles on compatible cellular modules. The application uses **hermes-euicc** (Local Profile Agent Client) to communicate with eSIM modules and provides an intuitive user interface with the following features:

- Monitor status of eSIM modules
- Download profiles via QR codes or manual entry
- Manage existing profiles (enable/disable/delete/rename)
- Configure Hermes eUICC backend and modem reboot methods (AT, QMI, MBIM, or custom commands)
- View and process notifications for status and operations
- Test connectivity before managing eSIM profiles

## Requirements

- OpenWrt with LuCI interface
- Required packages: `hermes-euicc`, `uqmi`, `mbim-utils`, `coreutils-timeout`
- Cellular module with eSIM support (physical or embedded)
- Internet connection (required for profile download and deletion)

**Note**: MBIM support requires at least Hermes eUICC version 2.2.0

## Installation

Download the latest IPK from the Release Page and install using:

```bash
opkg install luci-app-hermes-euicc_1.0.0-r1_all.ipk
```

## Building from Source

Add the following line to `feeds.conf.default` in OpenWrt SDK/Buildroot:

```
src-git hermes-euicc https://github.com/KilimcininKorOglu/luci-app-hermes-euicc.git
```

Update feeds and compile the package:

```bash
./scripts/feeds update -a
./scripts/feeds install -a
make -j$((`nproc` + 1)) package/feeds/hermes-euicc/luci-app-hermes-euicc/compile
```

The compiled package will be located at:

```
SDKROOT/bin/packages/aarch64_cortex-a53/hermes-euicc/luci-app-hermes-euicc_1.0.0-r1_all.ipk
```

### Project Structure

```
luci-app-hermes-euicc:
.
├── htdocs
│   └── luci-static
│       └── resources  // CSS, JS
├── luasrc
│   ├── controller  // LuCI LUA controller
│   ├── model
│   │   └── cbi          // CBI model
│   └── view
│       └── hermes-euicc   // HTML templates
└── root
    ├── etc
    │   └── config   // Configuration file
    └── usr
        └── share
            └── menu.d   // Menu definition
```

## Screenshots

### Main Dashboard

![eSIM Info](screenshots/hermes-esim-info.png)

*Main view with eSIM status*

### Profile Management

![Profiles](screenshots/hermes-esim-profiles.png)

*List and management of installed eSIM profiles*

### Profile Download

![Download Profile](screenshots/hermes-esim-downloads.png)

*Download new profiles via QR code or manual entry*

### Configuration

*Configuration panel for hermes-euicc binary and reboot commands (configurations can be mixed)*

#### AT Mode

![Configuration-AT](screenshots/hermes-config-at.png)

#### QMI Mode

![Configuration-QMI](screenshots/hermes-config-qmi.png)

#### MBIM Mode

![Configuration-MBIM](screenshots/hermes-config-mbim.png)

## Tested Modules and eSIMs

The following table shows modules on which the application has been tested:

### Modem Compatibility Table

<table>
    <thead>
        <tr>
            <th rowspan="2">Modem Tested</th>
            <th colspan="2">e-SIM</th>
            <th colspan="3">APDU backend</th>
            <th rowspan="2">Firmware<br>ATI Output</th>
            <th rowspan="2">Reboot Method</th>
        </tr>
            <tr>
                <th>Internal</th>
                <th>External</th>
                <th>AT</th>
                <th>MBIM</th>
                <th>QMI</th>
        </tr>
    </thead>
    <tbody>
            <tr>
                <td class="modem-name">Foxconn T99W175 (MV31-W)</td>
                <td class="status-ok">✓</td>
                <td class="status-ok">✓</td>
                <td class="status-error">❌</td>
                <td class="status-ok">✓</td>
                <td class="status-error">❌</td>
                <td class="firmware">F0.1.0.0.9.GC.004</td>
                <td>AT and MBIM</td>
            </tr>
            <tr>
                <td class="modem-name">Quectel RM502Q-GL</td>
                <td>N/A</td>
                <td class="status-ok">✓</td>
                <td class="status-ok">✓</td>
                <td class="status-ok">✓</td>
                <td class="status-ok">✓</td>
                <td class="firmware">RM502QGLAAR11A02M4G</td>
                <td>AT, QMI and MBIM</td>
            </tr>
            <tr>
                <td class="modem-name">Quectel RM551E-GL</td>
                <td>N/A</td>
                <td class="status-ok">✓</td>
                <td class="status-warning">⚠️</td>
                <td class="status-error">❌</td>
                <td class="status-warning">⚠️</td>
                <td class="firmware">RM551EGL00AAR01A03M8G</td>
                <td>AT and QMI</td>
            </tr>
        </tbody>
</table>

### Legend

- ✓ = Supported/Working
- ❌ = Not supported/Error
- ⚠️ = Warning/Limited support
- ? = Unknown/To be tested
- N/A = Not applicable

**Note**: Quectel RM551E-GL is still in ES stage, and its firmware has some problems during eSIM operation.

### Tested Physical eSIM Cards

1. [9eSIM](https://www.9esim.com/)

**Note**: If you've tested the application with other modules/eSIMs, please share your experience via Issue or PR.

## Contributing

This is a community-driven project and contributions are welcome. The application was developed iteratively and may contain areas for optimization or improvement.

### How to Contribute

1. **Bug Reports**: Found an issue? Open an [Issue](https://github.com/KilimcininKorOglu/luci-app-hermes-euicc/issues)
2. **Feature Requests**: Have an idea to improve the application? Share it via Issue
3. **Pull Requests**: Fixed a bug or added functionality? Submit a PR
4. **Documentation**: Help improve documentation and README files
5. **Testing**: Test on different modules/eSIMs and share your results

## Acknowledgments

- [estkme-group](https://github.com/estkme-group/hermes-euicc) for the hermes-euicc eSIM client
- [cozmo](https://github.com/cozmo/jsQR) for the JavaScript QR code library
- [OpenWrt community & LuCI developers](https://openwrt.org/) for the ecosystem
