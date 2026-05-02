#!/usr/bin/env python3
"""
Seedance smoke test (imarouter /v1/videos).

Submits one prompt, polls until terminal state, downloads the resulting mp4.
Reads IMAROUTER_API_KEY from .env.local (Next.js convention) or env.

Usage:
    python scripts/seedance_smoke.py
    python scripts/seedance_smoke.py --prompt "Custom prompt here" --duration 5

Outputs go to /tmp/seedance-tests/ (gitignored by default; not in repo).
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = Path("/tmp/seedance-tests")
ENDPOINT = "https://api.imarouter.com/v1/videos"
POLL_INTERVAL_S = 6
POLL_MAX_S = 300


def load_env():
    """Load IMAROUTER_API_KEY from .env.local if not already in env."""
    for fname in (".env.local", ".env"):
        p = ROOT / fname
        if not p.exists():
            continue
        for line in p.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def http_json(method, url, headers=None, body=None, timeout=120):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def submit(key, body):
    return http_json(
        "POST",
        ENDPOINT,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        body=body,
    )


def poll(key, task_id):
    return http_json(
        "GET",
        f"{ENDPOINT}/{task_id}",
        headers={"Authorization": f"Bearer {key}"},
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", default="Time-lapse photography of the city in the early morning, with warm colors and a cinematic feel.")
    ap.add_argument("--duration", type=int, default=5)
    ap.add_argument("--resolution", default="720p")
    ap.add_argument("--model", default="seedance-2.0-fast")
    args = ap.parse_args()

    load_env()
    key = os.environ.get("IMAROUTER_API_KEY")
    if not key:
        print("ERROR: IMAROUTER_API_KEY not set (looked in env, .env.local, .env)", file=sys.stderr)
        sys.exit(2)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    body = {
        "model": args.model,
        "prompt": args.prompt,
        "duration": args.duration,
        "metadata": {"resolution": args.resolution},
    }
    print(f"submit: {json.dumps(body)}")
    t0 = time.time()
    status, _, raw = submit(key, body)
    if status != 200:
        print(f"submit failed: status={status} body={raw[:500]!r}", file=sys.stderr)
        sys.exit(1)

    parsed = json.loads(raw.decode())
    task_id = parsed.get("task_id") or parsed.get("id")
    if not task_id:
        print(f"no task_id in response: {parsed}", file=sys.stderr)
        sys.exit(1)
    print(f"task_id={task_id}")

    final = None
    while time.time() - t0 < POLL_MAX_S:
        time.sleep(POLL_INTERVAL_S)
        st, _, raw = poll(key, task_id)
        if st != 200:
            print(f"poll error status={st}", file=sys.stderr)
            continue
        body = json.loads(raw.decode())
        s = body.get("status", "")
        p = body.get("progress", 0)
        print(f"  [{int(time.time()-t0)}s] status={s} progress={p}")
        if s in {"completed", "succeeded", "success"}:
            final = body
            break
        if s == "failed":
            print(f"task failed: {body}", file=sys.stderr)
            sys.exit(1)

    if not final:
        print(f"timed out after {POLL_MAX_S}s", file=sys.stderr)
        sys.exit(1)

    log_path = OUT_DIR / f"{stamp}.log.json"
    log_path.write_text(json.dumps(final, indent=2))
    print(f"wrote {log_path}")

    results = final.get("results") or []
    if not results or "url" not in results[0]:
        print("no video url in results", file=sys.stderr)
        sys.exit(1)

    url = results[0]["url"]
    out_mp4 = OUT_DIR / f"{stamp}.mp4"
    urllib.request.urlretrieve(url, out_mp4)
    print(f"saved {out_mp4} ({out_mp4.stat().st_size} bytes)")
    print(f"total elapsed: {time.time()-t0:.1f}s  cost_usd={final.get('amount_usd')}")


if __name__ == "__main__":
    main()
