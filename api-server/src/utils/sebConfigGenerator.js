import crypto from 'crypto';

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Hash password for SEB (SHA256)
 * @param {string} password - Password to hash
 * @returns {string} SHA256 hash
 */
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Generate SEB Configuration XML
 * @param {string} startUrl - The URL where SEB will navigate
 * @param {object} settings - Configuration settings
 * @returns {string} XML configuration
 */
export const generateSEBConfigXML = (startUrl, settings = {}) => {
  const {
    examName = 'Secure Exam',
    allowQuit = false,
    quitPassword = '',
    sebFrontendUrl = ''
  } = settings;

  // Extract domain from SEB frontend URL
  let domain = '';
  try {
    const url = new URL(sebFrontendUrl);
    domain = url.origin;
  } catch (error) {
    // If URL parsing fails, use the sebFrontendUrl as is
    domain = sebFrontendUrl;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Basic Information -->
    <key>originatorVersion</key>
    <string>3.0</string>
    
    <key>examName</key>
    <string>${escapeXml(examName)}</string>
    
    <!-- Start URL - This is where SEB will navigate -->
    <key>startURL</key>
    <string>${escapeXml(startUrl)}</string>
    
    <!-- Browser Display Mode -->
    <key>browserViewMode</key>
    <integer>0</integer>
    
    <key>mainBrowserWindowWidth</key>
    <string>100%</string>
    
    <key>mainBrowserWindowHeight</key>
    <string>100%</string>
    
    <key>enableBrowserWindowToolbar</key>
    <false/>
    
    <key>hideBrowserWindowToolbar</key>
    <true/>
    
    <key>showMenuBar</key>
    <false/>
    
    <key>showReloadButton</key>
    <false/>
    
    <!-- Security Settings -->
    <key>allowQuit</key>
    <${allowQuit}/>
    ${quitPassword ? `
    <key>hashedQuitPassword</key>
    <string>${hashPassword(quitPassword)}</string>` : ''}
    
    <key>showTaskBar</key>
    <false/>
    
    <key>allowSwitchToApplications</key>
    <false/>
    
    <key>allowFlashFullscreen</key>
    <false/>
    
    <!-- Disable Audio/Video -->
    <key>allowAudioCapture</key>
    <false/>
    
    <key>allowVideoCapture</key>
    <false/>
    
    <!-- Disable Downloads -->
    <key>allowDownUploads</key>
    <false/>
    
    <!-- Disable Spell Check -->
    <key>allowSpellCheck</key>
    <false/>
    
    <key>allowDictionaryLookup</key>
    <false/>
    
    <!-- Block Pop-ups -->
    <key>blockPopUpWindows</key>
    <true/>
    
    <key>newBrowserWindowByLinkPolicy</key>
    <integer>2</integer>
    
    <key>newBrowserWindowByScriptPolicy</key>
    <integer>2</integer>
    
    <!-- URL Filtering - CRITICAL FOR SECURITY -->
    <key>enableURLFilter</key>
    <true/>
    
    <key>enableURLContentFilter</key>
    <false/>
    
    <key>urlFilterRules</key>
    <array>
        <!-- Allow only SEB frontend domain -->
        <dict>
            <key>active</key>
            <true/>
            <key>regex</key>
            <false/>
            <key>expression</key>
            <string>${domain}/*</string>
            <key>action</key>
            <integer>1</integer>
        </dict>
        <!-- Block everything else -->
        <dict>
            <key>active</key>
            <true/>
            <key>regex</key>
            <false/>
            <key>expression</key>
            <string>*</string>
            <key>action</key>
            <integer>0</integer>
        </dict>
    </array>
    
    <!-- Clear Cookies -->
    <key>examSessionClearCookiesOnStart</key>
    <true/>
    
    <key>examSessionClearCookiesOnEnd</key>
    <true/>
    
    <!-- Send Browser Exam Key (for additional security) -->
    <key>sendBrowserExamKey</key>
    <true/>
    
    <!-- Logging -->
    <key>allowApplicationLog</key>
    <true/>
    
    <key>logLevel</key>
    <integer>1</integer>
    
    <!-- Disable Keyboard Shortcuts -->
    <key>enableAltEsc</key>
    <false/>
    
    <key>enableAltTab</key>
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
    
    <!-- SEB Service -->
    <key>enableSebBrowser</key>
    <true/>
    
    <key>sebServicePolicy</key>
    <integer>1</integer>
    
    <!-- Touch Optimization -->
    <key>touchOptimized</key>
    <true/>
    
    <key>enableTouchExit</key>
    <false/>
</dict>
</plist>`;

  return xml;
};
