# Quick Start Guide - Chat System

## TL;DR - Start the Backend in 30 Seconds

### Recommended: Docker (Easiest & Most Reliable)
The Docker path avoids all dependency issues, especially on Windows.

1. Install **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux).
2. Run the universal startup script:
   - **Windows**: Double-click `start.bat`
   - **Linux/WSL/macOS**: Run `./start.sh`
3. Choose **Option 1 (Docker)** from the menu.

---

### Alternative: Native (For Developers)
If you must run natively without Docker:

#### Linux/macOS
```bash
cd Sentinel-Cyber_Defence/backend
source ../../delhihack/bin/activate
python -m uvicorn chatbot_app:app --reload --port 8000
```

#### Windows
```cmd
cd Sentinel-Cyber_Defence\backend
..\..\delhihack\Scripts\activate.bat
python -m uvicorn chatbot_app:app --reload --port 8000
```
> [!WARNING]
> Native installation on Windows often fails due to complex dependencies (Torch, Faiss, Playwright). Use Docker if you encounter "dependency issues".

---

## Verify It's Working

```bash
# In another terminal:
curl http://127.0.0.1:8000/api/health

# Should return:
# {
#   "status": "ok",
#   "llm": "available",
#   "vectorstore": "loaded"
# }
```

---

## Using the Startup Scripts (Easiest)

### Linux/macOS
## What Happens When You Start the Server

### Expected Output
```
✓ Virtual environment activated
✓ Python version: 3.x.x
✓ Checking dependencies...
✓ Starting FastAPI Server

🚀 Server will run on: http://0.0.0.0:8000
📝 API Documentation: http://127.0.0.1:8000/docs

[First run only] Downloading GPT-2 model... (takes 2-5 minutes)
[Every run] Building/loading vectorstore...

INFO:     Uvicorn running on http://0.0.0.0:8000
```

### First Message (May Take 30+ Seconds)
This is normal! The system is downloading the AI model.

### Subsequent Messages (Fast)
Should arrive in under 2 seconds.

---

## Troubleshooting in 30 Seconds

### Chat shows "Error communicating..."?
1. **Check if backend is running**
   ```bash
   curl http://127.0.0.1:8000/api/health
   ```
2. **If not running**, start it (see "Start the Backend" above)
3. **If running**, check browser console (F12) for details

### Backend won't start?
1. **Check Python is installed**
   ```bash
   python --version
   ```
2. **Check virtual environment**
   ```bash
   source ../../delhihack/bin/activate  # macOS/Linux
   ```
3. **Install requirements**
   ```bash
   pip install -r requirements.txt
   ```

### Port 8000 already in use?
```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

---

## Available API Endpoints

### 1. Chat Endpoint
```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sentinel-demo-key" \
  -d '{"query": "What is SENTINEL?"}'
```

### 2. Health Check
```bash
curl http://127.0.0.1:8000/api/health
```

### 3. Clear History
```bash
curl -X POST http://127.0.0.1:8000/api/clear-history \
  -H "X-API-KEY: sentinel-demo-key"
```

### 4. API Documentation
```
http://127.0.0.1:8000/docs       # Interactive Swagger UI
http://127.0.0.1:8000/redoc      # ReDoc documentation
```

---

## Common Questions

### Q: Why is the first message slow?
**A**: The system downloads the AI model (~1.5GB) on first use. This takes 2-5 minutes and only happens once.

### Q: Can I use a different port?
**A**: Yes, change `--port 8000` to any available port. Then update the frontend to use that port.

### Q: Do I need a PDF?
**A**: No! The system has a fallback that works without it. To enable full AI features, add `sentinel.pdf` to the backend directory.

### Q: What if something crashes?
**A**: The system is designed to not crash. If the AI fails, keyword-based responses still work. Check the logs for details.

### Q: How do I stop the server?
**A**: Press `Ctrl+C` in the terminal where it's running.

---

## Performance Tips

- 🔄 **First run**: 5-10 minutes (model download + setup)
- ⚡ **Subsequent runs**: 30 seconds (model loading)
- 💬 **First message**: 30+ seconds (model initialization)
- 📨 **Subsequent messages**: <2 seconds (model cached)

---

## Advanced Options

### Use a Lighter Model (For Limited Hardware)
Edit `chatbot_app.py`:
```python
model_name = "distilgpt2"  # Smaller, faster
```

### Increase Request Timeout (For Slow Systems)
Edit `ChatBot.jsx`:
```javascript
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
```

### Enable Debug Logging
```bash
python -m uvicorn chatbot_app:app --reload --port 8000 --log-level debug
```

### Use a Different Backend
Change port and update frontend URL:
```bash
python -m uvicorn chatbot_app:app --reload --port 9000
```
Then in `ChatBot.jsx`:
```javascript
const response = await fetch('http://127.0.0.1:9000/api/chat', ...)
```

---

## Files You Might Need

```
Sentinel-Cyber_Defence/
├── backend/
│   ├── chatbot_app.py          ← Main backend (modified ✅)
│   ├── pdf_loader.py           ← PDF handling (modified ✅)
│   ├── start_server.sh         ← Start script for macOS/Linux
│   ├── start_server.bat        ← Start script for Windows
│   ├── requirements.txt        ← Python dependencies
│   └── sentinel.pdf            ← [Optional] Your documentation
│
└── frontend/
    └── src/components/
        └── ChatBot.jsx         ← Chat UI (modified ✅)
```

---

## Documentation

- 📖 **FIX_SUMMARY.md** - What was fixed and why
- 🔍 **TROUBLESHOOTING.md** - Detailed troubleshooting guide
- 📝 **CHAT_SYSTEM_FIX.md** - Technical details of all changes

---

**Status**: ✅ **WORKING** - Chat system is fixed and ready to use!
