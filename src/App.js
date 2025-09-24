import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import { Icon } from "leaflet";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";
import { useEffect, useState } from "react";

// --- MAPPING FROM SUMO LANES TO UI ---
// This is the critical link between your simulation and the display.
// It's based on the analysis of your 'single-intersection.net.xml'.
const LANE_TO_MOVEMENT_MAPPING = {
    'n_t_0': { direction: 'North', movement: 'Straight' },
    'n_t_1': { direction: 'North', movement: 'Left' },
    's_t_0': { direction: 'South', movement: 'Straight' },
    's_t_1': { direction: 'South', movement: 'Left' },
    'e_t_0': { direction: 'East', movement: 'Straight' },
    'e_t_1': { direction: 'East', movement: 'Left' },
    'w_t_0': { direction: 'West', movement: 'Straight' },
    'w_t_1': { direction: 'West', movement: 'Left' },
};


// --- UNCHANGED COMPONENTS ---
function Header() { /* ... Same as your code ... */ 
    return (
    <div style={{
      width: "100%", display: "flex", alignItems: "center", padding: "10px 20px",
      backgroundColor: "#b9f0ca", color: "#14532d", fontSize: "20px",
      fontWeight: "bold", boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
    }}>
      CitySync
    </div>
  );
}
const getIconByCongestion = (level) => { /* ... Same as your code ... */ 
  let color;
  if (level === "High") color = "red";
  else if (level === "Medium") color = "orange";
  else color = "green";

  return new Icon({
    iconUrl: require(`./icons/${color}.png`),
    iconSize: [30, 30],
  });
}
function AlertBox({ message, onClose, id, index }) { /* ... Same as your code ... */ 
    const navigate = useNavigate();
    const handleClick = () => { navigate(`/junction/${id}`); };
    return (
    <div onClick={handleClick} style={{
        position: "fixed", bottom: `${20 + index * 70}px`, right: "20px",
        backgroundColor: "#ff4d4d", color: "white", padding: "15px 20px",
        borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        fontWeight: "bold", zIndex: 1000, minWidth: "250px", cursor: "pointer"
      }}
    >
      <span>⚠ High Congestion detected at <u>{message}</u></span>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          marginLeft: "15px", background: "transparent", border: "1px solid white",
          color: "white", cursor: "pointer", borderRadius: "4px", padding: "2px 6px"
        }}
      > ✖ </button>
    </div>
  );
}

// --- MapPage COMPONENT (Navigation logic fixed) ---
function MapPage() {
  const navigate = useNavigate();
  const [junctionData, setJunctionData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/traffic-data');
        const data = await response.json();
        setJunctionData(data);
        if (data.congestion === "High") {
          setAlerts(prev => prev.find(a => a.id === data.id) ? prev : [...prev, { id: data.id, name: data.name }]);
        } else {
          setAlerts(prev => prev.filter(a => a.id !== data.id));
        }
      } catch (error) { console.error("Failed to fetch data:", error); }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const closeAlert = (id) => { setAlerts(prev => prev.filter(a => a.id !== id)); };

  if (!junctionData) {
    return ( <> <Header /> <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}><h2>Connecting to Simulation...</h2></div> </>);
  }

  return (
    <>
      <Header />
      <MapContainer center={[junctionData.lat, junctionData.lng]} zoom={17} className="leaflet-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker
          key={junctionData.id}
          position={[junctionData.lat, junctionData.lng]}
          icon={getIconByCongestion(junctionData.congestion)}
          eventHandlers={{ click: () => navigate(`/junction/${junctionData.id}`) }}
        >
          <Tooltip>
            <b>{junctionData.name}</b> <br />
            <b>Junction ID:</b> {junctionData.id} <br />
            <b>Congestion:</b> {junctionData.congestion}
          </Tooltip>
        </Marker>
      </MapContainer>
      {alerts.map((alert, index) => (
        <AlertBox key={alert.id} id={alert.id} message={alert.name} index={index} onClose={() => closeAlert(alert.id)} />
      ))}
    </>
  );
}

