import sys
import asyncio
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from scrapers.carrefour import scrape_carrefour
from scrapers.hiperdino import scrape_hiperdino
from scrapers.spar import scrape_spar

async def main():
    print("Testing Carrefour...")
    try:
        res = await scrape_carrefour("cerveza tropical")
        print("C results:", len(res))
    except Exception as e:
        print("C error", e)
        
    print("Testing HiperDino...")
    try:
        res = await scrape_hiperdino("cerveza tropical")
        print("H results:", len(res))
    except Exception as e:
        print("H error", e)
        
    print("Testing Spar...")
    try:
        res = await scrape_spar("cerveza tropical")
        print("S results:", len(res))
    except Exception as e:
        print("S error", e)

if __name__ == "__main__":
    asyncio.run(main())
