# Chat System Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Error communicating with SENTINEL. Please try again."

**What this means**: The frontend can't reach the backend server.

**Diagnostic steps**:
```bash
# 1. Check if the backend is running
curl http://127.0.0.1:8000/api/health

# 2. Check if port 8000 is in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# 3. Check browser console for more details
# Open DevTools (F12) → Console tab
```

**Solutions**:
1. Start the backend server:
   ```bash
   cd Sentinel-Cyber_Defence/backend
   python -m uvicorn chatbot_app:app --reload --port 8000
   ```

2. If port 8000 is already in use:
   ```bash
   # Kill the process using port 8000
   lsof -ti:8000 | xargs kill -9  # macOS/Linux
   taskkill /PID <PID> /F  # Windows
   ```

3. Check CORS is enabled (it should be by default)

---

### Issue 2: Backend Won't Start - "ModuleNotFoundError"

**Error example**: 
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solutions**:
```bash
# 1. Make sure you're in the backend directory
cd Sentinel-Cyber_Defence/backend

# 2. Activate virtual environment
source ../../delhihack/bin/activate  # Linux/macOS
..\..\delhihack\Scripts\activate.bat  # Windows

# 3. Install all requirements
pip install -r requirements.txt

# 4. Try again
python -m uvicorn chatbot_app:app --reload --port 8000
```

---

### Issue 3: Backend Starts but Chat Returns Empty Response

**What's happening**: The LLM or vectorstore failed to load silently.

**Check the logs**:
1. Look at backend console output for warnings like:
   - `[Chatbot] Warning: Could not load LLM`
   - `[pdf_loader] Warning: PDF file not found`

**Solutions**:
1. **Missing sentinel.pdf** (optional):
   ```bash
   # The system has a fallback, but RAG features won't work
   # To enable full RAG, provide a PDF document
   cp /path/to/your/documentation.pdf backend/sentinel.pdf
   ```

2. **LLM loading issues** (usually temporary):
   - First run downloads models from HuggingFace (~1.5GB)
   - Ensure stable internet connection
   - Check available disk space
   - Consider using a lighter model if hardware is limited

3. **Memory issues**:
   ```python
   # Edit chatbot_app.py to use a smaller model
   model_name = "distilgpt2"  # Instead of "gpt2"
   ```

---

### Issue 4: Timeout Errors ("Request timed out")

**What this means**: Backend took more than 10 seconds to respond.

**Causes**:
- First request downloading LLM models (~2-5 minutes)
- System is under heavy load
- Backend is processing a slow operation

**Solutions**:
1. **Wait for initial model download**: The first request may take 5+ minutes if GPT-2 isn't cached
2. **Increase timeout in frontend** (edit `ChatBot.jsx`):
   ```javascript
   const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
   ```

3. **Check system resources**:
   ```bash
   # macOS/Linux
   top
   ps aux | grep uvicorn
   
   # Windows Task Manager
   # Press Ctrl+Shift+Esc
   ```

---

### Issue 5: "Unable to connect to SENTINEL backend"

**Error details**:
- Network error
- CORS issue
- Backend not listening on correct address

**Solutions**:

1. **Verify backend is listening**:
   ```bash
   # Should show the uvicorn process listening on port 8000
   netstat -tlnp | grep 8000  # Linux
   lsof -i :8000  # macOS
   netstat -ano | findstr :8000  # Windows
   ```

2. **Check if localhost is accessible**:
   ```bash
   curl -v http://127.0.0.1:8000/api/health
   ```

3. **Try with IP address instead of localhost**:
   ```bash
   # If running backend on same machine, try:
   # Edit ChatBot.jsx to use 127.0.0.1 instead of localhost
   # Or use the actual machine IP
   ```

4. **Check firewall**:
   - Windows: Check Windows Defender Firewall
   - macOS: Check System Preferences → Security & Privacy
   - Linux: Check `sudo iptables -L`

---

### Issue 6: Chat Response is Always the Same Generic Message

**What this means**: The keyword-based fallback is being used.

**Reasons**:
- LLM failed to load
- Vectorstore failed to load
- This is expected in demo mode

**Verify which mode you're in**:
```bash
curl http://127.0.0.1:8000/api/health
```

Look at response:
```json
{
  "llm": "available",        // If "unavailable", AI features disabled
  "vectorstore": "loaded"    // If "error", RAG disabled
}
```

**To enable AI features**:
1. Check backend logs for error messages
2. Ensure GPT-2 can be downloaded
3. Provide sufficient system resources

---

### Issue 7: Backend Process Stays Running After Closing Terminal

**Solutions**:
```bash
# Find and kill the process
ps aux | grep uvicorn
kill -9 <PID>

# Or use lsof
lsof -ti:8000 | xargs kill -9
```

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Backend starts without errors
- [ ] `curl http://127.0.0.1:8000/api/health` returns successful response
- [ ] Backend shows `Uvicorn running on http://0.0.0.0:8000`
- [ ] Frontend can send a message
- [ ] Chat receives a response (even if it's the fallback)
- [ ] Response arrives within 10 seconds on first request
- [ ] Response arrives within 2 seconds on subsequent requests

## Performance Tips

1. **First-time setup is slow** (2-5 minutes)
   - Models are downloaded from HuggingFace
   - Vectorstore is built from PDF
   - This only happens once

2. **Subsequent requests are fast** (<1 second)
   - Models and vectorstore are cached
   - No re-downloads needed

3. **Clear cache to force rebuild**:
   ```bash
   rm -rf sentinel_vectorstore  # Rebuilds on next start
   rm -rf ~/.cache/huggingface  # Force model re-download
   ```

---

## Advanced Debugging

### Enable verbose logging:
```bash
python -m uvicorn chatbot_app:app --reload --port 8000 --log-level debug
```

### Monitor network requests (browser DevTools):
1. Press F12 (or Cmd+Option+I on macOS)
2. Go to "Network" tab
3. Send a chat message
4. Click the `/api/chat` request
5. Check "Response" tab for the actual response

### Check browser console:
1. Press F12
2. Go to "Console" tab
3. Look for red error messages

### Backend debugging:
```python
# Add this to chatbot_app.py temporarily
print(f"[DEBUG] Incoming query: {req.query}")
print(f"[DEBUG] QA Chain available: {qa_chain is not None}")
print(f"[DEBUG] LLM available: {llm is not None}")
```

---

## When to Contact Support

Include these details:
1. Full error message from browser console (F12 → Console)
2. Backend startup output (first 50 lines)
3. Output of `curl http://127.0.0.1:8000/api/health`
4. Your system details (OS, Python version, available RAM)
5. Steps to reproduce the issue
