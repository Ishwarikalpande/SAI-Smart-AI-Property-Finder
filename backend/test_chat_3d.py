import sys
import asyncio
from app.db.session import SessionLocal
from app.ai.chat_service import process_chat_message

db = SessionLocal()

queries = [
    "Show me 3 BHK flats on higher floors.",
    "I want an east-facing flat.",
    "Show available flats on 20th floor.",
    "Which flats have balconies facing east?",
    "Show me the cheapest 2 BHK available.",
    "Open Flat 20-C."
]

for q in queries:
    res = asyncio.run(process_chat_message(db, q))
    print(f"QUERY: {q}")
    print(f"  Intent: {res.get('intent')}")
    print(f"  Properties/Units count: {len(res.get('properties', []))}")
    msg = res.get('message', '').encode('ascii', errors='replace').decode('ascii')
    print(f"  Message: {msg[:180]}...")
    if 'action' in res:
        print(f"  Action: {res.get('action')}")
    if 'target_unit' in res:
        print(f"  Target Unit: {res.get('target_unit')}")
    print("-" * 50)

db.close()
