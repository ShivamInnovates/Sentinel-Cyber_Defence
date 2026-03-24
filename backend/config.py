
REAL_DOMAINS = [
    'mcdonline', 'mcdpropertytax', 'mcdwatertax', 'mcdbirthdeath', 
    'mcdtradelicence', 'mcdparkingfee', 'mcdbuilding', 'mcdfactorylicence',
    'mcdmarriageregsitration', 'mcdfoodlicence', 'mcdpetlicence', 'mcdhealthlicence',
    'mcdadvertisementlicence', 'mcddemolition', 'mcdnewwater', 'mcdsewerage',
    'mcdsolidwaste', 'mcdstreetvending', 'mcdhorticulture'
]

MCD_KEYWORDS = [
    'mcd', 'delhi', 'nagar', 'nigam', 'municipal', 'corporation', 'property',
    'water', 'tax', 'birth', 'trade', 'licence', 'payment', 'pay', 'portal',
    'propertytax', 'watertax', 'mcdonline'
]

PORTALS = [
    'property_tax',
    'water_tax',
    'birth_death',
    'trade_licence'
]


#MODEL 1 THRESHOLDS
LEVENSHTEIN_THRESHOLD = 65
KEYWORD_MIN_COUNT = 2 

#MODEL 2 THRESHOLDS
COMPOSITE_CONFIRMED = 75
COMPOSITE_PROBABLE = 50

#MODEL 4 THRESHOLDS
ZSCORE_RED = 3.0
ZSCORE_YELLOW = 2.5

#OFFHOURS LOGIN
ADMIN_OFFHOURS_START = 22 #10PM
ADMIN_OFFHOURS_END = 6 #6AM


BRIDGE_AUTO_HOURS = 4 #4 HOURS FOR AUTO ALERT 
BRIDGE_REVIEW_DAYS = 7 #7 DAYS FOR ANALYST TO REVIEW

# ── Traffic baseline settings ──────────────────────────────── 
# Monday at 10 AM = busiest, most stable, predictable time
# # At this chosen reference time (Monday 10 AM), we expect ~48 logins per hour.
# # Base number of logins per hour at peak time (Mon 10am) 
# # All other time slots are calculated as a fraction of this.
BASE_LOGIN_PER_HOUR = 48 


REFERENCE_SCREENSHOTS_DIR = "reference_screenshots"
SCREENSHOTS_DIR = "screenshots"
DATA_DIR = "data"
CORPUS_FILE = "data/phishing_corpus.json"
FAKE_SITES_FILE = "data/fake_sites.json"
KAVACH_ALERTS_FILE = "data/kavach_alerts.json"
CANARY_FILE = "data/canaries.json"

