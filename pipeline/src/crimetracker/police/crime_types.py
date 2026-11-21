"""ANZSOC division to short crime type labels."""

# Shown in the site — Harm is excluded (rare, misleading label for abduction only).
MAIN_CRIME_TYPES = ["Theft", "Burglary", "Assault", "Robbery", "Sexual"]
EXCLUDED_CRIME_TYPES = ["Harm"]

CRIME_TYPE_MAP = {
    "Theft": "Theft",
    "08 Theft and related offences": "Theft",
    "Theft and related offences": "Theft",
    "Burglary": "Burglary",
    "07 Unlawful entry with intent/burglary, break and enter": "Burglary",
    "Unlawful entry with intent/burglary, break and enter": "Burglary",
    "Assault": "Assault",
    "02 Assaults": "Assault",
    "Assaults": "Assault",
    "Robbery": "Robbery",
    "Robbery, blackmail, and extortion": "Robbery",
    "06 Robbery, extortion and related offences": "Robbery",
    "Robbery, extortion and related offences": "Robbery",
    "Sexual": "Sexual",
    "Sexual Offences": "Sexual",
    "03 Sexual assault and related offences": "Sexual",
    "Sexual assault and related offences": "Sexual",
    "Harm": "Harm",
    "Harm or endanger persons": "Harm",
    "01 Homicide and related offences": "Harm",
    "Homicide and related offences": "Harm",
}


def map_crime_type(division: str) -> str:
    if not isinstance(division, str):
        return "Other"
    division = division.strip()
    if division in CRIME_TYPE_MAP:
        return CRIME_TYPE_MAP[division]
    for key, label in CRIME_TYPE_MAP.items():
        if key in division or division in key:
            return label
    return division or "Other"
