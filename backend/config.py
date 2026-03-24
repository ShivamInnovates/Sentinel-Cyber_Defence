# config.py — enterprise configuration with environment variables

import os
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════════════════
# DOMAIN & PORTAL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════════════════════════════════
# MODEL THRESHOLDS (Drishti - Phishing Detection)
# ═══════════════════════════════════════════════════════════════════════════════════════

LEVENSHTEIN_THRESHOLD = int(os.environ.get('LEVENSHTEIN_THRESHOLD', '65'))
KEYWORD_MIN_COUNT = int(os.environ.get('KEYWORD_MIN_COUNT', '2'))

# ═══════════════════════════════════════════════════════════════════════════════════════
# MODEL THRESHOLDS (Kavach - Anomaly Detection)
# ═══════════════════════════════════════════════════════════════════════════════════════

COMPOSITE_CONFIRMED = int(os.environ.get('COMPOSITE_CONFIRMED', '75'))
COMPOSITE_PROBABLE = int(os.environ.get('COMPOSITE_PROBABLE', '50'))

ZSCORE_RED = float(os.environ.get('ZSCORE_RED', '3.0'))
ZSCORE_YELLOW = float(os.environ.get('ZSCORE_YELLOW', '2.5'))

ADMIN_OFFHOURS_START = int(os.environ.get('ADMIN_OFFHOURS_START', '22'))  # 10 PM
ADMIN_OFFHOURS_END = int(os.environ.get('ADMIN_OFFHOURS_END', '6'))  # 6 AM

# ═══════════════════════════════════════════════════════════════════════════════════════
# MODEL THRESHOLDS (Bridge - Correlation Analysis)
# ═══════════════════════════════════════════════════════════════════════════════════════

BRIDGE_AUTO_HOURS = int(os.environ.get('BRIDGE_AUTO_HOURS', '4'))
BRIDGE_REVIEW_DAYS = int(os.environ.get('BRIDGE_REVIEW_DAYS', '7'))

# ═══════════════════════════════════════════════════════════════════════════════════════
# BASELINE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════════════

BASE_LOGIN_PER_HOUR = int(os.environ.get('BASE_LOGIN_PER_HOUR', '48'))

# ═══════════════════════════════════════════════════════════════════════════════════════
# FILE PATHS - Environment-aware with fallback to relative paths
# ═══════════════════════════════════════════════════════════════════════════════════════

# Get base directory for file paths
_BASE_DIR = Path(os.environ.get('DATA_DIR', 'data')).parent if os.environ.get('DATA_DIR') else Path(__file__).parent.parent

REFERENCE_SCREENSHOTS_DIR = os.environ.get('REFERENCE_SCREENSHOTS_DIR', str(_BASE_DIR / 'reference_screenshots'))
SCREENSHOTS_DIR = os.environ.get('SCREENSHOTS_DIR', str(_BASE_DIR / 'screenshots'))
DATA_DIR = os.environ.get('DATA_DIR', str(_BASE_DIR / 'data'))

CORPUS_FILE = os.path.join(DATA_DIR, 'phishing_corpus.json')
FAKE_SITES_FILE = os.path.join(DATA_DIR, 'fake_sites.json')
KAVACH_ALERTS_FILE = os.path.join(DATA_DIR, 'kavach_alerts.json')
CANARY_FILE = os.path.join(DATA_DIR, 'canaries.json')

# ═══════════════════════════════════════════════════════════════════════════════════════
# REDIS CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════════════

REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', None)
REDIS_DB = int(os.environ.get('REDIS_DB', '0'))

# ═══════════════════════════════════════════════════════════════════════════════════════
# APPLICATION CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════════════

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
