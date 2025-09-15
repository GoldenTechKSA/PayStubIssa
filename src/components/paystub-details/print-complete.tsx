import React from "react";
import { Button } from "react-bootstrap";

const PrintComplete: React.FC = () => (
  <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
    <h2 className="mb-4">Printing Complete</h2>
    <p className="lead mb-4">
      You have successfully printed your paystub.<br />
      You may now safely close this browser window or tab.
    </p>
    <Button
      variant="secondary"
      onClick={() => {
        window.close();
        // If window.close() fails, show a message
        setTimeout(() => {
          alert("If this tab did not close automatically, please close it manually.");
        }, 200);
      }}
    >
      Close Window
    </Button>
  </div>
);

export default PrintComplete;