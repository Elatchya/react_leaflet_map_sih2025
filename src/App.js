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
import junctions from "./junctions.json";
import odishaLogo from "./icons/odisha.png";

function Header() {
  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#004080",
      color: "white",
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

function MapPage() {
  const navigate = useNavigate();

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
            click: () => navigate(`/junction/${junction.id}`), // 👈 go to details page
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

// ✅ Wrapper for Details Page (to read params)
function JunctionDetailsWrapper() {
  const { id } = useParams();
  return <JunctionDetails id={id} />;
}

// ✅ App Component (Router Setup)
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/junction/:id" element={<JunctionDetailsWrapper />} />
      </Routes>
    </Router>
  );
}
