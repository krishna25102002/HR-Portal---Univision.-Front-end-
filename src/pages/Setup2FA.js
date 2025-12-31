import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import '../pages/AnimationsAndStyles.css';

export default function Setup2FA() {
  const navigate = useNavigate();

  const qrCode = localStorage.getItem("qrCode");
  const manualKey = localStorage.getItem("manualKey");

  if (!qrCode) {
    return <div className="card">No QR code found</div>;
  }

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <h2>Set up Google Authenticator</h2>

      <p>Scan this QR code using Google Authenticator</p>

      {/* ✅ FIXED QR COMPONENT */}
      <QRCodeCanvas value={qrCode} size={200} />

      <p style={{ marginTop: 12, fontSize: 12, color: "#777" }}>
        Manual key (backup):<br />
        <strong>{manualKey}</strong>
      </p>

      <button
        style={{ marginTop: 20 }}
        onClick={() => navigate("/otp")}
      >
        I’ve scanned → Continue
      </button>
    </div>
  );
}
