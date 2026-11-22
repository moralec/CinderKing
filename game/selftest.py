#!/usr/bin/env python3
"""Self-test: run `python3 selftest.py` in this folder after every change. It serves the folder, opens index.html in headless
Chromium for a few seconds and prints facts about the page: errors, missing window.__game fields, whether the canvas shows anything,
what one move does, and a screenshot path. Returns within ~45 s and leaves nothing running."""
import os
import shutil
import signal
import socket
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
NODE = shutil.which("node") or "node"


def main():
    head = open(os.path.join(HERE, "BRIEF.md"), errors="replace").read()[:200].lower()
    rnd = "R3" if "round 3" in head else "R2" if "round 2" in head else "R1"
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", HERE],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL, start_new_session=True)
    ch = None
    try:
        for _ in range(50):
            try:
                socket.create_connection(("127.0.0.1", port), timeout=0.5).close()
                break
            except OSError:
                time.sleep(0.1)
        if not os.path.exists(os.path.join(HERE, "index.html")):
            print("selftest: no index.html in this folder")
            return
        shot = os.path.join(HERE, "selftest-shot.png")
        ch = subprocess.Popen([NODE, os.path.join(HERE, "tools", "selftest.mjs"), f"http://127.0.0.1:{port}/index.html", shot, rnd],
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, text=True, start_new_session=True)
        try:
            out, _ = ch.communicate(timeout=40)
        except subprocess.TimeoutExpired:
            os.killpg(ch.pid, signal.SIGTERM)
            time.sleep(2)
            try:
                os.killpg(ch.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            out = (ch.communicate()[0] or "") + "\nselftest: timed out after 40 s"
        print(out.strip()[-4000:])
    finally:
        for p in (ch, srv):
            if p is not None:
                try:
                    os.killpg(p.pid, signal.SIGKILL)
                except (ProcessLookupError, PermissionError):
                    pass


if __name__ == "__main__":
    main()
