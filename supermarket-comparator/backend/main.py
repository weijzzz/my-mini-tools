import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import os
import re
import json
import random
from difflib import SequenceMatcher
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

from scrapers.mercadona import scrape_mercadona
from scrapers.hiperdino import scrape_hiperdino
from scrapers.carrefour import scrape_carrefour
from scrapers.spar import scrape_spar

load_dotenv()

app = FastAPI(title="Supermarket Comparator API")

# Enable CORS for Next.js frontend (default port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None
    print("WARNING: GEMINI_API_KEY is not set.")

class ImageResponse(BaseModel):
    brand: str
    name: str
    weight: str
    error: str | None = None

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}

@app.post("/api/process-image", response_model=ImageResponse)
async def process_image(file: UploadFile = File(...)):
    """
    Receives an uploaded image.
    MOCKED TO BYPASS EU GOOGLE API LIMITS.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    print(f"[API] Processing image: {file.filename}")
    await asyncio.sleep(1)
    
    return ImageResponse(
        brand="ColaCao",
        name="Cacao soluble Original",
        weight="1kg"
    )

def add_mock_distance_data(store_name: str, base_zip: str = "35001"):
    """Mocks the calculation from User Location to Nearest Store Branch in Las Palmas."""
    mock_branches = {
        "Mercadona": "Avenida Pintor Felo Monzón, Las Palmas",
        "HiperDino": "Luis Doreste Silva, Las Palmas",
        "Carrefour": "C.C. Las Arenas, Las Palmas",
        "Spar": "Guanarteme 54, Las Palmas"
    }
    distance = round(random.uniform(0.5, 5.0), 1)
    return {
        "nearest_branch": mock_branches.get(store_name, "Unknown Branch, Las Palmas"),
        "distance_km": distance
    }

# ---------------------------------------------------------------------------
# SPEC REGEX: extracts weight / volume / pack info from title or spec_detail
# ---------------------------------------------------------------------------
SPEC_RE = re.compile(
    r'(\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:kg|g|l|ml|cl|ud))',
    re.IGNORECASE
)

# Common brand / noise words to strip when building a canonical product name
NOISE_WORDS = {"de", "del", "la", "el", "los", "las", "con", "sin", "para", "en", "y", "e", "a"}


def _normalize_name(title: str) -> str:
    """
    Lowercase, remove accents approximation, strip spec fragments and noise.
    Returns a simplified canonical name for fuzzy matching.
    """
    t = title.lower()
    # Strip spec patterns so "Cerveza Tropical 6x330ml" → "cerveza tropical"
    t = SPEC_RE.sub("", t)
    # Remove common punctuation
    t = re.sub(r'[^\w\s]', ' ', t)
    words = [w for w in t.split() if w and w not in NOISE_WORDS and len(w) > 1]
    return " ".join(words)


def _extract_spec(product: dict) -> str:
    """Return a normalized spec string like '6x330ml' or '1kg'."""
    raw = product.get("spec_detail", "")
    if raw:
        # Clean it up
        s = raw.lower().replace(" ", "").replace(",", ".")
        return s
    # Fallback: try to parse from title
    m = SPEC_RE.search(product.get("title", ""))
    if m:
        return m.group(1).lower().replace(" ", "").replace(",", ".")
    return ""


def _price_normalize(raw_price: str) -> float:
    """Parse any price string to a float, return 999.99 on failure."""
    clean = raw_price.replace('€', '').replace(',', '.').replace(' ', '')
    clean = ''.join(c for c in clean if c.isdigit() or c == '.')
    if clean.count('.') > 1:
        parts = clean.rsplit('.', 1)
        clean = parts[0].replace('.', '') + '.' + parts[1]
    try:
        return float(clean) if clean else 999.99
    except Exception:
        return 999.99


def _compute_relevance(title: str, query: str) -> int:
    """
    Score 0-100 measuring how well a product title matches the search query.
    Full exact substring match → 100
    All query words present → 80
    Partial → proportional
    """
    title_lower = title.lower()
    query_lower = query.lower().strip()

    # Exact substring match
    if query_lower in title_lower:
        return 100

    # Word-level matching
    query_words = query_lower.split()
    if not query_words:
        return 0
    
    matches = sum(1 for w in query_words if w in title_lower)
    ratio = matches / len(query_words)
    
    if ratio == 1.0:
        return 80
    return int(ratio * 60)


def _unit_price_calc(product: dict) -> str:
    """Calculate or passthrough unit price string."""
    raw_unit = str(product.get("unit_price", ""))
    if raw_unit and "€" in raw_unit:
        return raw_unit.replace(',', '.')

    parsed_price = product.get("parsed_price", 999.99)
    if parsed_price == 999.99:
        return ""

    name_lower = str(product.get("title", "")).lower() + " " + str(product.get("spec_detail", "")).lower()
    weight_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)', name_lower)
    if not weight_match:
        return ""

    val = float(weight_match.group(1).replace(',', '.'))
    unit = weight_match.group(2)

    calc = None
    if unit == 'g' and val > 0:
        calc = parsed_price / (val / 1000)
    elif unit == 'kg' and val > 0:
        calc = parsed_price / val
    elif unit == 'ml' and val > 0:
        calc = parsed_price / (val / 1000)
        unit = 'l'
    elif unit == 'l' and val > 0:
        calc = parsed_price / val

    if calc:
        display_unit = 'kg' if unit in ['g', 'kg'] else 'L'
        return f"{calc:.2f} €/{display_unit}"
    return ""


def _process_product(product: dict, query: str, zip_code: str) -> dict:
    """Normalize price, inject distance/location, compute relevance, calc unit price."""
    store = product.get("store", "Unknown")
    
    # Distance
    location_data = add_mock_distance_data(store, zip_code)
    product["nearest_branch"] = location_data["nearest_branch"]
    product["distance_km"] = location_data["distance_km"]

    # Price normalization
    raw_price = str(product.get("price", "0"))
    parsed = _price_normalize(raw_price)
    product["parsed_price"] = parsed
    if parsed != 999.99:
        product["price"] = f"{parsed:.2f} €"

    # Original price normalization (for sale items)
    raw_orig = str(product.get("original_price", ""))
    if raw_orig:
        orig_parsed = _price_normalize(raw_orig)
        if orig_parsed != 999.99:
            product["original_price"] = f"{orig_parsed:.2f} €"

    # Unit price
    product["unit_price"] = _unit_price_calc(product)

    # Relevance score
    product["relevance_score"] = _compute_relevance(product.get("title", ""), query)

    return product


def _fuzzy_group(products: list) -> list:
    """
    Group products by normalized name + spec using difflib fuzzy matching.
    Returns list of group dicts:
      { "spec_key": str, "products": { "Mercadona": {...}|None, ... } }
    """
    STORES = ["Mercadona", "HiperDino", "Carrefour", "Spar"]
    
    # Build a grouping key for each product
    keyed = []
    for p in products:
        name_norm = _normalize_name(p.get("title", ""))
        spec = _extract_spec(p)
        group_key = f"{name_norm}|{spec}" if spec else name_norm
        keyed.append((group_key, p))
    
    # Sort by relevance (highest first) so best matches seed the groups
    keyed.sort(key=lambda x: x[1].get("relevance_score", 0), reverse=True)

    # Cluster via fuzzy matching
    groups = []  # Each: { "key": str, "products": { store: product } }
    
    for gk, product in keyed:
        store = product.get("store", "Unknown")
        matched_group = None
        best_ratio = 0.0

        for group in groups:
            # Only match if this store slot is empty (one product per store per group)
            if group["products"].get(store) is not None:
                continue
            ratio = SequenceMatcher(None, gk, group["key"]).ratio()
            if ratio >= 0.55 and ratio > best_ratio:
                best_ratio = ratio
                matched_group = group

        if matched_group:
            matched_group["products"][store] = product
        else:
            # Seed a new group
            groups.append({
                "key": gk,
                "products": {s: None for s in STORES}
            })
            groups[-1]["products"][store] = product

    # Build response-ready groups
    result = []
    for g in groups:
        # Derive a human-readable spec_key from the best product in the group
        best_product = None
        best_score = -1
        for s in STORES:
            p = g["products"][s]
            if p and p.get("relevance_score", 0) > best_score:
                best_score = p.get("relevance_score", 0)
                best_product = p
        
        if best_product:
            spec = _extract_spec(best_product)
            name = best_product.get("title", "Unknown")
            # Truncate long titles for the spec_key display
            short_name = name[:60].strip()
            spec_key = f"{short_name} — {spec}" if spec else short_name
        else:
            spec_key = g["key"]
        
        # Compute group's best relevance (for sorting groups)
        group_best_relevance = max(
            (p.get("relevance_score", 0) for p in g["products"].values() if p),
            default=0
        )
        # Compute group's cheapest price (for secondary sorting)
        group_cheapest = min(
            (p.get("parsed_price", 999.99) for p in g["products"].values() if p),
            default=999.99
        )

        result.append({
            "spec_key": spec_key,
            "group_relevance": group_best_relevance,
            "group_cheapest_price": group_cheapest,
            "products": g["products"],
        })
    
    # Sort: highest relevance first, then cheapest
    result.sort(key=lambda g: (-g["group_relevance"], g["group_cheapest_price"]))
    
    return result


@app.get("/api/search")
async def search_products(q: str = Query(..., min_length=2), zip_code: str = "35001"):
    """
    Central Orchestrator:
    Runs all 4 Playwright scrapers concurrently, standardizes data,
    performs fuzzy grouping and relevance scoring.
    """
    print(f"[API] Starting concurrent search orchestration for query: '{q}' in area {zip_code}")
    
    results = await asyncio.gather(
        scrape_mercadona(q, zip_code),
        scrape_hiperdino(q, zip_code),
        scrape_carrefour(q, zip_code),
        scrape_spar(q, zip_code),
        return_exceptions=True
    )
    
    all_products = []
    scraper_names = ["Mercadona", "HiperDino", "Carrefour", "Spar"]
    
    for idx, scraper_result in enumerate(results):
        store_name = scraper_names[idx]
        
        if isinstance(scraper_result, Exception):
            print(f"[API] [{store_name}] Scraper threw an exception: {scraper_result}")
            continue
            
        if isinstance(scraper_result, list):
            print(f"[API] [{store_name}] Found {len(scraper_result)} items")
            for product in scraper_result:
                processed = _process_product(product, q, zip_code)
                all_products.append(processed)

    # Fuzzy group across stores
    grouped = _fuzzy_group(all_products)
    
    # Also provide a flat sorted list for backward compatibility / ungrouped view
    flat_sorted = sorted(all_products, key=lambda x: (-x.get("relevance_score", 0), x.get("parsed_price", 999.99)))
    
    return {
        "query": q,
        "region_zip": zip_code,
        "total_results": len(all_products),
        "total_groups": len(grouped),
        "grouped_results": grouped,
        "data": flat_sorted,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
