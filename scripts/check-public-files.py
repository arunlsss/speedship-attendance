#!/usr/bin/env python3
"""Reject server files and obvious credential values in the public frontend."""
import pathlib, re, subprocess, sys
files = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
patterns = [
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"\bgh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    re.compile(rb"""(?i)["'](?:private_key|client_secret|refresh_token)["']\s*:\s*["'][^"']{12,}"""),
]
failures = []
for name in filter(None, files):
    path = pathlib.PurePosixPath(name)
    if path.parts[0] in {"backend", "node_modules"} or path.name.startswith(".env") or path.name in {"firebase-debug.log", "service-account.json"}:
        failures.append((name, "server or environment file"))
        continue
    file = pathlib.Path(name)
    if file.is_symlink():
        failures.append((name, "symlink requires review"))
        continue
    if file.is_file() and file.stat().st_size < 5_000_000:
        data = file.read_bytes()
        if any(pattern.search(data) for pattern in patterns):
            failures.append((name, "potential credential; value withheld"))
for name, reason in failures:
    print(f"BLOCKED: {name}: {reason}")
if failures:
    sys.exit(1)
print("PASS: no backend paths, environment files or recognized credential patterns.")
