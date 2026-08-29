# ============================================================
# WasteWise Backend — Utility Functions
# ============================================================

def get_level_str(waste_percentage: float) -> str:
    if waste_percentage < 10.0:
        return "Low"
    elif waste_percentage < 20.0:
        return "Moderate"
    elif waste_percentage < 35.0:
        return "High"
    else:
        return "Critical"


def get_level(waste_percentage: float) -> str:
    return get_level_str(waste_percentage)
