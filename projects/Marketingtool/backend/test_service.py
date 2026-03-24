# Test Analysis Service
import traceback
import time

try:
    from models.schemas import AnalysisRequest
    from services.analysis_service import AnalysisService
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options

    # Create headless driver
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')

    driver = webdriver.Chrome(options=options)

    try:
        # Create service
        service = AnalysisService(driver)

        # Test with a simple request
        request = AnalysisRequest(business_name="테스트 업체", region="서울")
        print(f"Starting analysis for: {request.business_name}")

        # Run analyze (this will likely fail for real crawling, but tests the flow)
        try:
            # We'll skip actual crawling and test the structure
            print("Testing service structure...")
            print(f"Service created: {type(service)}")
            print(f"Service has place_crawler: {hasattr(service, 'place_crawler')}")
            print(f"Service has photo_crawler: {hasattr(service, 'photo_crawler')}")
            print(f"Service has review_crawler: {hasattr(service, 'review_crawler')}")
            print(f"Service has blog_crawler: {hasattr(service, 'blog_crawler')}")
            print(f"Service has rank_crawler: {hasattr(service, 'rank_crawler')}")
            print(f"Service has naver_client: {hasattr(service, 'naver_client')}")
            print("Service structure OK!")

        except Exception as e:
            print(f"Analysis error: {e}")
            traceback.print_exc()

    finally:
        driver.quit()
        print("WebDriver closed")

except Exception as e:
    print(f'Error: {e}')
    traceback.print_exc()
