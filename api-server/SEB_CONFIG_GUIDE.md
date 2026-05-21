# SEB Configuration Structure

This document explains the Safe Exam Browser (SEB) configuration XML structure used in the API server.

## Overview

The `.seb` file is an XML file in Apple's Property List (plist) format. It contains all the settings that control how Safe Exam Browser operates during an exam.

---

## Root Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Configuration keys here -->
</dict>
</plist>
```

---

## Key Configuration Sections

### 1. Basic Information

```xml
<key>originatorVersion</key>
<string>3.0</string>

<key>examName</key>
<string>Mathematics Final Exam</string>

<key>startURL</key>
<string>https://seb.yourexam.com/exam/507f1f77bcf86cd799439011/eyJhbGci...</string>
```

**Fields:**
- `originatorVersion`: SEB version compatibility
- `examName`: Display name of the exam
- `startURL`: The URL SEB will navigate to (includes session token)

---

### 2. Browser Display Settings

```xml
<key>browserViewMode</key>
<integer>0</integer>  <!-- 0=fullscreen, 1=windowed -->

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
```

**Purpose:** Configure how the browser window appears

---

### 3. Security Settings

```xml
<key>allowQuit</key>
<false/>  <!-- Set to true to allow quit with password -->

<key>hashedQuitPassword</key>
<string>9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</string>

<key>showTaskBar</key>
<false/>

<key>allowSwitchToApplications</key>
<false/>

<key>allowFlashFullscreen</key>
<false/>
```

**Purpose:** Prevent students from exiting or switching applications

---

### 4. Media Capture Settings

```xml
<key>allowAudioCapture</key>
<false/>

<key>allowVideoCapture</key>
<false/>
```

**Purpose:** Disable camera and microphone access

---

### 5. Download/Upload Settings

```xml
<key>allowDownUploads</key>
<false/>
```

**Purpose:** Prevent file downloads during exam

---

### 6. Browser Features

```xml
<key>allowSpellCheck</key>
<false/>

<key>allowDictionaryLookup</key>
<false/>

<key>blockPopUpWindows</key>
<true/>

<key>newBrowserWindowByLinkPolicy</key>
<integer>2</integer>  <!-- 2=block all -->

<key>newBrowserWindowByScriptPolicy</key>
<integer>2</integer>
```

**Purpose:** Disable browser features that could be used for cheating

---

### 7. URL Filtering (Critical)

```xml
<key>enableURLFilter</key>
<true/>

<key>enableURLContentFilter</key>
<false/>

<key>urlFilterRules</key>
<array>
    <!-- Allow only exam domain -->
    <dict>
        <key>active</key>
        <true/>
        <key>regex</key>
        <false/>
        <key>expression</key>
        <string>https://seb.yourexam.com/*</string>
        <key>action</key>
        <integer>1</integer>  <!-- 1=Allow -->
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
        <integer>0</integer>  <!-- 0=Block -->
    </dict>
</array>
```

**Purpose:** Restrict navigation to only the exam domain

**Important:** This is the most critical security setting. Only the exam domain should be allowed.

---

### 8. Cookie Management

```xml
<key>examSessionClearCookiesOnStart</key>
<true/>

<key>examSessionClearCookiesOnEnd</key>
<true/>
```

**Purpose:** Clear cookies before and after exam for security

---

### 9. Browser Exam Key

```xml
<key>sendBrowserExamKey</key>
<true/>
```

**Purpose:** Send a special header that the exam server can verify to ensure the student is using SEB

**Header sent by SEB:**
```
X-SafeExamBrowser-RequestHash: <hash>
X-SafeExamBrowser-ConfigKeyHash: <hash>
```

---

### 10. Logging

```xml
<key>allowApplicationLog</key>
<true/>

<key>logLevel</key>
<integer>1</integer>  <!-- 0=Error, 1=Warning, 2=Info, 3=Debug -->
```

**Purpose:** Enable logging for debugging

---

### 11. Keyboard Shortcuts

```xml
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

<!-- ... F2-F12 all set to false ... -->

<key>enablePrintScreen</key>
<false/>
```

**Purpose:** Disable keyboard shortcuts that could be used to exit or switch applications

---

### 12. SEB Service

```xml
<key>enableSebBrowser</key>
<true/>

<key>sebServicePolicy</key>
<integer>1</integer>  <!-- 0=None, 1=Warn, 2=Force -->
```

**Purpose:** Configure SEB service integration (Windows only)

---

### 13. Touch Optimization

```xml
<key>touchOptimized</key>
<true/>

