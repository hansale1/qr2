import requests
import logging
import time

# 로깅 설정
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

KIOSK_ID = "001"
SERVER_URL = "https://port-0-hana3-m1qkyjt4a2d70057.sel4.cloudtype.app"

logging.info(f"키오스크 ID: {KIOSK_ID}로 인쇄 작업 모니터링 시작")
logging.info(f"서버 URL: {SERVER_URL}")

while True:
    try:
        # 서버 상태 확인
        response = requests.get(f"{SERVER_URL}/api/status")
        logging.debug(f"Full response: {response.text}")
        logging.info(f"서버 상태: {response.json().get('status')}")

        # 인쇄 작업 가져오기
        response = requests.get(f"{SERVER_URL}/api/get-print-job/{KIOSK_ID}")
        logging.debug(f"서버 응답: {response.status_code}")
        logging.debug(f"응답 내용: {response.text}")

        if response.status_code == 200:
            print_job = response.json()
            if print_job:
                logging.info(f"인쇄 작업 수신: {print_job}")
                # 인쇄 작업 처리 로직 추가
            else:
                logging.info("인쇄 작업이 없습니다.")
        else:
            logging.error("인쇄 작업 요청 실패")

    except Exception as e:
        logging.error("인쇄 작업 요청 중 오류 발생", exc_info=True)

    logging.info("대기 중... 새로운 인쇄 작업이 없습니다.")
    time.sleep(20)
