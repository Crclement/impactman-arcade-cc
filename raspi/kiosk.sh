#!/bin/bash
# Kiosk mode launcher for Impactman arcade cabinet

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor after 0.5s of inactivity
unclutter -idle 0.5 -root &

# Wait for desktop to fully load
sleep 5

# Launch Chromium in kiosk mode
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble --disable-restore-session-state \
  --start-fullscreen https://dev.impactarcade.com/games/impactman
