@echo off
echo Adding Windows Firewall rule for Face Reading app (port 8888)...
netsh advfirewall firewall add rule name="FaceReading" dir=in action=allow protocol=TCP localport=3000
echo.
echo Done! You can now close this window and start run.bat
pause
