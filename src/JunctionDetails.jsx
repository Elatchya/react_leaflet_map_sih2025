// JunctionDetails.jsx
import React from "react";
import junctions from "./junctions.json";

export default function JunctionDetails({ id, onBack }) {
  const junction = junctions.find(j => j.id.toString() === id);

  if (!junction) return <h2 className="p-8">Junction not found</h2>;

  return (
    <div className="flex min-h-screen bg-[var(--background-color)] font-sans">
      <main className="flex-1">
        <header className="flex items-center justify-between h-16 px-8 border-b border-green-200 bg-[var(--secondary-color)]">
          <div className="flex items-center gap-3">
            <img
              src={require("./icons/odisha1.png")}
              alt="Odisha Logo"
              style={{ height: "40px", marginRight: "15px" }}
            />
            <h1 className="text-[var(--text-primary)] text-xl font-bold">
              Government of Odisha
            </h1>
          </div>
        </header>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              {junction.name} (JID-{junction.id})
            </h2>
          </div>

          {/* Junction Info */}
          <div className="bg-white rounded-lg shadow-sm border border-green-200 mb-8">
            <div className="px-6 py-4 border-b border-green-200">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Junction Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-green-200">
              <div className="p-6 bg-white">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Congestion Level
                </p>
                <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                  {junction.congestion}
                </p>
              </div>
              <div className="p-6 bg-white">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Latitude
                </p>
                <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                  {junction.lat}
                </p>
              </div>
              <div className="p-6 bg-white">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Longitude
                </p>
                <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                  {junction.lng}
                </p>
              </div>
            </div>
          </div>

          {/* IoT Devices */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Associated IoT Devices
            </h3>
            <div className="overflow-x-auto bg-white rounded-lg border border-green-200">
              <table className="min-w-full divide-y divide-green-200">
                <thead className="bg-[var(--secondary-color)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium">Device ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium">Current Signal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium">Signal Timer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-200">
                  {junction.iot.map(device => (
                    <tr key={device.iot_id}>
                      <td className="px-6 py-4 text-sm font-medium">{device.iot_id}</td>
                      <td className="px-6 py-4 text-sm font-medium">{device.current_signal}</td>
                      <td className="px-6 py-4 text-sm">{device.current_signal_timer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back Button */}
          <div className="fixed bottom-8 right-8">
            <button
              onClick={onBack}
              className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-800 shadow-lg"
            >
              ⬅ Back to Map
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
