const config = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>logLevel</key>
        <integer>3</integer>
        <key>enableLogging</key>
        <true/>
        <key>browserExamKeySalt</key>
        <data>QUJDREVGR0g=</data>
        <key>logDirectoryWin</key>
        <string>%USERPROFILE%\Desktop\SEBLogs</string>
        <key>sebServerFallback</key>
        <false/>
        <key>debugMode</key>
        <true/>
        <key>startURL</key>
        <string>http://localhost:5173/</string>
        <key>allowPreferencesWindow</key>
        <false />
        <key>browserViewMode</key>
        <integer>1</integer>
        <key>showReloadButton</key>
        <true />
        <key>monitorProcesses</key>
        <true />
        <key>newBrowserWindowByLinkBlockForeign</key>
        <false />
        <key>newBrowserWindowNavigation</key>
        <false />
        <key>newBrowserWindowAllowReload</key>
        <false />
        <key>allowDownUploads</key>
        <true/>
        <key>allowCustomDownUploadLocation</key>
        <true />
        <key>enhancedSebConfig</key>
        <dict>
            <key>certificateSSLVerificationDisabled</key>
            <true/>
        </dict>
        <key>downloadAndOpenSebConfig</key>
        <false />
        <key>startURLAppendQueryParameter</key>
        <true />
        <key>allowWlan</key>
        <true />
        <key>allowedDisplayBuiltinEnforce</key>
        <false />
        <key>allowScreenSharing</key>
        <false />
        <key>enableAltTab</key>
        <false />
        <key>allowAudioCapture</key>
        <true />
        <key>allowFind</key>
        <false />
        <key>allowQuit</key>
        <true />
        <key>allowVideoCapture</key>
        <true />
        <key>quitURL</key>
        <string>https://test.pod.ai/exit</string>
        <key>quitURLConfirm</key>
        <false />
        <key>enableRightMouse</key>
        <false />
        <key>browserMediaCaptureCamera</key>
        <true />
        <key>browserMediaCaptureMicrophone</key>
        <true />
        <key>browserMediaCaptureScreen</key>
        <false />
        <key>allowMacOSVersionNumberCheckFull</key>
        <true/>
        <key>allowMacOSVersionNumberMajor</key>
        <integer>11</integer>
        <key>allowMacOSVersionNumberMinor</key>
        <integer>1</integer>
        <key>allowMacOSVersionNumberPatch</key>
        <integer>0</integer>
        <key>allowedDisplaysMaxNumber</key>
        <integer>1</integer>
        <key>downloadDirectoryWin</key>
        <string>%USERPROFILE%\Desktop</string>
        <key>systemAlwaysOn</key>
        <true />
        <key>displayAlwaysOn</key>
        <true />
        <key>allowDownloads</key>
        <true />
        <key>allowUploads</key>
        <true />
        <key>clipboardPolicy</key>
        <integer>1</integer>
        <key>enableCursorVerification</key>
        <false />
        <key>enableCursorVerification</key>
        <true />
        <key>disableSessionChangeLockScreen</key>
        <true />
        <key>batteryChargeThresholdCritical</key>
        <real>0.1</real>
        <key>batteryChargeThresholdLow</key>
        <real>0.2</real>
        <key>allowWindowCapture</key>
        <true />
        <key>enableMacOSAAC</key>
        <true />
        <key>blockScreenShotsLegacy</key>
        <true />
        <key>enableZoomPage</key>
        <false />
        <key>enableZoomText</key>
        <false />
        <key>prohibitedProcesses</key>
        <array>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>zoom.us</string>
                <key>identifier</key>
                <string>us.zoom.xos</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Skype</string>
                <key>identifier</key>
                <string>com.skype.skype</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Skype for Business</string>
                <key>identifier</key>
                <string>com.microsoft.SkypeForBusiness</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Microsoft Communicator</string>
                <key>identifier</key>
                <string>com.microsoft.Communicator</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Microsoft Lync</string>
                <key>identifier</key>
                <string>com.microsoft.Lync</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Element (Riot)</string>
                <key>identifier</key>
                <string>im.riot.app</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Universal Control</string>
                <key>identifier</key>
                <string>com.apple.universalcontrol</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Keyboard Viewer (Assistive Control)</string>
                <key>identifier</key>
                <string>com.apple.inputmethod.AssistiveControl</string>
                <key>ignoreInAAC</key>
                <false/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
                <key>windowHandlingProcess</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>FaceTime</string>
                <key>identifier</key>
                <string>com.apple.FaceTime</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Messages</string>
                <key>identifier</key>
                <string>com.apple.iChat</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Messages</string>
                <key>identifier</key>
                <string>com.apple.MobileSMS</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Telegram</string>
                <key>identifier</key>
                <string>ru.keepcoder.Telegram</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>GoToMeeting</string>
                <key>identifier</key>
                <string>com.logmein.GoToMeeting</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Join.me</string>
                <key>identifier</key>
                <string>com.logmein.join.me</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Slack</string>
                <key>identifier</key>
                <string>com.tinyspeck.slackmacgap</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>MSTeams</string>
                <key>identifier</key>
                <string>com.microsoft.teams2</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
                <key>windowHandlingProcess</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Teams</string>
                <key>identifier</key>
                <string>com.microsoft.teams</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>webexmta</string>
                <key>identifier</key>
                <string>com.cisco.webex.webexmta</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Adium</string>
                <key>identifier</key>
                <string>com.adiumX.adiumX</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>TeamViewer</string>
                <key>identifier</key>
                <string>com.TeamViewer.TeamViewer</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>TeamViewer</string>
                <key>identifier</key>
                <string>com.teamviewer.TeamViewer</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>TeamViewer Meeting</string>
                <key>identifier</key>
                <string>com.teamviewer.blizz</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>The user will have to deactivate/uninstall RealVNC server to use SEB.</string>
                <key>executable</key>
                <string>vncserver</string>
                <key>identifier</key>
                <string></string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Chicken</string>
                <key>identifier</key>
                <string>com.geekspiff.chickenofthevnc</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Chicken</string>
                <key>identifier</key>
                <string>net.sourceforge.chicken</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Screenconnect</string>
                <key>identifier</key>
                <string>com.elsitech.screenconnect.client</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Camtasia*</string>
                <key>identifier</key>
                <string>com.techsmith.camtasia*</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>AnyDesk</string>
                <key>identifier</key>
                <string>com.philandro.anydesk</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Alfred*</string>
                <key>identifier</key>
                <string>com.runningwithcrayons.Alfred*</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>AnyGPT</string>
                <key>identifier</key>
                <string>me.tanmay.AnyGPT</string>
                <key>ignoreInAAC</key>
                <false/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>This stops video conferencing and screen sharing, without having to quit the browser.</string>
                <key>executable</key>
                <string>Safari/WebKit Networking</string>
                <key>identifier</key>
                <string>com.apple.WebKit.Networking</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>This stops video conferencing and screen sharing, without having to quit the browser.</string>
                <key>executable</key>
                <string>Google Chrome Helper</string>
                <key>identifier</key>
                <string></string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
                <key>windowHandlingProcess</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>This stops video conferencing and screen sharing, without having to quit the browser.</string>
                <key>executable</key>
                <string>Chromium Helper</string>
                <key>identifier</key>
                <string></string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Chrome Remote Desktop Host</string>
                <key>identifier</key>
                <string>com.google.chrome.remote_desktop.native-messaging-host</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>This stops video conferencing and screen sharing, without having to quit the browser.</string>
                <key>executable</key>
                <string>Brave Browser Helper</string>
                <key>identifier</key>
                <string></string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>This stops video conferencing and screen sharing, without having to quit the browser.</string>
                <key>executable</key>
                <string>Opera Helper</string>
                <key>identifier</key>
                <string></string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>This stops video conferencing and screen sharing, without having to quit the browser.</string>
                <key>executable</key>
                <string>Vivaldi Helper</string>
                <key>identifier</key>
                <string></string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>This stops video conferencing and screen sharing, without having to quit the browser.</string>
                <key>executable</key>
                <string>Microsoft Edge Helper</string>
                <key>identifier</key>
                <string></string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string></string>
                <key>executable</key>
                <string>Discord</string>
                <key>identifier</key>
                <string>com.hnc.Discord*</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <false/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true/>
                <key>allowedExecutables</key>
                <string></string>
                <key>currentUser</key>
                <false/>
                <key>description</key>
                <string>Firefox: This stops video conferencing and screen sharing, without having to quit the browser. Users have to restore their open tabs afterwards though.</string>
                <key>executable</key>
                <string>plugin-container</string>
                <key>identifier</key>
                <string>org.mozilla.plugincontainer</string>
                <key>ignoreInAAC</key>
                <true/>
                <key>originalName</key>
                <string></string>
                <key>os</key>
                <integer>0</integer>
                <key>strongKill</key>
                <true/>
                <key>user</key>
                <string></string>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>vlc.exe</string>
                <key>originalName</key>
                <string>vlc.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Microsoft.Media.Player.exe</string>
                <key>originalName</key>
                <string>Microsoft.Media.Player.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>spotify.exe</string>
                <key>originalName</key>
                <string>spotify.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>obs32.exe</string>
                <key>originalName</key>
                <string>obs32.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>obs64.exe</string>
                <key>originalName</key>
                <string>obs64.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>pcmontask.exe</string>
                <key>originalName</key>
                <string>pcmontask.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>PCMonitorSrv.exe</string>
                <key>originalName</key>
                <string>PCMonitorSrv.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>strwinclt.exe</string>
                <key>originalName</key>
                <string>strwinclt.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>SRServer.exe</string>
                <key>originalName</key>
                <string>SRServer.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>remoting_host.exe</string>
                <key>originalName</key>
                <string>remoting_host.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>MS-Teams.exe</string>
                <key>originalName</key>
                <string>MS-Teams.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>CiscoWebExStart.exe</string>
                <key>originalName</key>
                <string>CiscoWebExStart.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>CiscoCollabHost.exe</string>
                <key>originalName</key>
                <string>CiscoCollabHost.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>AA_v3.exe</string>
                <key>originalName</key>
                <string>AA_v3.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>ptoneclk.exe</string>
                <key>originalName</key>
                <string>ptoneclk.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>webexmta.exe</string>
                <key>originalName</key>
                <string>webexmta.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Teams.exe</string>
                <key>originalName</key>
                <string>Teams.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>join.me.sentinel.exe</string>
                <key>originalName</key>
                <string>join.me.sentinel.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>join.me.exe</string>
                <key>originalName</key>
                <string>join.me.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>g2mstart.exe</string>
                <key>originalName</key>
                <string>g2mstart.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>g2mlauncher.exe</string>
                <key>originalName</key>
                <string>g2mlauncher.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Telegram.exe</string>
                <key>originalName</key>
                <string>Telegram.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Zoom.exe</string>
                <key>originalName</key>
                <string>Zoom.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Element.exe</string>
                <key>originalName</key>
                <string>Element.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>slack.exe</string>
                <key>originalName</key>
                <string>slack.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>CamtasiaUtl.exe</string>
                <key>originalName</key>
                <string>CamtasiaUtl.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>CamRecorder.exe</string>
                <key>originalName</key>
                <string>CamRecorder.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>CamPlay.exe</string>
                <key>originalName</key>
                <string>CamPlay.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Camtasia_Studio.exe</string>
                <key>originalName</key>
                <string>Camtasia_Studio.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>CamtasiaStudio.exe</string>
                <key>originalName</key>
                <string>CamtasiaStudio.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Camtasia.exe</string>
                <key>originalName</key>
                <string>Camtasia.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Discord.exe</string>
                <key>originalName</key>
                <string>Discord.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>RPCSuite.exe</string>
                <key>originalName</key>
                <string>RPCSuite.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>RPCService.exe</string>
                <key>originalName</key>
                <string>RPCService.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>RemotePCDesktop.exe</string>
                <key>originalName</key>
                <string>RemotePCDesktop.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>beamyourscreen-host.exe</string>
                <key>originalName</key>
                <string>beamyourscreen-host.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>AeroAdmin.exe</string>
                <key>originalName</key>
                <string>AeroAdmin.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Mikogo-host.exe</string>
                <key>originalName</key>
                <string>Mikogo-host.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>chromoting.exe</string>
                <key>originalName</key>
                <string>chromoting.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>vncserverui.exe</string>
                <key>originalName</key>
                <string>vncserverui.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>vncviewer.exe</string>
                <key>originalName</key>
                <string>vncviewer.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>vncserver.exe</string>
                <key>originalName</key>
                <string>vncserver.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>TeamViewer.exe</string>
                <key>originalName</key>
                <string>TeamViewer.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>GotoMeetingWinStore.exe</string>
                <key>originalName</key>
                <string>GotoMeetingWinStore.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>g2mcomm.exe</string>
                <key>originalName</key>
                <string>g2mcomm.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>SkypeHost.exe</string>
                <key>originalName</key>
                <string>SkypeHost.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>SkypeApp.exe</string>
                <key>originalName</key>
                <string>SkypeApp.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Skype.exe</string>
                <key>originalName</key>
                <string>Skype.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>UltraViewer_Desktop.exe</string>
                <key>originalName</key>
                <string>UltraViewer_Desktop.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>AnyDesk.exe</string>
                <key>originalName</key>
                <string>AnyDesk.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>TeamViewerMeeting.exe</string>
                <key>originalName</key>
                <string>TeamViewerMeeting.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>SmartConnect.exe</string>
                <key>originalName</key>
                <string>SmartConnect.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>currentUser</key>
                <true />
                <key>strongKill</key>
                <false />
                <key>os</key>
                <integer>1</integer>
                <key>executable</key>
                <string>Bdcam.exe</string>
                <key>originalName</key>
                <string>Bdcam.exe</string>
                <key>description</key>
                <string />
                <key>identifier</key>
                <string />
                <key>windowHandlingProcess</key>
                <string />
                <key>user</key>
                <string />
            </dict>
        </array>
        <key>URLFilterEnable</key>
        <true />
        <key>URLFilterEnableContentFilter</key>
        <false/>
        <key>URLFilterRules</key>
        <array>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>https://www.youtube.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>https://www.facebook.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>twitter.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>x.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>https://www.linkedin.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>play.google.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>apps.apple.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>https://www.instagram.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>github.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <false />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>google.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>google.co.in/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>zoho.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>discord.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>https://openspeedtest.com/*</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>https://developers.cloudflare.com/1.1.1.1/setting-up-1.1.1.1/windows/</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>https://dotnet.microsoft.com/en-us/download/dotnet-framework/thank-you/net472-web-installer</string>
                <key>action</key>
                <integer>0</integer>
            </dict>
            <dict>
                <key>active</key>
                <true />
                <key>regex</key>
                <false />
                <key>expression</key>
                <string>*</string>
                <key>action</key>
                <integer>1</integer>
            </dict>
        </array>
        <key>createNewDesktop</key>
        <true />
        <key>allowDisplayMirroring</key>
        <false />
        <key>killExplorerShell</key>
        <false />
        <key>sebConfigPurpose</key>
        <integer>0</integer>
        <key>sebServiceIgnore</key>
        <false />
        <key>sebServicePolicy</key>
        <integer>2</integer>
	<key>enablePrintScreen</key>
	<false />
        <key>enableWindowsUpdate</key>
        <false />
    </dict>
</plist>`

export default config;