<key>enableTouchExit</key>
<false/>
```

**Purpose:** Optimize for touch devices but disable touch exit gestures

---

## Data Types

### Boolean Values

```xml
<true/>   <!-- True -->
<false/>  <!-- False -->
```

### Integer Values

```xml
<integer>0</integer>
<integer>1</integer>
<integer>2</integer>
```

### String Values

```xml
<string>Text value</string>
```

### Array Values

```xml
<array>
    <dict>
        <key>key1</key>
        <string>value1</string>
    </dict>
    <dict>
        <key>key2</key>
        <string>value2</string>
    </dict>
</array>
```

---

## Quit Password

If you enable quit with password:

```xml
<key>allowQuit</key>
<true/>

<key>hashedQuitPassword</key>
<string>9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</string>
```

**Password Hashing:**
```javascript
import crypto from 'crypto';

const password = 'exam2024';
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

---

## URL Filter Rules

### Allow Specific Domain

```xml
<dict>
    <key>active</key>
    <true/>
    <key>regex</key>
    <false/>  <!-- Use wildcard matching -->
    <key>expression</key>
    <string>https://seb.yourexam.com/*</string>
    <key>action</key>
    <integer>1</integer>  <!-- 1=Allow -->
</dict>
```

### Allow with Regex

```xml
<dict>
    <key>active</key>
    <true/>
    <key>regex</key>
    <true/>  <!-- Use regex matching -->
    <key>expression</key>
    <string>https://.*\.yourexam\.com/.*</string>
    <key>action</key>
    <integer>1</integer>
</dict>
```

### Block Everything Else

```xml
<dict>
    <key>active</key>
    <true/>
    <key>regex</key>
    <false/>
    <key>expression</key>
    <string>*</string>  <!-- Wildcard for all URLs -->
    <key>action</key>
    <integer>0</integer>  <!-- 0=Block -->
</dict>
```

**Important:** Rules are evaluated in order. Put specific allow rules first, then a catch-all block rule last.

---

## Common Configuration Profiles

### Maximum Security (Recommended)

```javascript
{
  examName: 'Final Exam',
  allowQuit: false,
  quitPassword: '',
  browserViewMode: 0,  // Fullscreen
  allowAudioCapture: false,
  allowVideoCapture: false,
  allowDownUploads: false,
  allowSwitchToApplications: false,
  blockPopUpWindows: true,
  enableURLFilter: true
}
```

### Moderate Security (Allow Quit)

```javascript
{
  examName: 'Practice Test',
  allowQuit: true,
  quitPassword: 'test2024',
  browserViewMode: 1,  // Windowed
  allowAudioCapture: false,
  allowVideoCapture: false,
  allowDownUploads: false,
  allowSwitchToApplications: false,
  blockPopUpWindows: true,
  enableURLFilter: true
}
```

---

## Testing Configuration

1. **Generate config file** using the API
2. **Open with SEB** (double-click `.seb` file)
3. **Verify:**
   - SEB opens in fullscreen
   - Navigate to exam URL automatically
   - Cannot switch to other applications
   - Keyboard shortcuts are disabled
   - Cannot access other websites

---

## Debugging

### Enable Debug Logging

```xml
<key>allowApplicationLog</key>
<true/>

<key>logLevel</key>
<integer>3</integer>  <!-- 3=Debug -->
```

### Log Location

**Windows:**
```
%USERPROFILE%\AppData\Local\SafeExamBrowser\Logs\
```

**macOS:**
```
~/Library/Logs/SafeExamBrowser/
```

---

## Security Best Practices

1. ✅ Always use `enableURLFilter` with strict rules
2. ✅ Set `allowQuit` to `false` for high-stakes exams
3. ✅ Disable all media capture
4. ✅ Block downloads and uploads
5. ✅ Disable keyboard shortcuts
6. ✅ Use fullscreen mode
7. ✅ Enable browser exam key
8. ✅ Clear cookies on start and end

---

## References

- [SEB Official Documentation](https://safeexambrowser.org/documentation/)
- [SEB Configuration Guide](https://safeexambrowser.org/news/news_seb_macos_config.html)
- [XML Plist Format](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/AboutInformationPropertyListFiles.html)

---

## Support

For issues with SEB configuration:
1. Check SEB logs
2. Verify URL filter rules
3. Test with SEB Configurator tool
4. Check SEB version compatibility
