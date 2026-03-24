import os
import asyncpg
import redis.asyncio as aioredis
from dotenv import load_dotenv

load_dotenv()

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
REDIS_URL = os.getenv("REDIS_URL")

async def get_pg_pool():
    if not POSTGRES_DSN:
        raise ValueError("POSTGRES_DSN not set in .env")
    return await asyncpg.create_pool(dsn=POSTGRES_DSN)

async def get_redis():
    if not REDIS_URL:
        raise ValueError("REDIS_URL not set in .env")
    return await aioredis.from_url(REDIS_URL, decode_responses=True)
