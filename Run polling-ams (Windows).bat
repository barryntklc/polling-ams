TITLE "Starting polling-ams"

REM Later, load this port number from a config file instead.

echo "Loading meteor."
start "polling-ams - meteor" meteor -p 3000
timeout /t 15
echo "Starting mongo terminal."
start "polling-ams - mongo" meteor mongo
echo "Opening polling-ams"
start "" "http://localhost:3000"
REM pause