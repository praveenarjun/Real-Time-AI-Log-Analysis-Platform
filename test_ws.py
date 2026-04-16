import asyncio
import websockets

async def test():
    try:
        async with websockets.connect("wss://back.praveen-challa.tech/api/v1/ws/stream") as ws:
            print("Connected!")
            import time
            start = time.time()
            while time.time() - start < 10:
                msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                print(f"Received: {msg[:100]}...")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
