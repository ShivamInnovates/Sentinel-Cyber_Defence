from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from app.websocket_manager import manager
import asyncio
import logging

logging.basicConfig(level=logging.INFO)

def feed_update_job():
    # Example background job that broadcasts periodic events
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Send a periodic ping or small feed update
            loop.create_task(manager.broadcast("feed_update", {
                "actor": "SYSTEM",
                "sev": "INFO",
                "msg": "Routine background check completed",
                "ts": datetime.datetime.now().strftime("%H:%M:%S")
            }))
    except Exception as e:
        logging.error(f"Scheduler job failed: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(feed_update_job, 'interval', seconds=30)
    scheduler.start()
    return scheduler
