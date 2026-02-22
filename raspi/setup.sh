#!/bin/bash
# Impactman Arcade - Raspberry Pi 5 Setup Script
# Run this script after first boot to configure everything

set -e

echo "================================"
echo "  Impactman Arcade Setup"
echo "  Raspberry Pi 5 Configuration"
echo "================================"
echo ""

# Update system
echo "[1/6] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "[2/6] Installing required packages..."
sudo apt install -y chromium-browser unclutter python3-gpiozero python3-evdev

# Copy GPIO mapper script
echo "[3/6] Installing GPIO mapper..."
sudo cp arcade-gpio.py /opt/arcade-gpio.py
sudo chmod +x /opt/arcade-gpio.py

# Create systemd service for GPIO mapper
echo "[4/6] Creating GPIO mapper service..."
sudo tee /etc/systemd/system/arcade-gpio.service > /dev/null <<EOF
[Unit]
Description=Arcade GPIO to Keyboard Mapper
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/arcade-gpio.py
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable arcade-gpio.service
sudo systemctl start arcade-gpio.service

# Install kiosk script
echo "[5/6] Installing kiosk launcher..."
cp kiosk.sh ~/kiosk.sh
chmod +x ~/kiosk.sh

# Create autostart entry
mkdir -p ~/.config/autostart
tee ~/.config/autostart/kiosk.desktop > /dev/null <<EOF
[Desktop Entry]
Type=Application
Name=Kiosk
Exec=/home/$USER/kiosk.sh
X-GNOME-Autostart-enabled=true
EOF

echo "[6/6] Setup complete!"
echo ""
echo "================================"
echo "  Next Steps:"
echo "================================"
echo "1. Wire joystick & button to GPIO pins:"
echo "   - UP    -> GPIO 17 (Pin 11)"
echo "   - DOWN  -> GPIO 27 (Pin 13)"
echo "   - LEFT  -> GPIO 22 (Pin 15)"
echo "   - RIGHT -> GPIO 23 (Pin 16)"
echo "   - BTN   -> GPIO 24 (Pin 18)"
echo "   - GND   -> Pin 6, 9, 14, or 20"
echo ""
echo "2. Connect display via LCD controller board"
echo "3. Connect audio via amplifier"
echo "4. Reboot to test: sudo reboot"
echo ""
