import requests
import time

def monitor_status(url):
    print(f"Monitoring: {url}")

    timing = False
    start_time = None

    while True:
        try:
            response = requests.get(url, timeout=5)
            text = response.text.strip().lower()

            if response.status_code == 200 and text == "ok":
                # If we get OK response
                if timing:
                    elapsed = time.time() - start_time
                    print(f"[OK] Server recovered after {elapsed:.2f} seconds.")
                    timing = False
                else:
                    print("[OK] Server is up.")
            else:
                # Server responding but not with 'ok'
                if not timing:
                    print("[BAD STATUS] Starting timer...")
                    timing = True
                    start_time = time.time()
                else:
                    print("[BAD STATUS] Still bad, waiting...")

        except Exception as e:
            # Network/server failure
            if not timing:
                print(f"[ERROR] {e}. Starting timer...")
                timing = True
                start_time = time.time()
            else:
                print(f"[ERROR] {e}. Still failing...")

        # Delay between checks
        time.sleep(2)


if __name__ == "__main__":
#    url = input("Enter the URL ending with status.txt: ").strip()
    url="https://majorproject.online/status.txt"
    monitor_status(url)

