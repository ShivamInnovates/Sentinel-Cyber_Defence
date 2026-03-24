# config.py — single source of truth for all constants

REAL_DOMAINS = [
    'mcdonline', 'mcdpropertytax', 'mcdwatertax', 'mcdbirthdeath',
    'mcdtradelicence', 'mcdparkingfee', 'mcdbuilding', 'mcdfactorylicence',
    'mcdmarriageregistration', 'mcdfoodlicence', 'mcdpetlicence', 'mcdhealthlicence',
    'mcdadvertisementlicence', 'mcddemolition', 'mcdnewwater', 'mcdsewerage',
    'mcdsolidwaste', 'mcdstreetvending', 'mcdhorticulture'
]

MCD_KEYWORDS = [
    'mcd', 'delhi', 'nagar', 'nigam', 'municipal', 'corporation', 'property',
    'water', 'tax', 'birth', 'trade', 'licence', 'payment', 'pay', 'portal',
    'propertytax', 'watertax', 'mcdonline'
]

PORTALS = ['property_tax', 'water_tax', 'birth_death', 'trade_licence']

REAL_PORTAL_URLS = {
    "property_tax":  "https://mcdonline.nic.in/propertytax",
    "water_tax":     "https://mcdonline.nic.in/watertax",
    "birth_death":   "https://mcdonline.nic.in/birthdeath",
    "trade_licence": "https://mcdonline.nic.in/tradelicence"
}

# Model 1
LEVENSHTEIN_THRESHOLD = 65
KEYWORD_MIN_COUNT = 2

# Model 2
COMPOSITE_CONFIRMED = 75
COMPOSITE_PROBABLE  = 50

# Model 4
ZSCORE_RED    = 3.0
ZSCORE_YELLOW = 2.5
ADMIN_OFFHOURS_START = 22   # 10 PM
ADMIN_OFFHOURS_END   = 6    # 6 AM

# Model 5
BRIDGE_AUTO_HOURS  = 4
BRIDGE_REVIEW_DAYS = 7

# Baseline
BASE_LOGIN_PER_HOUR = 48

# Paths
REFERENCE_SCREENSHOTS_DIR = "reference_screenshots"
SCREENSHOTS_DIR           = "screenshots"
DATA_DIR                  = "data"
CORPUS_FILE               = "data/phishing_corpus.json"
FAKE_SITES_FILE           = "data/fake_sites.json"
KAVACH_ALERTS_FILE        = "data/kavach_alerts.json"
CANARY_FILE               = "data/canaries.json"