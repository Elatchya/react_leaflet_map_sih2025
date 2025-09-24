import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random

# --- The Data Structure ---
# This dictionary holds the live state of our simulated traffic signal.
traffic_data = {
  "id": "t",
  "name": "Mylapore Signal",
  "lat": 13.0313,
  "lng": 80.2707,
  "congestion": "Low",
  "iot": [
    {"iot_id": "e_t_0", "current_signal": "Red", "vehicle_count": 0},
    {"iot_id": "e_t_1", "current_signal": "Red", "vehicle_count": 0},
    {"iot_id": "n_t_0", "current_signal": "Red", "vehicle_count": 0},
    {"iot_id": "n_t_1", "current_signal": "Red", "vehicle_count": 0},
    {"iot_id": "s_t_0", "current_signal": "Red", "vehicle_count": 0},
    {"iot_id": "s_t_1", "current_signal": "Red", "vehicle_count": 0},
    {"iot_id": "w_t_0", "current_signal": "Red", "vehicle_count": 0},
    {"iot_id": "w_t_1", "current_signal": "Red", "vehicle_count": 0}
  ]
}

# --- The Simulation Logic ---
async def simulate_traffic_flow():
    """
    This function runs in the background, continuously updating the traffic_data.
    It cycles through a realistic set of traffic phases.
    """
    # Define the green phases by the lane IDs that should be green.
    # This mimics the 8-phase system for a complex intersection.
    phases = [
        {"lanes": ["n_t_1", "s_t_1"], "duration": 10}, # 1. North/South Left Turns
        {"lanes": ["n_t_0", "s_t_0"], "duration": 20}, # 2. North/South Straight
        {"lanes": ["e_t_1", "w_t_1"], "duration": 10}, # 3. East/West Left Turns
        {"lanes": ["e_t_0", "w_t_0"], "duration": 20}, # 4. East/West Straight
    ]
    phase_index = 0

    while True:
        current_phase = phases[phase_index]
        green_lanes = current_phase["lanes"]
        
        # --- Update Signal States and Vehicle Counts ---
        total_vehicles = 0
        for device in traffic_data["iot"]:
            lane_id = device["iot_id"]
            # Set signal state
            if lane_id in green_lanes:
                device["current_signal"] = "Green"
                # Simulate more traffic for green lights
                device["vehicle_count"] = random.randint(5, 25)
            else:
                device["current_signal"] = "Red"
                # Simulate less traffic for red lights (some might be waiting)
                device["vehicle_count"] = random.randint(0, 15)
            
            total_vehicles += device["vehicle_count"]

        # --- Update Congestion Level ---
        if total_vehicles > 80:
            traffic_data["congestion"] = "High"
        elif total_vehicles > 40:
            traffic_data["congestion"] = "Medium"
        else:
            traffic_data["congestion"] = "Low"

        # Wait for the phase duration, allowing the API to respond in the meantime
        await asyncio.sleep(current_phase["duration"])
        
        # Move to the next phase
        phase_index = (phase_index + 1) % len(phases)


# --- The FastAPI Server ---
app = FastAPI()

# Add CORS middleware to allow your React app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # The origin of your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Starts the simulation task when the server starts up."""
    asyncio.create_task(simulate_traffic_flow())

@app.get("/api/traffic-data")
async def get_traffic_data():
    """The API endpoint that your frontend will call."""
    return traffic_data


