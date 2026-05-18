#!/usr/bin/env python3
"""Face Reading App Server - Serves the app for mobile access."""
import http.server
import socket
import sys
import os

PORT = 8888

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Get local IP
def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return '127.0.0.1'

local_ip = get_ip()

print('╔══════════════════════════════════════╗')
print('║       🔮  面相分析 · 已启动         ║')
print('╠══════════════════════════════════════╣')
print(f'║  电脑访问: http://localhost:{PORT}     ║')
print(f'║  手机访问: http://{local_ip}:{PORT}    ║')
print('║                                      ║')
print('║  确保手机和电脑在同一个 WiFi 下     ║')
print('║  按 Ctrl+C 停止服务器               ║')
print('╚══════════════════════════════════════╝')

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # quiet

http.server.HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
