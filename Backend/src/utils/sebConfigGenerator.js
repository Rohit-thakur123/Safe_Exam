import crypto from 'crypto';

const escapeXml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export const generateSEBConfig = ({ startUrl, quitPassword }) => {
    const hashedQuitPassword = sha256(quitPassword);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>startURL</key>
    <string>${escapeXml(startUrl)}</string>
    <key>hashedQuitPassword</key>
    <string>${hashedQuitPassword}</string>
    <key>allowQuit</key>
    <true/>
    <key>browserWindowAllowReload</key>
    <false/>
    <key>browserWindowAllowAddressBar</key>
    <false/>
    <key>browserWindowAllowBackwardNavigation</key>
    <false/>
    <key>browserWindowAllowForwardNavigation</key>
    <false/>
    <key>newBrowserWindowByLinkPolicy</key>
    <integer>0</integer>
    <key>newBrowserWindowByScriptPolicy</key>
    <integer>0</integer>
    <key>allowPreferencesWindow</key>
    <false/>
    <key>enableAltEsc</key>
    <false/>
    <key>enableAltF4</key>
    <false/>
    <key>enableCtrlEsc</key>
    <false/>
    <key>enableEsc</key>
    <false/>
    <key>enableF1</key>
    <false/>
    <key>enableF2</key>
    <false/>
    <key>enableF3</key>
    <false/>
    <key>enableF4</key>
    <false/>
    <key>enableF5</key>
    <false/>
    <key>enableF6</key>
    <false/>
    <key>enableF7</key>
    <false/>
    <key>enableF8</key>
    <false/>
    <key>enableF9</key>
    <false/>
    <key>enableF10</key>
    <false/>
    <key>enableF11</key>
    <false/>
    <key>enableF12</key>
    <false/>
    <key>enablePrintScreen</key>
    <false/>
    <key>sendBrowserExamKey</key>
    <true/>
    <key>browserExamKey</key>
    <string>exam-demo-key</string>
    <key>allowSwitchToApplications</key>
    <false/>
    <key>allowVirtualMachine</key>
    <false/>
    <key>browserViewMode</key>
    <integer>1</integer>
</dict>
</plist>
`;
};
