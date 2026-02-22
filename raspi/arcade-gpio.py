#!/usr/bin/env python3
"""
Arcade GPIO to Keyboard Mapper for Raspberry Pi 5
Maps joystick directions and button to keyboard keys for Impactman
"""

from gpiozero import Button
from evdev import UInput, ecodes as e
from signal import pause

# GPIO to key mapping
# Adjust GPIO pins if your wiring differs
BUTTON_MAP = {
    17: e.KEY_UP,      # Joystick UP    - Pin 11
    27: e.KEY_DOWN,    # Joystick DOWN  - Pin 13
    22: e.KEY_LEFT,    # Joystick LEFT  - Pin 15
    23: e.KEY_RIGHT,   # Joystick RIGHT - Pin 16
    24: e.KEY_ENTER,   # Action Button  - Pin 18
}

ui = UInput()
buttons = {}

def press(pin):
    """Handle button press - send key down event"""
    ui.write(e.EV_KEY, BUTTON_MAP[pin], 1)
    ui.syn()

def release(pin):
    """Handle button release - send key up event"""
    ui.write(e.EV_KEY, BUTTON_MAP[pin], 0)
    ui.syn()

# Initialize all buttons with internal pull-up resistors
for pin, key in BUTTON_MAP.items():
    btn = Button(pin, pull_up=True, bounce_time=0.02)
    btn.when_pressed = lambda p=pin: press(p)
    btn.when_released = lambda p=pin: release(p)
    buttons[pin] = btn

print("Arcade GPIO mapper running...")
print("Mapped pins:", list(BUTTON_MAP.keys()))
pause()
