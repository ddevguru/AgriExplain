"""Capture colorful website screenshots for paper figures."""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "figures" / "website_color"
OUT.mkdir(parents=True, exist_ok=True)

BASE = "http://localhost:3000"


def _get_driver():
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options

    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1440,900")
    opts.add_argument("--force-device-scale-factor=1")
    opts.add_argument("--disable-gpu")
    try:
        return webdriver.Chrome(options=opts)
    except Exception:
        from selenium.webdriver.edge.options import Options as EdgeOptions

        eopts = EdgeOptions()
        eopts.add_argument("--headless=new")
        eopts.add_argument("--window-size=1440,900")
        return webdriver.Edge(options=eopts)


def _shot(driver, url: str, path: Path, wait: float = 2.5) -> None:
    driver.get(url)
    time.sleep(wait)
    driver.save_screenshot(str(path))
    print("saved", path.name)


def _login(driver, email: str, password: str) -> None:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    driver.get(f"{BASE}/login")
    wait = WebDriverWait(driver, 15)
    email_el = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type=email],input#email")))
    pwd_el = driver.find_element(By.CSS_SELECTOR, "input[type=password],input#password")
    email_el.clear()
    email_el.send_keys(email)
    pwd_el.clear()
    pwd_el.send_keys(password)
    btn = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
    btn.click()
    time.sleep(3)


def main() -> None:
    dev = subprocess.Popen(
        ["npm", "run", "dev", "--", "-p", "3000"],
        cwd=str(ROOT),
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        time.sleep(12)
        driver = _get_driver()
        try:
            _shot(driver, f"{BASE}/", OUT / "web_landing.png", 3)
            _shot(driver, f"{BASE}/login", OUT / "web_login.png", 2)

            _login(driver, "farmer@agrixplain.com", "demo123456")
            _shot(driver, f"{BASE}/farmer-dashboard", OUT / "web_farmer_dashboard.png", 4)
            _shot(driver, f"{BASE}/user-dashboard", OUT / "web_farmer_user.png", 3)

            _login(driver, "admin@agrixplain.com", "demo123456")
            _shot(driver, f"{BASE}/admin-dashboard", OUT / "web_admin_overview.png", 4)
            _shot(driver, f"{BASE}/admin-dashboard/predictions", OUT / "web_admin_models.png", 3)
            _shot(driver, f"{BASE}/admin-dashboard/sensors", OUT / "web_admin_sensors.png", 3)
        finally:
            driver.quit()
    finally:
        dev.terminate()
        try:
            dev.wait(timeout=5)
        except Exception:
            dev.kill()


if __name__ == "__main__":
    main()
