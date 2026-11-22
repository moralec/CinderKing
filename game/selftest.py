#!/usr/bin/env python3
"""Self-test: run `python3 selftest.py` in this folder after every change. It serves the folder, opens index.html in headless
Chromium for a few seconds and prints facts about the page: errors, missing window.__game fields, whether the canvas shows anything,
what one move does, and a screenshot path. Returns within ~45 s and leaves nothing running. In round 4 (BRIEF.md says "round 4") it
also prints the round 4 contract fields that are missing, the counts, the data files fetched, a walk through all zones with
travel() and three zone screenshots; that takes about a minute."""
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
    rnd = "R4" if "round 4" in head else "R3" if "round 3" in head else "R2" if "round 2" in head else "R1"
    limit = 100 if rnd == "R4" else 40   # round 4 also visits every zone
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
            out, _ = ch.communicate(timeout=limit)
        except subprocess.TimeoutExpired:
            os.killpg(ch.pid, signal.SIGTERM)
            time.sleep(2)
            try:
                os.killpg(ch.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            out = (ch.communicate()[0] or "") + f"\nselftest: timed out after {limit} s"
        print(out.strip()[-(7000 if rnd == "R4" else 4000):])
    finally:
        for p in (ch, srv):
            if p is not None:
                try:
                    os.killpg(p.pid, signal.SIGKILL)
                except (ProcessLookupError, PermissionError):
                    pass


if __name__ == "__main__":
    main()
