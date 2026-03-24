# Test WebDriver
import traceback

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options

    # Create headless driver
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')

    try:
        driver = webdriver.Chrome(options=options)
        print('WebDriver created successfully')
        driver.quit()
    except Exception as e:
        print(f'WebDriver error: {e}')
        traceback.print_exc()
except Exception as e:
    print(f'Import error: {e}')
    traceback.print_exc()
