#!/usr/bin/env python3
"""Push .env variables to Vercel production (handles values with = and @)."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
env_file = ROOT / ".env"
PROD_URL = "https://scribeflow-thesis.vercel.app"


def parse_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip()
    return out


def main() -> None:
    if not env_file.exists():
        raise SystemExit("No .env file")

    env = parse_env(env_file)
    env["NEXTAUTH_URL"] = PROD_URL
    env["SKIP_ENV_VALIDATION"] = "true"
    env["HUSKY"] = "0"

    for key, value in env.items():
        print(f"Setting {key} …")
        subprocess.run(
            [
                "vercel",
                "env",
                "add",
                key,
                "production",
                "--yes",
                "--force",
                "--value",
                value,
            ],
            cwd=ROOT,
            check=True,
        )

    print(f"Done. Deploy: vercel deploy --prod --yes")


if __name__ == "__main__":
    main()
