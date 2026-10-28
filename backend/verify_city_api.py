import urllib.request
import urllib.parse
import json

cities_to_test = [
    "Pune", "Amravati", "Nagpur", "Mumbai", "Nashik", "Jaipur",
    "Bangalore", "Hyderabad", "Chennai", "Delhi NCR", "Ahmedabad",
    "Kolkata", "Surat", "Indore", "Bhopal", "Noida", "Gurgaon"
]

print("=== VERIFYING CITY-SPECIFIC PROPERTY ISOLATION ===")
all_passed = True
for city in cities_to_test:
    encoded_city = urllib.parse.quote(city)
    url = f"http://127.0.0.1:8000/api/properties?city={encoded_city}&limit=20"
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode('utf-8'))
        items = data.get("items", [])
        city_names = set(p["city"] for p in items)
        
        # Check strict city isolation
        wrong_cities = [c for c in city_names if c.lower() != city.lower()]
        if wrong_cities:
            print(f"[FAIL] {city}: Found properties from other cities: {wrong_cities}")
            all_passed = False
        else:
            print(f"[PASS] {city:12}: {len(items)} properties found. All belong strictly to '{city}'.")
    except Exception as e:
        print(f"[ERROR] testing {city}: {e}")
        all_passed = False

if all_passed:
    print("\nALL 17 CITIES TESTED: 100% STRICT CITY ISOLATION CONFIRMED!")
