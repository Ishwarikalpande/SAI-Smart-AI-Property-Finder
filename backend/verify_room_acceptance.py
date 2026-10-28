import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000/api"

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "TestClient"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

props = get_json(f"{BASE_URL}/properties?limit=30")
items = props if isinstance(props, list) else props.get("items", [])
print(f"Total properties loaded: {len(items)}")

sample_bhk = {}
for p in items:
    bhk = p.get("bhk")
    if bhk in [1, 2, 3] and bhk not in sample_bhk:
        sample_bhk[bhk] = p

for bhk in [1, 2, 3]:
    sample = sample_bhk.get(bhk)
    if sample:
        pid = sample["id"]
        title = sample.get("title")
        balconies = sample.get("balconies")
        bathrooms = sample.get("bathrooms")
        print(f"\n==================================================")
        print(f"TESTING {bhk} BHK PROPERTY: ID {pid} - {title}")
        print(f"Database values -> BHK: {bhk}, Bathrooms: {bathrooms}, Balconies: {balconies}")

        wt_data = get_json(f"{BASE_URL}/properties/{pid}/walkthrough")
        rooms = wt_data.get("rooms", [])
        print(f"Total rooms returned: {len(rooms)}")
        room_names = [r["name"] for r in rooms]
        for idx, r in enumerate(rooms, 1):
            has_img = "[PHOTO]" if r.get("has_actual_image") else "[2.5D BLUEPRINT]"
            print(f"  {idx:02d}. {r['name']} ({r['type']}) -> {has_img}")

        # Strict Acceptance Verifications:
        if bhk == 1:
            assert "Master Bedroom" in room_names, "1 BHK must have Master Bedroom"
            assert "Bedroom 2" not in room_names, "1 BHK must NOT have Bedroom 2"
            assert "Bedroom 3" not in room_names, "1 BHK must NOT have Bedroom 3"
            print("  [PASS] 1 BHK room rules verified!")
        elif bhk == 2:
            assert "Master Bedroom" in room_names, "2 BHK must have Master Bedroom"
            assert "Bedroom 2" in room_names, "2 BHK must have Bedroom 2"
            assert "Bedroom 3" not in room_names, "2 BHK must NOT have Bedroom 3"
            print("  [PASS] 2 BHK room rules verified!")
        elif bhk == 3:
            assert "Master Bedroom" in room_names, "3 BHK must have Master Bedroom"
            assert "Bedroom 2" in room_names, "3 BHK must have Bedroom 2"
            assert "Bedroom 3" in room_names, "3 BHK must have Bedroom 3"
            assert "Bedroom 4" not in room_names, "3 BHK must NOT have Bedroom 4"
            print("  [PASS] 3 BHK room rules verified!")

        if balconies == 0:
            assert not any("Balcony" in r["name"] for r in rooms), "0 balcony property must NOT have Balcony room"
            print("  [PASS] 0 Balcony rule verified (No Balcony shown)!")
        elif balconies and balconies > 0:
            assert any("Balcony" in r["name"] for r in rooms), "Property with balconies must have Balcony room"
            print(f"  [PASS] {balconies} Balcony verified in rooms sequence!")

print("\nALL FINAL ACCEPTANCE TESTS PASSED!")
