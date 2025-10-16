# 🧪 BetterBender 2.0 - Testing & Validation Guide

## Pre-Deployment Testing Checklist

Before running your bot 24/7, complete these tests to ensure stability.

---

## 1. Basic Functionality Tests

### Test 1: Bot Startup
```bash
npm run dashboard
```
**Expected**: 
- Dashboard starts on port 5000
- No errors in console
- CPU usage <15% after startup
- Memory usage <100MB initially

### Test 2: Configuration Loading
**Expected**:
- Config file loaded successfully
- All addons registered
- Safety monitor started
- Logging initialized

### Test 3: Dashboard Access
```bash
# Open in browser
http://localhost:5000
```
**Expected**:
- Dashboard loads without errors
- Admin token prompt appears
- No console errors

---

## 2. Safety System Tests

### Test 1: CPU Monitoring
**Steps**:
1. Start bot
2. Check logs for CPU readings
3. Verify readings are reasonable (not stuck at high values)

**Expected**:
```
[INFO] Safety monitor started
[INFO] CPU usage: 5-15% (should vary, not constant 30%+)
```

### Test 2: Memory Monitoring  
**Steps**:
1. Run bot for 30 minutes
2. Monitor memory usage via logs or PM2

**Expected**:
- Memory stable or slowly increasing
- No sudden spikes >100MB
- Memory under configured limit

### Test 3: Throttling Activation
**Steps**:
1. Set very low CPU limit: `"maxCpuPercent": 10`
2. Start bot
3. Watch for throttle warnings

**Expected**:
```
[WARN] CPU usage high: 12%
[WARN] THROTTLING ACTIVATED
[INFO] Task manager paused
```

---

## 3. Reconnection Tests

### Test 1: Server Offline Handling
**Steps**:
1. Configure bot with unreachable server
2. Start bot
3. Watch reconnection attempts

**Expected**:
- First attempt after 5s
- Delays increase exponentially
- After 5 failures, delay increases significantly
- Max delay caps at 60s (not 300s)

### Test 2: Network Recovery
**Steps**:
1. Start bot with working server
2. Disconnect network
3. Reconnect network after 30s

**Expected**:
- Bot detects disconnect
- Begins reconnection attempts
- Successfully reconnects when network returns
- Reconnect counter resets on success

---

## 4. Performance Tests

### Test 1: Low-End Config
**Steps**:
1. Copy low-end preset from CONFIG-PRESETS.json
2. Run for 1 hour
3. Monitor metrics

**Expected**:
- CPU: 5-15%
- Memory: 80-150MB
- No thermal warnings
- Stable operation

### Test 2: Medium Config
**Steps**:
1. Copy medium preset from CONFIG-PRESETS.json
2. Run for 1 hour
3. Monitor metrics

**Expected**:
- CPU: 10-25%
- Memory: 150-300MB
- No throttling (unless device limited)
- Stable operation

### Test 3: Memory Leak Check
**Steps**:
1. Run bot for 6+ hours
2. Monitor memory usage every hour

**Expected**:
- Memory stabilizes after initial load
- No continuous growth
- Garbage collection keeps memory stable

---

## 5. File I/O Tests

### Test 1: Log Rotation
**Steps**:
1. Set `"maxLogSizeMB": 1`
2. Run bot for several hours
3. Check `data/logs/` directory

**Expected**:
- Old logs get renamed with timestamp
- New log file created
- Only configured number of logs kept
- No disk space issues

### Test 2: State Persistence
**Steps**:
1. Run bot for 30 minutes
2. Stop bot (Ctrl+C)
3. Restart bot
4. Check logs for "Loaded saved state"

**Expected**:
```
[INFO] [StateManager] Loaded saved state
[INFO] Last known position: (X, Y, Z)
[INFO] Explored N chunks
```

### Test 3: Dirty Flag Optimization
**Steps**:
1. Enable debug logging: `"level": "debug"`
2. Run bot in AFK mode (minimal activity)
3. Watch for save messages

**Expected**:
- State only saved when position/data changes
- Not saved every 120s if nothing changed
- "State saved" appears only when needed

---

## 6. Addon Tests

### Test 1: AFK Mode
**Steps**:
1. Set `"current": "afk"`
2. Start bot
3. Watch for 5 minutes

**Expected**:
- Periodic movement every 15-30s
- Auto-eat when hungry
- Mob avoidance if nearby
- Auto-respawn on death
- Status updates logged

### Test 2: Player Mode
**Steps**:
1. Set `"current": "player"`
2. Start bot with working server
3. Watch for 10 minutes

**Expected**:
- State transitions (rest → work → explore)
- Natural activities (mining, gathering)
- Chat responses if mentioned
- Progression tracking

---

## 7. Termux-Specific Tests

### Test 1: Thermal Monitoring
**Steps (On Android/Termux)**:
```bash
# Check thermal zone exists
cat /sys/class/thermal/thermal_zone0/temp

# Start bot
npm run dashboard
```

