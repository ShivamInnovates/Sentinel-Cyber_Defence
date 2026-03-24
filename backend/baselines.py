# ============================================================
# step3_baselines.py
# ============================================================
# This script does two things:
#   1. Generates statistical baselines for Model 4 (Z-score)
#   2. Seeds phishing report data for Model 3 (TF-IDF)
#
# WHY we generate synthetic baselines instead of waiting for real data:
#   Model 4 needs to know what "normal" traffic looks like before it
#   can detect "abnormal" traffic. In real deployment, it would take
#   30 days of real login data to build reliable baselines.
#   For the demo and for day-one deployment, we simulate 30 days of
#   realistic traffic patterns mathematically.
#
#   The synthetic data uses real-world patterns:
#   - Government offices are busiest Monday–Friday, 9am–5pm
#   - Traffic drops to near-zero on weekend nights
#   - Monday is busiest (citizens rushing after weekend)
#   - Saturday and Sunday are 30–50% of weekday traffic
#
# How to run:
#   python step3_baselines.py
# ============================================================


import numpy as np
import json
import os
import redis
from config import PORTALS, BASE_LOGIN_PER_HOUR, CORPUS_FILE

r = redis.Redis(host="localhost", port=6379, decode_response=True)

# ── Traffic multipliers by hour ─────────────────────────────── 
# # These represent how busy each hour is relative to peak (Mon 10am = 1.0). 
# # Based on typical government office portal usage patterns. 
# # You can adjust these if MCD provides actual traffic data.
# 0   → no traffic
#0.01–0.1 → very low
#0.5 → moderate
#1.0 → normal
#1.2 → peak

HOUR_MULTIPLIERS = {
    0 : 0.02, #midnight
    1 : 0.01,
    2 : 0.01,
    3 : 0.01,
    4 : 0.02,
    5 : 0.05,
    6 : 0.15, #early morning
    7 : 0.40,
    8 : 0.75,
    9 : 1.00,
    10 : 1.20,
    11 : 1.10,
    12 : 0.85,
    13 : 0.80,
    14 : 1.00,
    15 : 0.90,
    16 : 0.70,
    17 : 0.50, #closing time
    18 : 0.30,
    19 : 0.20,
    20 : 0.12,
    21: 0.08, 
    22: 0.05, 
    23: 0.03, # late night — very low
}

DAY_MULTIPLIERS = { 
    0: 1.2, # Monday — highest (post-weekend backlog)                
    1: 1.0, # Tuesday 
    2: 1.0, # Wednesday 
    3: 1.0, # Thursday 
    4: 1.1, # Friday — slightly higher (pre-weekend) 
    5: 0.5, # Saturday — half of weekday 
    6: 0.3, # Sunday — quietest 
    }

def generate_baselines():
    """For each portal, for each of 7 days, for each of 24 hours:
    1. Calc the expected login avg cnt
    2. Simulate 30 days of reading with random noise
    3. Compute mean n std dev from these 30 sample
    4. store in redis
    168 baselines per portal = 7 days × 24 hours 
    If you have 4 portals: 672 baselines total — all stored in Redis. 
    Redis key format: "baseline:property_tax:0:10" 
    Meaning: baseline for property_tax portal, Monday (0), 10am (10) 
    Value: hash with "mean" and "std" fields

    Traffic = Base × (hour effect) × (day effect)
    Why multiply (not add)?
    Because these are scaling effects, not independent additions.

    Example:
    Night time reduces traffic
    Weekend also reduces traffic

    👉 Both should combine proportionally
    """
    print("Generating baselines...")
    count =0
    for portal in PORTALS:
        for day in range(7):
            day_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][day]
            for hour in range(24):
                # Example: Mon 10am = 48 × 1.20 × 1.2 = 69 logins/hour 
                # Example: Sat 3am = 48 × 0.01 × 0.5 = 0.24 logins/hour
                expected = BASE_LOGIN_PER_HOUR * HOUR_MULTIPLIERS[hour] * DAY_MULTIPLIERS[day]
                noise_stddev = max(expected*0.15, 0.5)
                samples = np.random.normal(loc=expected, scale = noise_stddev, size=30)
                samples = np.clip(samples, 0, None)
                mean = float(np.mean(samples))
                stddev = float(max(np.std(samples), 1.0))

                key = f"baseline:{portal}:{day}:{hour}"
                r.hset(key, mapping = {
                    "mean" : str(round(mean, 2)),
                    "std" : str(round(stddev, 2)),
                    "days_real" : "0"
                })
                count+=1
            print(f" ✓ {portal}: 168 baselines stored") 
    print(f"\nTotal baselines stored in Redis: {count}")

    print("\nSpot-check (Mon 10am and Sat 3am should be different)")
    for portal in PORTALS[:1]:
        b_peak = r.hgetall(f"baseline:{portal}:0.10")
        b_quiet = r.hgetall(f"baseline:{portal}:5:3")
        print(f" {portal} Mon 10am: mean={float(b_peak['mean']):.1f}, std={float(b_peak['std']):.1f}") 
        print(f" {portal} Sat 3am: mean={float(b_quiet['mean']):.2f}, std={float(b_quiet['std']):.2f}")
        print(f" → Monday 10am is ~{float(b_peak['mean'])/max(float(b_quiet['mean']),0.1):.0f}x busier than Sat 3am")


