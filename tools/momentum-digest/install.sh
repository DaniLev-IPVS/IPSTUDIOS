#!/bin/bash
# Installs a LaunchAgent that checks every 15 minutes and posts the digest once a day,
# the first time it runs between 8:00 and 12:00 New York time.
# Today is marked as sent, so the first post is tomorrow morning.
# Uninstall: launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/io.ipstudios.momentum-digest.plist
set -e
D="$(cd "$(dirname "$0")" && pwd)"
P="$HOME/Library/LaunchAgents/io.ipstudios.momentum-digest.plist"
TZ=America/New_York date +%F > "$D/.last-sent"
cat > "$P" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>io.ipstudios.momentum-digest</string>
  <key>ProgramArguments</key><array><string>$D/run.sh</string></array>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
  <key>StartInterval</key><integer>900</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$D/digest.log</string>
  <key>StandardErrorPath</key><string>$D/digest.log</string>
</dict></plist>
EOF
launchctl bootout "gui/$(id -u)" "$P" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$P"
echo "Installed. First post: tomorrow 8 AM ET. Log: $D/digest.log"
