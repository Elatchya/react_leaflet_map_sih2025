import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import { Icon } from "leaflet";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams
} from "react-router-dom";
import { useEffect, useState } from "react";  
import junctions from "./junctions.json";

function Header() {
  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#b9f0ca",
      color: "#14532d",
      fontSize: "20px",
      fontWeight: "bold",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
    }}>
      <img 
        src={require("./icons/odisha1.png")}
        alt="Odisha Logo"
        style={{ height: "40px", marginRight: "15px" }}
      />
      Government of Odisha
    </div>
  );
}

const getIconByCongestion = (level) => {
  let color;
  if (level === "High") color = "red";
  else if (level === "Medium") color = "orange";
  else color = "green";

  return new Icon({
    iconUrl: require(`./icons/${color}.png`),
    iconSize: [30, 30],
  });
};

// ✅ Custom alert popup component
function AlertBox({ message, onClose, index }) {
  return (
    <div style={{
      position: "fixed",
      bottom: `${20 + index * 70}px`, // stack alerts with gap
      right: "20px",
      backgroundColor: "#ff4d4d",
      color: "white",
      padding: "15px 20px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      fontWeight: "bold",
      zIndex: 1000,
      minWidth: "250px"
    }}>
      {message}
      <button 
        onClick={onClose} 
        style={{
          marginLeft: "15px",
          background: "transparent",
          border: "1px solid white",
          color: "white",
          cursor: "pointer",
          borderRadius: "4px",
          padding: "2px 6px"
        }}
      >
        ✖
      </button>
    </div>
  );
}

function MapPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // ✅ Find all high congestion junctions
    const highCongestions = junctions.filter(j => j.congestion === "High");
    setAlerts(highCongestions.map(j => ({
      id: j.id,
      message: `⚠ High Congestion detected at ${j.name}`
    })));
  }, []);

  const closeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <>
      <Header />
      <MapContainer center={[13.0827, 80.2707]} zoom={12} className="leaflet-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {junctions.map((junction) => (
          <Marker
            key={junction.id}
            position={[junction.lat, junction.lng]}
            icon={getIconByCongestion(junction.congestion)}
            eventHandlers={{
              click: () => {
                window.location.href = `/junction_details.html?id=${junction.id}`;
              },
            }}
          >

            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <b>{junction.name}</b> <br />
              <b>Junction ID:</b> {junction.id} <br />
              <b>Congestion:</b> {junction.congestion} <br />
              <b>Vehicles count:</b> {junction.vehicle_count}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* ✅ Show separate alerts */}
      {alerts.map((alert, index) => (
        <AlertBox 
          key={alert.id} 
          message={alert.message} 
          index={index}
          onClose={() => closeAlert(alert.id)} 
        />
      ))}
    </>
  );
}

function JunctionDetails({ id }) {
  const junction = junctions.find((j) => j.id.toString() === id);

  if (!junction) return <h2>Junction not found</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{junction.name}</h2>
      <p><b>Junction ID:</b> {junction.id}</p>
      <p><b>Congestion Level:</b> {junction.congestion}</p>
      <p><b>Vehicle count:</b> {junction.vehicle_count}</p>
      <p><b>Latitude:</b> {junction.lat}</p>
      <p><b>Longitude:</b> {junction.lng}</p>
      {junction.iot.map((device) => (
        <div key={device.iot_id}>
          <p><b>IoT ID:</b> {device.iot_id}</p>
          <p><b>Current Signal: </b>{device.current_signal}</p>
          <p><b>Current Signal Timer: </b>{device.current_signal_timer}</p>
        </div>
      ))}
    </div>
  );
}



export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
      </Routes>
    </Router>
  );
}
