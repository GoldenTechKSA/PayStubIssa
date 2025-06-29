import React from 'react';

interface TickerBannerProps {
  message?: string;
  speed?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  height?: string;
}

const TickerBanner: React.FC<TickerBannerProps> = ({
  message = "Breaking News: This is a scrolling ticker banner message that continuously moves across the screen",
  speed = 50,
  backgroundColor = "#f8fafc",
  textColor = "#1e293b",
  fontSize = "16px",
  height = "60px"
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
    fontWeight: '500',
    color: textColor,
    animation: `scroll ${speed}s linear infinite`,
    paddingLeft: '100%'
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
        </div>
      </div>
    </>
  );
};

// Demo component showing different ticker variations
const SpecialPriceBanner: React.FC = () => {
  return (
    <div>
      <div>
        {/* Main Ticker */}
        <TickerBanner 
          message="🚨 BREAKING: New product launch announcement • Limited time offer: 50% off all items • Free shipping worldwide • Join thousands of satisfied customers"
          speed={40}
          backgroundColor="#fef3c7"
          textColor="#92400e"
          height="70px"
          fontSize="20px"
        />
      </div>
    </div>
  );
};

export default SpecialPriceBanner;