# baselines.py — generate Z-score baselines + seed phishing corpus
# Enterprise-grade with configurable Redis connection

import numpy as np
import json
import os
import redis
from config import PORTALS, BASE_LOGIN_PER_HOUR, CORPUS_FILE, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB

# Initialize Redis with environment-based configuration
redis_kwargs = {
    "host": REDIS_HOST,
    "port": REDIS_PORT,
    "db": REDIS_DB,
    "decode_responses": True
}
if REDIS_PASSWORD:
    redis_kwargs["password"] = REDIS_PASSWORD

r = redis.Redis(**redis_kwargs)

HOUR_MULTIPLIERS = {
    0: 0.02, 1: 0.01, 2: 0.01, 3: 0.01, 4: 0.02, 5: 0.05,
    6: 0.15, 7: 0.40, 8: 0.75, 9: 1.00, 10: 1.20, 11: 1.10,
    12: 0.85, 13: 0.80, 14: 1.00, 15: 0.90, 16: 0.70, 17: 0.50,
    18: 0.30, 19: 0.20, 20: 0.12, 21: 0.08, 22: 0.05, 23: 0.03,
}

DAY_MULTIPLIERS = {
    0: 1.2, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.1, 5: 0.5, 6: 0.3
}

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def generate_baselines():
    print("Generating baselines for all portals × 7 days × 24 hours …")
    count = 0
    for portal in PORTALS:
        for day in range(7):
            for hour in range(24):
                expected     = BASE_LOGIN_PER_HOUR * HOUR_MULTIPLIERS[hour] * DAY_MULTIPLIERS[day]
                noise_stddev = max(expected * 0.15, 0.5)
                samples      = np.random.normal(loc=expected, scale=noise_stddev, size=30)
                samples      = np.clip(samples, 0, None)
                mean         = float(np.mean(samples))
                stddev       = float(max(np.std(samples), 1.0))

                # FIX: key format is "baseline:portal:day:hour" — no dots, no spaces
                key = f"baseline:{portal}:{day}:{hour}"
                r.hset(key, mapping={
                    "mean":      str(round(mean, 2)),
                    "std":       str(round(stddev, 2)),
                    "days_real": "0"
                })
                count += 1
        print(f"  ✓ {portal}: 168 baselines stored")

    print(f"\nTotal baselines stored in Redis: {count}")

    # Spot-check
    print("\nSpot-check (Mon 10am vs Sat 3am):")
    for portal in PORTALS[:1]:
        b_peak  = r.hgetall(f"baseline:{portal}:0:10")   # FIX: was 0.10 (dot)
        b_quiet = r.hgetall(f"baseline:{portal}:5:3")
        if b_peak and b_quiet:
            peak_mean  = float(b_peak["mean"])
            quiet_mean = float(b_quiet["mean"])
            print(f"  {portal} Mon 10am: mean={peak_mean:.1f}, std={float(b_peak['std']):.1f}")
            print(f"  {portal} Sat 3am:  mean={quiet_mean:.2f}, std={float(b_quiet['std']):.2f}")
            ratio = peak_mean / max(quiet_mean, 0.1)
            print(f"  → Monday 10am is ~{ratio:.0f}x busier than Sat 3am ✓")


def seed_phishing_reports():
    os.makedirs("data", exist_ok=True)
    seed_data = [
        {"id": 1, "text": "Got WhatsApp saying pay property tax at mcdpropertytax-pay.in urgent deadline tomorrow", "campaign_id": 1},
        {"id": 2, "text": "SMS received property tax payment link mcd-propertytax-pay.in pay before penalty", "campaign_id": 1},
        {"id": 3, "text": "Friend shared mcd-propertytax-pay.in said MCD property tax overdue pay now", "campaign_id": 1},
        {"id": 4, "text": "Telegram message property tax due mcd-propertytax-pay.in pay immediately", "campaign_id": 1},
        {"id": 5, "text": "Received WhatsApp property tax overdue visit mcd-propertytax-pay.in pay or face action", "campaign_id": 1},
        {"id": 6, "text": "WhatsApp link mcd-water-payment.com water tax pending pay now Delhi municipal", "campaign_id": 2},
        {"id": 7, "text": "SMS water tax overdue mcd-water-payment.com Delhi pay before disconnection notice", "campaign_id": 2},
        {"id": 8, "text": "Message water bill payment mcd-water-payment.com urgent notice received today", "campaign_id": 2},
        {"id": 9, "text": "Water tax demand notice link mcd-water-payment.com received on Telegram", "campaign_id": 2},
        {"id": 10, "text": "Delhi water tax mcd-water-payment.com pay before penalty WhatsApp message", "campaign_id": 2},
    ]
    json.dump(seed_data, open(CORPUS_FILE, "w"), indent=2)
    print(f"\n✓ Seeded {len(seed_data)} phishing reports into {CORPUS_FILE}")
    print(f"  Campaign 1 (property tax): {sum(1 for r in seed_data if r['campaign_id']==1)} reports")
    print(f"  Campaign 2 (water tax):    {sum(1 for r in seed_data if r['campaign_id']==2)} reports")


if __name__ == "__main__":
    print("=" * 60)
    print("Generating baselines and seeding phishing data")
    print("=" * 60)
    generate_baselines()
    seed_phishing_reports()
    print("\n" + "=" * 60)
    print("Done. Run next: python step4_models.py")
    print("=" * 60)