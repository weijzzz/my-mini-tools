import asyncio
import re
import random
import urllib.parse
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

SPEC_RE = re.compile(r'(\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:kg|g|l|ml|cl|ud))', re.IGNORECASE)


async def scrape_mercadona(query: str, postal_code: str = "35001"):
    results = []
    print(f"[Mercadona] Starting scraper for query: {query} at postal code: {postal_code}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        
        # Apply stealth patches (navigator.webdriver=false, WebGL obfuscation, etc.)
        await Stealth().apply_stealth_async(page)
        
        try:
            # 1. Initialization and Postal Code Injection (Las Palmas 35001)
            await page.goto("https://tienda.mercadona.es/", wait_until="domcontentloaded", timeout=30000)
            
            postal_input = page.locator('input[name="postalCode"]')
            await postal_input.wait_for(state="visible", timeout=30000)
            
            for char in postal_code:
                await postal_input.type(char, delay=random.randint(40, 120))
                
            submit_btn = page.locator('button[data-test="btn-submit"]')
            if await submit_btn.count() == 0:
                 submit_btn = page.locator('button:has-text("Continuar")')
            await submit_btn.click()
            
            await page.wait_for_selector("input[type='text'], .header", state="attached", timeout=30000)
            print("[Mercadona] Authorized and localized to Las Palmas.")
            
            # 2. Emulate Search Flow
            query_encoded = urllib.parse.quote(query)
            search_url = f"https://tienda.mercadona.es/search-results?query={query_encoded}"
            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            
            try:
                await page.wait_for_selector("div.product-cell", timeout=15000)
            except Exception:
                pass
            
            await asyncio.sleep(random.uniform(2.5, 4.0))
            
            # 3. Data Extraction with Rich Fields
            products = await page.locator("div.product-cell").all()
            for prod in products:
                title_el = prod.locator("h4.subhead1-r")
                price_el = prod.locator("p.product-price__unit-price")
                unit_price_el = prod.locator("p.product-price__bulk-price")
                
                # NEW: Image extraction
                img_el = prod.locator("img").first
                # NEW: Old/strikethrough price for sale detection
                old_price_el = prod.locator("p.product-price__old-price, .product-price__previous, del, s").first
                # NEW: Packaging/format line
                format_el = prod.locator(".product-format, .format, .product-cell__unit-text, span.footnote1-r").first
                
                title = await title_el.text_content() if await title_el.count() > 0 else ""
                price = await price_el.text_content() if await price_el.count() > 0 else ""
                unit_price = await unit_price_el.text_content() if await unit_price_el.count() > 0 else ""
                
                image_url = ""
                if await img_el.count() > 0:
                    image_url = await img_el.get_attribute("src") or ""
                
                original_price = ""
                if await old_price_el.count() > 0:
                    original_price = (await old_price_el.text_content() or "").strip()
                
                is_on_sale = bool(original_price)
                
                # Extract spec_detail from format element or title
                spec_detail = ""
                if await format_el.count() > 0:
                    spec_detail = (await format_el.text_content() or "").strip()
                if not spec_detail and title:
                    m = SPEC_RE.search(title)
                    if m:
                        spec_detail = m.group(1).strip()
                
                if title and price:
                    results.append({
                        "store": "Mercadona",
                        "title": title.strip(),
                        "price": price.strip(),
                        "unit_price": unit_price.strip(),
                        "image_url": image_url,
                        "original_price": original_price,
                        "is_on_sale": is_on_sale,
                        "spec_detail": spec_detail,
                    })
        except Exception as e:
            print(f"[Mercadona] Scraping error: {e}")
            
        finally:
            await browser.close()
            
    return results

if __name__ == "__main__":
    res = asyncio.run(scrape_mercadona("Cola Cao"))
    import json
    print(json.dumps(res, indent=2))
