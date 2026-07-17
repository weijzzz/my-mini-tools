import urllib.request
import json

req = urllib.request.Request('http://127.0.0.1:8001/api/search?q=cerveza%20tropical&zip_code=35001')
res = urllib.request.urlopen(req, timeout=120)
data = json.loads(res.read())

print(f"Total results: {data.get('total_results', 0)}")
print(f"Total groups:  {data.get('total_groups', 0)}")
print()

# Show first 3 grouped_results
groups = data.get("grouped_results", [])
for i, g in enumerate(groups[:3]):
    print(f"=== Group {i+1}: {g['spec_key']} ===")
    print(f"    Relevance: {g['group_relevance']}  |  Cheapest: {g['group_cheapest_price']}")
    for store in ["Mercadona", "HiperDino", "Carrefour", "Spar"]:
        p = g["products"].get(store)
        if p:
            sale_tag = " [SALE]" if p.get("is_on_sale") else ""
            img_tag = " [IMG]" if p.get("image_url") else ""
            spec_tag = f" [{p['spec_detail']}]" if p.get("spec_detail") else ""
            print(f"    {store:12s}: {p['price']:>10s}  {p['title'][:50]}{sale_tag}{img_tag}{spec_tag}")
        else:
            print(f"    {store:12s}: ---")
    print()
