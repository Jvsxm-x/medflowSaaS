#!/usr/bin/env python3
"""
Script d'audit de sécurité avec OWASP ZAP
Teste les vulnérabilités de sécurité de l'application MedflowSaaS
"""
import time
import json
import os
from zapv2 import ZAPv2

# Configuration
API_KEY = os.getenv('ZAP_API_KEY', '')
TARGET_URL = os.getenv('TARGET_URL', 'http://localhost:5173')
ZAP_PROXY = os.getenv('ZAP_PROXY', 'http://localhost:8080')
REPORT_DIR = '../../reports/security/owasp-zap'

# Créer le répertoire de rapports
os.makedirs(REPORT_DIR, exist_ok=True)


def run_zap_scan():
    """Exécute un scan de sécurité avec OWASP ZAP"""
    print(f"🔒 Démarrage du scan de sécurité pour {TARGET_URL}")
    
    # Initialiser ZAP
    zap = ZAPv2(apikey=API_KEY, proxies={'http': ZAP_PROXY, 'https': ZAP_PROXY})
    
    # Vérifier que ZAP est accessible
    try:
        version = zap.core.version
        print(f"✓ ZAP version: {version}")
    except Exception as e:
        print(f"❌ Erreur de connexion à ZAP: {e}")
        print("Assurez-vous que ZAP est démarré et accessible sur http://localhost:8080")
        return
    
    # Spider - Exploration de l'application
    print("\n🕷️  Démarrage du spider...")
    scan_id = zap.spider.scan(TARGET_URL)
    
    # Attendre la fin du spider
    while int(zap.spider.status(scan_id)) < 100:
        progress = zap.spider.status(scan_id)
        print(f"  Progression du spider: {progress}%")
        time.sleep(2)
    
    print("✓ Spider terminé")
    
    # Attendre que le spider ait fini
    time.sleep(5)
    
    # Active Scan - Test des vulnérabilités
    print("\n🔍 Démarrage du scan actif...")
    scan_id = zap.ascan.scan(TARGET_URL)
    
    # Attendre la fin du scan actif
    while int(zap.ascan.status(scan_id)) < 100:
        progress = zap.ascan.status(scan_id)
        print(f"  Progression du scan actif: {progress}%")
        time.sleep(5)
    
    print("✓ Scan actif terminé")
    
    # Générer les rapports
    print("\n📊 Génération des rapports...")
    
    # Rapport HTML
    html_report = zap.core.htmlreport()
    report_path = os.path.join(REPORT_DIR, 'zap-report.html')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_report)
    print(f"✓ Rapport HTML: {report_path}")
    
    # Rapport JSON
    json_report = zap.core.jsonreport()
    report_path = os.path.join(REPORT_DIR, 'zap-report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(json.loads(json_report), f, indent=2)
    print(f"✓ Rapport JSON: {report_path}")
    
    # Rapport XML
    xml_report = zap.core.xmlreport()
    report_path = os.path.join(REPORT_DIR, 'zap-report.xml')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(xml_report)
    print(f"✓ Rapport XML: {report_path}")
    
    # Statistiques
    print("\n📈 Statistiques du scan:")
    alerts = zap.core.alerts()
    
    alerts_by_severity = {
        'High': 0,
        'Medium': 0,
        'Low': 0,
        'Informational': 0
    }
    
    for alert in alerts:
        severity = alert.get('risk', 'Informational')
        if severity == 'High':
            alerts_by_severity['High'] += 1
        elif severity == 'Medium':
            alerts_by_severity['Medium'] += 1
        elif severity == 'Low':
            alerts_by_severity['Low'] += 1
        else:
            alerts_by_severity['Informational'] += 1
    
    print(f"  🔴 High: {alerts_by_severity['High']}")
    print(f"  🟡 Medium: {alerts_by_severity['Medium']}")
    print(f"  🟢 Low: {alerts_by_severity['Low']}")
    print(f"  ℹ️  Informational: {alerts_by_severity['Informational']}")
    
    # Afficher les alertes High et Medium
    high_medium_alerts = [a for a in alerts if a.get('risk') in ['High', 'Medium']]
    if high_medium_alerts:
        print("\n⚠️  Alertes critiques:")
        for alert in high_medium_alerts[:10]:  # Limiter à 10
            print(f"  - [{alert.get('risk')}] {alert.get('name')}: {alert.get('url')}")
    
    print("\n✅ Scan terminé!")


if __name__ == '__main__':
    run_zap_scan()

