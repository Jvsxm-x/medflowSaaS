"""
Configuration pytest pour les tests Selenium
"""
import pytest
import json
import os
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager

# Charger la configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config/test-config.json')
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    CONFIG = json.load(f)


@pytest.fixture(scope='session')
def config():
    """Retourne la configuration de test"""
    env = os.getenv('TEST_ENV', 'local')
    return CONFIG


@pytest.fixture(scope='function')
def driver(request, config):
    """Fixture pour créer et fermer le driver Selenium"""
    browser = request.config.getoption('--browser', default='chrome')
    headless = request.config.getoption('--headless', default=True)
    
    if browser == 'chrome':
        options = Options()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-gpu')
        
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        except Exception as e:
            pytest.skip(f"Impossible de démarrer Chrome: {e}")
    
    elif browser == 'firefox':
        options = FirefoxOptions()
        if headless:
            options.add_argument('--headless')
        
        try:
            service = FirefoxService(GeckoDriverManager().install())
            driver = webdriver.Firefox(service=service, options=options)
        except Exception as e:
            pytest.skip(f"Impossible de démarrer Firefox: {e}")
    
    else:
        pytest.skip(f"Navigateur non supporté: {browser}")
    
    # Configuration de base
    driver.implicitly_wait(config['timeouts']['implicit_wait'])
    try:
        driver.maximize_window()
    except:
        pass  # Ignore si maximize_window échoue
    
    yield driver
    
    # Cleanup
    try:
        driver.quit()
    except:
        pass


@pytest.fixture(scope='function')
def base_url(config):
    """Retourne l'URL de base"""
    env = os.getenv('TEST_ENV', 'local')
    return config['environments'][env]['frontend_url']


@pytest.fixture(scope='function')
def api_base(config):
    """Retourne l'URL de base de l'API"""
    env = os.getenv('TEST_ENV', 'local')
    return config['environments'][env]['api_base']


def pytest_addoption(parser):
    """Ajoute des options de ligne de commande"""
    parser.addoption('--browser', action='store', default='chrome',
                     help='Navigateur à utiliser (chrome, firefox)')
    parser.addoption('--headless', action='store', default='true',
                     help='Exécuter en mode headless (true/false)')


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook pour capturer les screenshots en cas d'échec"""
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == 'call' and rep.failed:
        if 'driver' in item.funcargs:
            driver = item.funcargs['driver']
            try:
                screenshot_path = os.path.join(
                    os.path.dirname(__file__), 
                    '../../reports/functional/selenium',
                    f'screenshot_{item.name}.png'
                )
                os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
                driver.save_screenshot(screenshot_path)
            except Exception as e:
                print(f"Erreur lors de la capture d'écran: {e}")
