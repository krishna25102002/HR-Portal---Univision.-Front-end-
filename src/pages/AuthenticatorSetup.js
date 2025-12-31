export default function AuthenticatorSetup({ manualKey, setAuthStep }) {
  return (
    <div>
      <h3>Setup Authenticator</h3>
      <p>Add this key in Google Authenticator:</p>
      <b>{manualKey}</b>
      <button onClick={() => setAuthStep("otp")}>
        I have added
      </button>
    </div>
  );
}
