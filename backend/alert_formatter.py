def format_alert(alert: dict) -> str:
    correlated = alert.get("correlated_site") or "No correlation detected"
    return (
        f"Alert ID {alert['id']} detected at {alert['detected_at']}\n"
        f"Portal Type:  {alert['portal_type']}\n"
        f"Attack Type:  {alert['attack_type']}\n"
        f"Correlation:  {correlated}\n"
    )

def format_cross_reality(cross_alert: dict) -> str:
    return (
        f"Cross-Reality Alert!\n"
        f"Portal:       {cross_alert['portal_type']}\n"
        f"Time:         {cross_alert['detected_at']}\n"
        f"Fake site:    {cross_alert['fake_site']}\n"
    )