**Expected**:
- Temperature reading in logs (if available)
- Throttling if temp >60°C
- No errors if thermal zone unavailable

### Test 2: Battery Monitoring
**Steps (On Termux)**:
```bash
# Install termux-api if not installed
pkg install termux-api

# Check battery status works
termux-battery-status

# Start bot
npm run dashboard
```

**Expected**:
- Battery status in logs (if termux-api installed)
- Throttling if battery <20% and discharging
- No errors if termux-api unavailable

### Test 3: Wake Lock
**Steps (On Termux)**:
```bash
# Enable wake lock
termux-wake-lock

# Start bot
npm run dashboard

# Run for 30 minutes with screen off
```

**Expected**:
- Bot continues running with screen off
- No Android battery optimization killing process
- Stable operation

---

## 8. Dashboard Tests

### Test 1: Real-Time Updates
**Steps**:
1. Open dashboard in browser
2. Enter admin token
3. Watch metrics update

**Expected**:
- Health/food updates every 5s
- Position updates
- Status reflects bot state
- No websocket disconnections

### Test 2: Mode Switching
**Steps**:
1. Open dashboard
2. Switch from AFK to Player mode
3. Watch bot behavior change

**Expected**:
- Mode change logged
- Bot switches addon behavior
- Dashboard reflects new mode
- No errors or crashes

---

## 9. Stress Tests

### Test 1: Long-Running Stability (6 hours)
**Steps**:
1. Start bot with medium config
2. Let run for 6 hours
3. Monitor every hour

**Expected**:
- No memory leaks
- No CPU spikes
- Stable reconnections
- Logs rotate properly
- No crashes

### Test 2: Network Interruption
**Steps**:
1. Start bot
2. Toggle WiFi on/off 5 times
3. Watch reconnection handling

**Expected**:
- Graceful disconnect detection
- Smart reconnection delays
- Eventually reconnects
- No crashes or hangs

### Test 3: Server Restart
**Steps**:
1. Connect bot to server
2. Restart Minecraft server
3. Watch bot behavior

**Expected**:
- Detects disconnect
- Begins reconnection
- Successfully rejoins when server up
- Continues normal operation

---

## 10. Cleanup Tests

### Test 1: Graceful Shutdown
**Steps**:
1. Start bot
2. Press Ctrl+C
3. Watch shutdown sequence

**Expected**:
```
[INFO] Shutdown signal received
[INFO] Stopping bot...
[INFO] Addon cleanup...
[INFO] Safety monitor stopped
[INFO] [StateManager] Cleaned up and saved final state
[INFO] [ActivityTracker] Cleaned up and saved
[INFO] Bot stopped
```

### Test 2: Interval Cleanup
**Steps**:
1. Start bot
2. Run for 1 minute
3. Stop bot (Ctrl+C)
4. Check no timers/intervals remain

**Expected**:
- All intervals cleared
- Process exits cleanly
- No hanging Node.js process
- Exit code 0

---

## 📊 Performance Benchmarks

### Low-End Device (Expected)
- **Startup Time**: <5 seconds
- **CPU Usage**: 5-15%
- **Memory Usage**: 80-150MB
- **Network Usage**: <1MB/hour
- **Disk I/O**: <5MB/hour
- **Temperature**: +2-5°C

### Medium Device (Expected)
- **Startup Time**: <3 seconds
- **CPU Usage**: 10-25%
- **Memory Usage**: 150-300MB
- **Network Usage**: <2MB/hour
- **Disk I/O**: <10MB/hour
- **Temperature**: +5-8°C

---

## 🐛 Common Issues & Fixes

### Issue: High CPU Usage
**Fix**: 
1. Check if CPU calculation showing correct values
2. Lower maxCpuPercent in config
3. Use low-end preset

### Issue: Memory Growth
**Fix**:
1. Check for proper interval cleanup
2. Reduce log buffer size
3. Disable file logging if needed

### Issue: Frequent Disconnects
**Fix**:
1. Check network stability
2. Increase reconnect delays
3. Check server performance

### Issue: Bot Not Moving (AFK)
**Fix**:
1. Check if throttled (CPU/memory limits)
2. Verify movement interval not too high
3. Check bot has permission to move

---

## ✅ Final Validation Checklist

Before 24/7 deployment:

- [ ] All basic functionality tests passed
- [ ] Safety systems working correctly
- [ ] Reconnection logic tested
- [ ] Performance meets expectations
- [ ] File I/O optimized and working
- [ ] Addons functioning properly
- [ ] Termux-specific features tested (if applicable)
- [ ] Dashboard working correctly
- [ ] Passed 6-hour stress test
- [ ] Graceful shutdown works
- [ ] No memory leaks detected
- [ ] Temperature stays safe
- [ ] Battery usage acceptable

---

## 🎯 Quick Test Command

Run all automated tests:
```bash
npm test
```

This runs the smoke test suite which validates:
- Configuration loading
- Addon registration
- Safety monitoring
- Basic functionality

---

**Your bot is ready for 24/7 operation when all tests pass!** ✅
