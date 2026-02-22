#!/usr/bin/env python3
"""
Impactman Monitoring Agent
Runs on each Raspberry Pi and reports system health to the central dashboard.
"""

import os
import socket
import time
import json
import subprocess
import urllib.request
import urllib.error

# Configuration
API_ENDPOINT = os.environ.get('MONITOR_API', 'https://impactman.up.railway.app/api/status')
CONSOLE_ID = os.environ.get('CONSOLE_ID', 'IMP-001')
CONSOLE_NAME = os.environ.get('CONSOLE_NAME', 'Arcade Console')
REPORT_INTERVAL = 30  # seconds
VERSION = '1.2.3'

def get_cpu_temp():
    """Get CPU temperature in Celsius"""
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = int(f.read().strip()) / 1000
            return round(temp, 1)
    except:
        return 0

def get_cpu_usage():
    """Get CPU usage percentage"""
    try:
        result = subprocess.run(
            ['grep', 'cpu ', '/proc/stat'],
            capture_output=True, text=True
        )
        parts = result.stdout.split()
        idle = int(parts[4])
        total = sum(int(x) for x in parts[1:])

        # Need two samples to calculate usage
        time.sleep(0.1)

        result2 = subprocess.run(
            ['grep', 'cpu ', '/proc/stat'],
            capture_output=True, text=True
        )
        parts2 = result2.stdout.split()
        idle2 = int(parts2[4])
        total2 = sum(int(x) for x in parts2[1:])

        idle_delta = idle2 - idle
        total_delta = total2 - total

        usage = 100 * (1 - idle_delta / total_delta)
        return round(usage, 1)
    except:
        return 0

def get_memory_usage():
    """Get memory usage percentage"""
    try:
        with open('/proc/meminfo', 'r') as f:
            lines = f.readlines()

        mem_total = int(lines[0].split()[1])
        mem_available = int(lines[2].split()[1])

        usage = 100 * (1 - mem_available / mem_total)
        return round(usage, 1)
    except:
        return 0

def get_disk_usage():
    """Get root disk usage percentage"""
    try:
        result = subprocess.run(
            ['df', '/'],
            capture_output=True, text=True
        )
        lines = result.stdout.strip().split('\n')
        parts = lines[1].split()
        usage = int(parts[4].replace('%', ''))
        return usage
    except:
        return 0

def get_uptime():
    """Get system uptime as human-readable string"""
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.read().split()[0])

        days = int(uptime_seconds // 86400)
        hours = int((uptime_seconds % 86400) // 3600)

        if days > 0:
            return f"{days}d {hours}h"
        else:
            minutes = int((uptime_seconds % 3600) // 60)
            return f"{hours}h {minutes}m"
    except:
        return "unknown"

def get_ip_address():
    """Get the primary IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "unknown"

def get_hostname():
    """Get system hostname"""
    return socket.gethostname()

def check_game_running():
    """Check if chromium/game is running"""
    try:
        result = subprocess.run(
            ['pgrep', '-f', 'chromium'],
            capture_output=True
        )
        return result.returncode == 0
    except:
        return False

def collect_status():
    """Collect all system status data"""
    return {
        'consoleId': CONSOLE_ID,
        'name': CONSOLE_NAME,
        'version': VERSION,
        'hostname': get_hostname(),
        'ip': get_ip_address(),
        'temperature': get_cpu_temp(),
        'cpuUsage': get_cpu_usage(),
        'memoryUsage': get_memory_usage(),
        'diskUsage': get_disk_usage(),
        'uptime': get_uptime(),
        'gameRunning': check_game_running(),
        'timestamp': int(time.time() * 1000)
    }

def send_status(status):
    """Send status to the monitoring API"""
    try:
        data = json.dumps(status).encode('utf-8')
        req = urllib.request.Request(
            API_ENDPOINT,
            data=data,
            headers={'Content-Type': 'application/json'}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status == 200
    except urllib.error.URLError as e:
        print(f"Failed to send status: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print(f"Impactman Monitor Agent v{VERSION}")
    print(f"Console ID: {CONSOLE_ID}")
    print(f"Reporting to: {API_ENDPOINT}")
    print(f"Interval: {REPORT_INTERVAL}s")
    print("-" * 40)

    while True:
        status = collect_status()
        success = send_status(status)

        if success:
            print(f"[OK] Reported: CPU {status['cpuUsage']}%, Temp {status['temperature']}°C, Mem {status['memoryUsage']}%")
        else:
            print(f"[FAIL] Could not reach API")

        time.sleep(REPORT_INTERVAL)

if __name__ == '__main__':
    main()
