import React from 'react';
import { useNavigate } from "react-router-dom";

interface TickerBannerProps {
  message?: string;
  speed?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  height?: string;
  buttonText?: string;
  buttonColor?: string;
  onButtonClick?: () => void;
}

const TickerBanner: React.FC<TickerBannerProps> = ({
  message = "Breaking News: This is a scrolling ticker banner message that continuously moves across the screen",
  speed = 50,
  backgroundColor = "#f8fafc",
  textColor = "#1e293b",
  fontSize = "16px",
  height = "60px",
  buttonText = "Get Offer",
  buttonColor = "#2563eb",
  onButtonClick,
}) => {
  const tickerStyle: React.CSSProperties = {
    width: '100%',
    height: height,
    backgroundColor: backgroundColor,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '2px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const scrollingTextStyle: React.CSSProperties = {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    fontSize: fontSize,
    fontWeight: 500,
    color: textColor,
    animation: `scroll ${speed}s linear infinite`,
    paddingLeft: '100%',
    paddingRight: '2rem'
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-block',
    marginLeft: '2rem',
    padding: '0.5em 1.5em',
    fontSize: '1rem',
    fontWeight: 600,
    background: buttonColor,
    color: '#fff',
    border: 'none',
    borderRadius: '2em',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'background 0.2s'
  };

  const keyframes = `
    @keyframes scroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-100%);
      }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={tickerStyle}>
        <div style={scrollingTextStyle}>
          {message}
          <button style={buttonStyle} onClick={onButtonClick} tabIndex={0}>{buttonText}</button>
        </div>
      </div>
    </>
  );
};

const SpecialPriceBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div>
        {/* Main Ticker */}
        <TickerBanner 
          message="🚨 SPECIAL OFFER: Save more when you buy multiple paystubs! • Get 30% off your second paystub • Fast, secure, and accurate paystub generation • Trusted by thousands of satisfied customers"
          speed={40}
          backgroundColor="#fef3c7"
          textColor="#92400e"
          height="70px"
          fontSize="20px"
          buttonText="Get Started & Save"
          buttonColor="#16a34a"
          onButtonClick={() => navigate("/appBody")}
        />
      </div>
    </div>
  );
};

export default SpecialPriceBanner;