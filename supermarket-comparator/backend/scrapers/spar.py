import asyncio
import re
import random
import urllib.parse
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

SPEC_RE = re.compile(r'(\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:kg|g|l|ml|cl|ud))', re.IGNORECASE)


async def scrape_spar(query: str, postal_code: str = "35001"):
    results = []
    print(f"[Spar] Starting scraper for query: {query} at postal code: {postal_code}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        try:
            # 1. Domain Initialization and Cookie Clearance 
            await page.goto("https://spargrancanaria.es/", wait_until="domcontentloaded", timeout=30000)
            
            try:
                cookie_btn = page.locator('#onetrust-accept-btn-handler, button:has-text("Aceptar")').first
                if await cookie_btn.count() > 0:
                    await cookie_btn.click(timeout=5000)
            except: pass
            
            # Execute Behavioral Search
            try:
                search_box = page.locator('input[type="search"], input[type="text"], input[name="q"], input[placeholder*="uscar"]').first
                await search_box.wait_for(state="visible", timeout=15000)
                await search_box.fill(query)
                await page.wait_for_timeout(500)
                await search_box.press("Enter")
            except Exception as e:
                query_encoded = urllib.parse.quote(query)
                search_url = f"https://spargrancanaria.es/catalogsearch/result/?q={query_encoded}"
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)

            await page.wait_for_timeout(5000)
            
            try:
                await page.wait_for_selector("li.product-item, .product-item, .item.product", timeout=15000)
            except Exception:
                pass
            
            await asyncio.sleep(random.uniform(2.0, 3.5))
            
            # 2. Element Extraction with Rich Fields
            products = await page.locator("li.product-item, .product-item, .item.product").all()
            for prod in products:
                title_el = prod.locator('.product-item-link, .product-item-name, a.product-item-link').first
                price_el = prod.locator('.price-wrapper .price, .price, span.price').first
                unit_price_el = prod.locator('.price-unit, .price-tier, small.price').first
                
                # NEW: Image
                img_el = prod.locator('.product-image-container img, .product-item-photo img, img').first
                # NEW: Old price
                old_price_el = prod.locator('.old-price .price, del .price, .price-old, del, s').first
                # NEW: Spec / attribute
                format_el = prod.locator('.product-item-attribute, .product-item-description, .product-item-size').first
                
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
                        "store": "Spar",
                        "title": title.replace('\n', ' ').strip(),
                        "price": price.replace('\n', ' ').strip(),
                        "unit_price": unit_price.replace('\n', ' ').strip(),
                        "image_url": image_url,
                        "original_price": original_price,
                        "is_on_sale": is_on_sale,
                        "spec_detail": spec_detail,
                    })
            
            # Universal Fallback: Blind Regex Extraction
            if not results:
                print("[Spar] Primary selectors failed. Running Regex Price Finder fallback.")
                body_text = await page.evaluate("() => document.body.innerText")
                
                with open("dump_spar.txt", "w", encoding="utf-8") as f:
                    f.write(body_text)
                try:
                    await page.screenshot(path="dump_spar.png", full_page=True)
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
                                        "store": "Spar",
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
            print(f"[Spar] Scraping error: {e}")
            
        finally:
            await browser.close()
            
    return results

if __name__ == "__main__":
    res = asyncio.run(scrape_spar("Cola Cao"))
    import json
    print(json.dumps(res, indent=2))
