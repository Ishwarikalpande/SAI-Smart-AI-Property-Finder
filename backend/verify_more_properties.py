import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000/api"

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "TestClient"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

for pid in [1, 5, 10, 21]:
    wt_data = get_json(f"{BASE_URL}/properties/{pid}/walkthrough")
    prop = wt_data.get("property", {})
    rooms = wt_data.get("rooms", [])
    print(f"\n==================================================")
    print(f"PROPERTY ID {pid}: {prop.get('title')}")
    print(f"BHK: {prop.get('bhk')}, Bathrooms: {prop.get('bathrooms')}, Balconies: {prop.get('balconies')}")
    print(f"Rooms ({len(rooms)} total):")
    for idx, r in enumerate(rooms, 1):
        mode = "PHOTO: " + str(r.get("image_url")) if r.get("has_actual_image") else "2.5D BLUEPRINT"
        print(f"  {idx:02d}. {r['name']:<18} ({r['type']:<12}) -> {mode}")
