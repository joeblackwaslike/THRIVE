#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["python-dotenv", "httpx", "rich"]
# ///
import sys
from rich.pretty import pprint

import httpx


def main(args=sys.argv):
    payload = {
        "email": "joeblackwaslike@me.com",
        "password": "Prosperis123!",
    }

    if len(args) == 0:
        args.append("login")

    match args[1]:
        case "register":
            url = "http://localhost:3001/api/auth/register"
        case "login":
            url = "http://localhost:3001/api/auth/login"

    with httpx.Client() as client:
        r = client.post(
            url,
            json=payload,
        )
        r.raise_for_status()
        return r.json()


if __name__ == "__main__":
    pprint(main())
