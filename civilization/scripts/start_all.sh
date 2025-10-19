#!/bin/bash

echo "=========================================="
echo "Starting Minecraft Civilization System"
echo "=========================================="

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
fi

echo "Starting civilization bots..."
node civilization/index.js &
CIVILIZATION_PID=$!

echo "Starting dashboard..."
node dashboard/server.js &
DASHBOARD_PID=$!

echo ""
echo "System started!"
echo "Civilization PID: $CIVILIZATION_PID"
echo "Dashboard PID: $DASHBOARD_PID"
echo ""
echo "Dashboard: http://localhost:3000"
echo "WebSocket Broker: ws://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

wait