def seed_phishing_reports():
    """
    Seeds 10 synthetic phishing reports for Model 3 to learn from.
    WHY we need seed data: 
    TF-IDF needs at least 5 documents to fit its vocabulary. 
    Without seed data, the first few reports cannot be clustered. 
    These synthetic reports represent two known campaigns so the model can group new similar reports correctly from day one. 
    In real deployment, the corpus grows continuously as citizens submit reports. The model is refit daily at 3am. 
    """
    os.makedirs("data", exist_ok=True)
    seed_data = [
        #Campaign 1: property tax fake at mcdpropertytax-pay.in:
        {
            "id":1,
            "text" : "Got Whatsapp saying pay property tax at mcdpropertytax-pay.in urgent deadline tomorrow",
            "campaign_id" : 1
        },
        { 
            "id": 2, 
            "text": "SMS received property tax payment link mcd-propertytax-pay.in pay before penalty", 
            "campaign_id": 1
        },
        { 
            "id": 3, 
            "text": "Friend shared mcd-propertytax-pay.in said MCD property tax overdue pay now",
              "campaign_id": 1
        }, 
        { 
            "id": 4, 
            "text": "Telegram message property tax due mcd-propertytax-pay.in pay immediately", 
            "campaign_id": 1
        },
        { 
            "id": 5, 
            "text": "Received WhatsApp property tax overdue visit mcd-propertytax-pay.in pay or face action", 
            "campaign_id": 1 
        },
        #Campaign 2: water tax fake at mcd-water-payment.com 
        { 
            "id": 6, 
            "text": "WhatsApp link mcd-water-payment.com water tax pending pay now Delhi municipal", 
            "campaign_id": 2
        }, 
        { 
            "id": 7, 
            "text": "SMS water tax overdue mcd-water-payment.com Delhi pay before disconnection notice", 
            "campaign_id": 2
        }, 
        { 
            "id": 8, 
            "text": "Message water bill payment mcd-water-payment.com urgent notice received today", 
            "campaign_id": 2
        }, 
        { 
            "id": 9, 
            "text": "Water tax demand notice link mcd-water-payment.com received on Telegram", 
            "campaign_id": 2
        }, 
        { 
            "id": 10, 
            "text": "Delhi water tax mcd-water-payment.com pay before penalty WhatsApp message", 
            "campaign_id": 2
        }
    ]
    json.dump(seed_data, open(CORPUS_FILE, "w"), indent=2)
    print(f"\n✓ Seeded {len(seed_data)} phishing reports into {CORPUS_FILE}") 
    print(f" Campaign 1 (property tax): {sum(1 for r in seed_data if r['campaign_id']==1)} reports") 
    print(f" Campaign 2 (water tax): {sum(1 for r in seed_data if r['campaign_id']==2)} reports")

if __name__ == "__main__": 
    print("=" * 60) 
    print("Generating baselines and seeding data") 
    print("=" * 60) 
    generate_baselines() 
    seed_phishing_reports() 
    print("\n" + "=" * 60) 
    print("Baselines and seed data ready.") 
    print("Run next: python step4_models.py") 
    print("=" * 60)