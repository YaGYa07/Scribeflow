#!/usr/bin/env python3
"""Push .env variables to Vercel production (handles values with = and @)."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
env_file = ROOT / ".env"
PROD_URL = "https://scribeflow-two.vercel.app"


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
    env["AUTH_TRUST_HOST"] = "true"
    env["SUPABASE_REGION"] = "ap-south-1"
    env["SKIP_ENV_VALIDATION"] = "true"
    env["HUSKY"] = "0"

    # Build pooler URL for Vercel if direct Supabase URL is in .env
    direct = env.get("DATABASE_URL", "")
    if "db." in direct and ".supabase.co" in direct and "DATABASE_URL_POOLED" not in env:
        try:
            from urllib.parse import urlparse, urlunparse

            p = urlparse(direct)
            ref = p.hostname.split(".")[1] if p.hostname else ""
            if ref:
                pooler = p._replace(
                    netloc=f"postgres.{ref}:{p.password}@aws-1-ap-south-1.pooler.supabase.com:6543",
                    path="/postgres",
                    query="",
                )
                env["DATABASE_URL_POOLED"] = urlunparse(pooler)
        except Exception:
            pass

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
