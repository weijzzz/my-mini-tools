import asyncio
import re
import random
import urllib.parse
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

SPEC_RE = re.compile(r'(\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:kg|g|l|ml|cl|ud))', re.IGNORECASE)


async def scrape_carrefour(query: str, postal_code: str = "35001"):
    results = []
    print(f"[Carrefour] Starting scraper for query: {query} at postal code: {postal_code}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-features=IsolateOrigins,site-per-process",
                "--no-sandbox"
            ]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        try:
            # 1. Initialization and Cloudflare evasion
            await page.goto("https://www.carrefour.es/", wait_until="domcontentloaded", timeout=30000)
            
            # Dismiss Cookie Modals
            try:
                cookie_btn = page.locator('#onetrust-accept-btn-handler, #onetrust-reject-all-handler, button:has-text("Aceptar")').first
                if await cookie_btn.count() > 0:
                    await cookie_btn.click(timeout=5000)
            except: pass
            
            # 2. Inject Postal Code
            loc_btn = page.locator('.location-selector-trigger, [data-testid="header-location"]').first
            await page.wait_for_selector('header, .header-elements', state="attached", timeout=30000)
            
            if await loc_btn.count() > 0:
                await loc_btn.click(timeout=30000)
                
                zip_input = page.locator('input[name="postalCode"], input[placeholder*="Código postal"]')
                await zip_input.wait_for(state="visible", timeout=30000)
                
                for char in postal_code:
                    await zip_input.type(char, delay=random.randint(100, 250))
                
                submit_btn = page.locator('button:has-text("Guardar"), button:has-text("Confirmar")').first
                if await submit_btn.count() > 0:
                    await submit_btn.click()
                
            print("[Carrefour] Session localized successfully.")
            
            # 3. Search
            try:
                search_box = page.locator('input[type="search"], input[type="text"], input[name="q"], input[placeholder*="uscar"]').first
                await search_box.wait_for(state="visible", timeout=15000)
                await search_box.fill(query)
                await page.wait_for_timeout(500)
                await search_box.press("Enter")
            except Exception:
                query_encoded = urllib.parse.quote(query)
                search_url = f"https://www.carrefour.es/?q={query_encoded}"
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            
            try:
                await page.wait_for_selector("article, .product-card, [data-testid='product-card']", timeout=15000)
            except Exception:
                pass
            await asyncio.sleep(random.uniform(3.0, 5.0))
            
            # 4. Extraction with Rich Fields
            products = await page.locator("article, .product-card, [data-testid='product-card']").all()
            for prod in products:
                title_el = prod.locator('.product-card__title, .product-card__title-link, h2, a.nav-link, [data-testid="product-title"], .title').first
                price_el = prod.locator('.product-card__price, .product-card__price--current, .current-price, [data-testid="product-price"], .price').first
                unit_price_el = prod.locator('.product-card__price-per-unit, .price-per-unit, .product-card__measure').first
                
                # NEW: Image
                img_el = prod.locator('.product-card__image img, img[data-testid="product-image"], img').first
                # NEW: Old price
                old_price_el = prod.locator('.product-card__price--old, .product-card__price--strikethrough, del, s').first
                # NEW: Quantity / format
                format_el = prod.locator('.product-card__quantity, .product-card__packaging, .product-card__format').first
                
                title = await title_el.text_content() if await title_el.count() > 0 else ""
                price = await price_el.text_content() if await price_el.count() > 0 else ""
                unit_price = await unit_price_el.text_content() if await unit_price_el.count() > 0 else ""
                
                image_url = ""
                if await img_el.count() > 0:
                    image_url = await img_el.get_attribute("src") or await img_el.get_attribute("data-src") or ""
                
                original_price = ""
                if await old_price_el.count() > 0:
                    original_price = (await old_price_el.text_content() or "").strip()
                
                is_on_sale = bool(original_price)
                
                spec_detail = ""
                if await format_el.count() > 0:
                    spec_detail = (await format_el.text_content() or "").strip()
                if not spec_detail and title:
                    m = SPEC_RE.search(title)
                    if m:
                        spec_detail = m.group(1).strip()
                
                if title and price:
                    results.append({
                        "store": "Carrefour",
                        "title": title.strip(),
                        "price": price.strip(),
                        "unit_price": unit_price.strip(),
                        "image_url": image_url,
                        "original_price": original_price,
                        "is_on_sale": is_on_sale,
                        "spec_detail": spec_detail,
                    })
            
            # 5. Universal Fallback: Blind Regex Extraction
            if not results:
                print("[Carrefour] Primary selectors failed. Running Regex Price Finder fallback.")
                body_text = await page.evaluate("() => document.body.innerText")
                
                with open("dump_carrefour.txt", "w", encoding="utf-8") as f:
                    f.write(body_text)
                try:
                    await page.screenshot(path="dump_carrefour.png", full_page=True)
                except: pass
                
                lines = [line.strip() for line in body_text.split('\n') if line.strip()]
                seen = set()
                
                for i, line in enumerate(lines):
                    if '€' in line or re.search(r'\d+,\d{2}', line):
                        price_match = re.search(r'(\d+[\.,]\d{2})', line)
                        if price_match:
                            title = lines[i-1] if i > 0 else "Unknown Product"
                            if len(title) > 4 and title.lower() not in ["comprar", "añadir", "ver más", "oferta", "agregar"]:
                                if title not in seen:
                                    spec = ""
                                    m = SPEC_RE.search(title)
                                    if m:
                                        spec = m.group(1).strip()
                                    results.append({
                                        "store": "Carrefour",
                                        "title": title[:80],
                                        "price": price_match.group(1),
                                        "unit_price": "",
                                        "image_url": "",
                                        "original_price": "",
                                        "is_on_sale": False,
                                        "spec_detail": spec,
                                    })
                                    seen.add(title)
        except Exception as e:
            print(f"[Carrefour] Scraping error: {e}")
            
        finally:
            await browser.close()
            
    return results

if __name__ == "__main__":
    res = asyncio.run(scrape_carrefour("Cola Cao"))
    import json
    print(json.dumps(res, indent=2))
