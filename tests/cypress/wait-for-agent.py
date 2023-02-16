import time
import socket


def main():

    print("waiting for agent")
    while True:
        count_bytes = 0
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            sock.connect(("checkmk", 6556))
            while count := len(sock.recv(1024)):
                count_bytes += count
        except (socket.timeout, ConnectionRefusedError):
            print("could not receive any data")
            time.sleep(1)
            continue
        if count_bytes < 1024:
            print(f"could not receive 1024 bytes, only {count_bytes}")
            time.sleep(1)
            continue
        break
    print(f"agent returned {count_bytes} bytes, so we assume it runs now")


if __name__ == '__main__':
    main()