// --- NEW REUSABLE SignalCard COMPONENT ---
function SignalCard({ direction, junctionData }) {
    // Helper to find the data for a specific lane based on its real-world movement
    const getLaneData = (dir, mov) => {
        const laneId = Object.keys(LANE_TO_MOVEMENT_MAPPING).find(
            key => LANE_TO_MOVEMENT_MAPPING[key].direction === dir && LANE_TO_MOVEMENT_MAPPING[key].movement === mov
        );
        return junctionData.iot.find(d => d.iot_id === laneId) || { vehicle_count: 0, current_signal: 'Red' };
    };

    const leftData = getLaneData(direction, 'Left');
    const straightData = getLaneData(direction, 'Straight');
    // Your current sim does not have a dedicated right turn lane, so we handle this gracefully
    const rightData = { vehicle_count: 'N/A', current_signal: 'Red' }; 

    const totalVehicles = (leftData.vehicle_count || 0) + (straightData.vehicle_count || 0);

    // Dynamic class for the glowing effect on the lights
    const getLightClass = (data, color) => {
        const baseClass = `w-12 h-12 rounded-full`;
        if (data.current_signal.toLowerCase() === color) {
            if (color === 'red') return `${baseClass} bg-[var(--gov-red)] shadow-[0_0_15px_5px_var(--gov-red)]`;
            if (color === 'green') return `${baseClass} bg-[var(--gov-green)] shadow-[0_0_15px_5px_var(--gov-green)]`;
        }
        return `${baseClass} bg-gray-600`;
    };

    return (
        <div className="group bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 border-2 border-[var(--dark-green)]">
            <div className="p-6">
                <h4 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{direction}</h4>
                <div className="flex justify-center items-center my-6">
                    <div className="relative w-[192px] h-[208px]">
                        {/* Top Red/Amber Lights */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-36 bg-gray-800 rounded-lg flex flex-col justify-center items-center space-y-2 p-2">
                            <div className={getLightClass(leftData, 'red') + ' ' + getLightClass(straightData, 'red')}></div>
                            <div className="w-12 h-12 rounded-full bg-gray-600"></div> {/* Amber light (static for now) */}
                        </div>
                        {/* Bottom Arrow Lights */}
                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gray-800 rounded-lg flex justify-center items-center space-x-2 p-2">
                            <div className={`w-16 h-16 rounded-full text-white flex items-center justify-center ${getLightClass(leftData, 'green')}`}>
                                <span className="material-symbols-outlined text-5xl">arrow_back</span>
                            </div>
                            <div className={`w-16 h-16 rounded-full text-white flex items-center justify-center ${getLightClass(straightData, 'green')}`}>
                                <span className="material-symbols-outlined text-5xl">arrow_upward</span>
                            </div>
                            <div className={`w-16 h-16 rounded-full text-white flex items-center justify-center ${getLightClass(rightData, 'green')}`}>
                                <span className="material-symbols-outlined text-5xl">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 text-lg">
                    <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-2"><span className="material-symbols-outlined">directions_car</span> Vehicle Count:</span>
                    <span className="font-bold text-[var(--text-primary)]">{totalVehicles}</span>
                </div>
            </div>
        </div>
    );
}


// --- FULLY INTEGRATED JunctionDetails COMPONENT ---
function JunctionDetails() {
  const { id } = useParams();
  const [junction, setJunction] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/traffic-data');
        const data = await response.json();
        if (data.id === id) { setJunction(data); }
      } catch (error) { console.error("Failed to fetch junction details:", error); }
    };
    fetchDetails();
    const intervalId = setInterval(fetchDetails, 1000);
    return () => clearInterval(intervalId);
  }, [id]);

  if (!junction) { return ( <> <Header/> <h2>Loading Junction Details...</h2> </> ); }
  
  const getCongestionClass = (level) => {
    if (level === "High") return "text-[var(--gov-red)]";
    if (level === "Medium") return "text-[var(--gov-amber)]";
    return "text-[var(--gov-green)]";
  }

  return (
    <div className="bg-[var(--background-color)] min-h-screen" style={{fontFamily: '"Poppins", sans-serif'}}>
        <main className="flex-1">
            <header className="flex items-center justify-between h-20 px-8 bg-white shadow-md">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] ">Junction Dashboard</h1>
                  <span className="material-symbols-outlined text-4xl text-[var(--gov-green)]">traffic</span>
                </div>
            </header>
            <div className="p-5">
                <div className="max-w-full mx-auto">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Junction: {junction.name} (ID: {junction.id})</h2>
                    </div>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                       <div className="p-4 bg-white rounded-2xl shadow-lg">
                            <p className="text-sm font-semibold text-[var(--text-secondary)]">Junction Name</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{junction.name}</p>
                       </div>
                       <div className="p-4 bg-white rounded-2xl shadow-lg">
                            <p className="text-sm font-semibold text-[var(--text-secondary)]">Congestion Level</p>
                            <p className={`text-2xl font-bold ${getCongestionClass(junction.congestion)} mt-1`}>{junction.congestion}</p>
                       </div>
                       <div className="p-4 bg-white rounded-2xl shadow-lg">
                            <p className="text-sm font-semibold text-[var(--text-secondary)]">Latitude</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{junction.lat}</p>
                       </div>
                       <div className="p-4 bg-white rounded-2xl shadow-lg">
                            <p className="text-sm font-semibold text-[var(--text-secondary)]">Longitude</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{junction.lng}</p>
                       </div>
                    </div>
                    {/* Signal Cards */}
                    <div>
                        <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-6 text-center">Live Signal Status</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <SignalCard direction="North" junctionData={junction} />
                            <SignalCard direction="East" junctionData={junction} />
                            <SignalCard direction="South" junctionData={junction} />
                            <SignalCard direction="West" junctionData={junction} />
                        </div>
                    </div>
                </div>
            </div>
             <div className="fixed bottom-8 right-8">
                <button onClick={() => navigate('/')} className="bg-[var(--primary-color)] text-white px-6 py-4 rounded-full flex items-center gap-3 hover:bg-green-800 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined">map</span>
                    <span className="font-bold text-lg">Back to Map</span>
                </button>
            </div>
        </main>
    </div>
  );
}

// --- Main App Router ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/junction/:id" element={<JunctionDetails />} />
      </Routes>
    </Router>
  );
}