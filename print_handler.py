import requests
import time
import base64
from PIL import Image
from io import BytesIO
import win32print
import win32ui
from PIL import ImageWin
import logging
import os
from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

KIOSK_ID = os.getenv('KIOSK_ID', '001')
SERVER_URL = os.getenv('SERVER_URL', 'https://port-0-hana3-m1qkyjt4a2d70057.sel4.cloudtype.app')

def get_print_job():
    try:
        response = requests.get(f'{SERVER_URL}/api/get-print-job/{KIOSK_ID}', timeout=10, verify=False)
        logging.debug(f"서버 응답: {response.status_code}")
        logging.debug(f"응답 내용: {response.text}")
        logging.debug(f"응답 헤더: {response.headers}")
        if response.status_code == 200:
            return response.json()['job']
        elif response.status_code == 204:
            logging.info("인쇄 작업이 없습니다.")
            return None
        else:
            logging.error(f"서버 오류: {response.status_code}")
            logging.error(f"오류 내용: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        logging.error(f"연결 오류: {e}")
        return None

def print_image(job):
    try:
        image_data = job['imageData'].split(',')[1]
        is_full_print = job['isFullPrint']
        image = Image.open(BytesIO(base64.b64decode(image_data)))
        
        printer_name = win32print.GetDefaultPrinter()
        logging.info(f"사용 중인 프린터: {printer_name}")

        hDC = win32ui.CreateDC()
        hDC.CreatePrinterDC(printer_name)
        
        hDC.StartDoc('HANA STUDIO Print Job')
        hDC.StartPage()

        # CR-80 카드 크기 (58mm x 90mm)
        target_width_mm, target_height_mm = 58, 90
        dpi = 300  # 프린터 해상도 (DPI)
        target_width = int(target_width_mm * dpi / 25.4)
        target_height = int(target_height_mm * dpi / 25.4)

        img_width, img_height = image.size
        if is_full_print:
            # 전체 인쇄 모드: 이미지를 카드 크기에 맞게 확대/축소
            image = image.resize((target_width, target_height), Image.LANCZOS)
            x_offset, y_offset = 0, 0
        else:
            # 일반 인쇄 모드: 이미지 비율 유지
            ratio = min(target_width / img_width, target_height / img_height)
            new_width = int(img_width * ratio)
            new_height = int(img_height * ratio)
            image = image.resize((new_width, new_height), Image.LANCZOS)
            x_offset = (target_width - new_width) // 2
            y_offset = (target_height - new_height) // 2

        dib = ImageWin.Dib(image)
        dib.draw(hDC.GetHandleOutput(), (x_offset, y_offset, x_offset + image.width, y_offset + image.height))

        hDC.EndPage()
        hDC.EndDoc()
        hDC.DeleteDC()

        logging.info("이미지 인쇄 완료")
    except Exception as e:
        logging.error(f"인쇄 오류: {e}")

def check_server_status():
    try:
        response = requests.get(f'{SERVER_URL}/api/status', timeout=10, verify=False)
        logging.debug(f"Full response: {response.text}")
        logging.debug(f"Response headers: {response.headers}")
        if response.status_code == 200:
            logging.info("서버 상태: 정상")
            return True
        else:
            logging.error(f"서버 상태 확인 실패: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"서버 연결 오류: {e}")
        return False

def main():
    logging.info(f"키오스크 ID: {KIOSK_ID}로 인쇄 작업 모니터링 시작")
    logging.info(f"서버 URL: {SERVER_URL}")
    while True:
        try:
            if not check_server_status():
                logging.error("서버에 연결할 수 없습니다. 30초 후 재시도합니다.")
                time.sleep(30)
                continue

            job = get_print_job()
            if job:
                logging.info("새로운 인쇄 작업을 받았습니다. 인쇄를 시작합니다...")
                print_image(job)
            else:
                logging.info("대기 중... 새로운 인쇄 작업이 없습니다.")
            time.sleep(5)
        except Exception as e:
            logging.error(f"예기치 못한 오류 발생: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()