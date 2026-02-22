# Impactman Arcade Console Setup

## Hardware
- Raspberry Pi 5 (4GB)
- 32GB microSD card

## Raspberry Pi Imager Settings

**OS:** Raspberry Pi OS Lite (64-bit)

| Setting | Value |
|---------|-------|
| Hostname | `impactmanConsole001` (increment for each unit) |
| Enable SSH | Yes (password auth) |
| Username | `sprusr` |
| Password | `sprusr1!` |
| WiFi SSID | `The Flying Pig` |
| WiFi Password | `makepigsfly` |
| WiFi Country | `US` |

## Post-Boot Setup Commands

SSH into the Pi:
```bash
ssh sprusr@impactmanConsole001.local
```

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Install Kiosk Dependencies
```bash
sudo apt install -y chromium cage
```

### 4. Configure Auto-Login
```bash
sudo mkdir -p /etc/systemd/system/getty@tty1.service.d
sudo tee /etc/systemd/system/getty@tty1.service.d/autologin.conf << 'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin sprusr --noclear %I $TERM
EOF
```

### 5. Configure Kiosk Auto-Start
```bash
cat >> ~/.bash_profile << 'EOF'

# Auto-start kiosk on tty1
if [ "$(tty)" = "/dev/tty1" ]; then
    exec cage -- chromium --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-translate --no-first-run https://dev.impactarcade.com/games/impactman
fi
EOF
```

### 6. Deploy Monitoring Agent
Copy `monitor-agent.py` to `/home/sprusr/`:
```bash
scp monitor-agent.py sprusr@impactmanConsole001.local:/home/sprusr/
```

Make executable:
```bash
chmod +x /home/sprusr/monitor-agent.py
```

### 7. Create Monitoring Service
```bash
sudo tee /etc/systemd/system/monitor-agent.service << 'EOF'
[Unit]
Description=Impactman Monitoring Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=sprusr
Environment=CONSOLE_ID=IMP-CONSOLE001
Environment=CONSOLE_NAME=Arcade Console 001
Environment=MONITOR_API=https://impactman.up.railway.app/api/status
ExecStart=/usr/bin/python3 /home/sprusr/monitor-agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

**Important:** Update `CONSOLE_ID` and `CONSOLE_NAME` for each unit.

### 8. Enable Monitoring Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable monitor-agent
sudo systemctl start monitor-agent
```

### 9. Reboot
```bash
sudo reboot
```

## Verification

After reboot:
- Game should launch fullscreen on connected display
- Monitor agent should report to dashboard every 30s

Check monitoring status:
```bash
sudo systemctl status monitor-agent
```

View monitoring logs:
```bash
journalctl -u monitor-agent -f
```

## Quick Reference

| Service | Command |
|---------|---------|
| SSH in | `ssh sprusr@impactmanConsole001.local` |
| Reboot | `sudo reboot` |
| Stop kiosk | `Ctrl+Alt+Backspace` (from physical keyboard) |
| Monitor status | `sudo systemctl status monitor-agent` |
| Monitor logs | `journalctl -u monitor-agent -f` |
