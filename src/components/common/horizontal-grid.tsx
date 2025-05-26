import React from "react";
import "../../index.css";
import { useSelector } from "react-redux";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

type GridCell = {
  id: number;
  imageUrl: string;
  description: string;
};

type HorizontalGridProps = {
  cells: GridCell[]; // Array of cells (image + text)
  onCellClick: (cell: GridCell) => void; // Optional click handler for each cell
};

const HorizontalGrid: React.FC<HorizontalGridProps> = ({ cells, onCellClick }) => {
  const { templateType } = useSelector<PayStubDetails, AppSettings>( state => state.appSettings);
  const progressBarItems = [1, 2 ,3, 4, 5];
  const currentProgressStepIndex = templateType;
  return (
    <div className="horizontal-grid-container">
      <div className="horizontal-grid">
        {cells.map((cell) => (
          <div 
            key={cell.id}
            className="grid-cell"
            onClick={() => onCellClick(cell)} // Handle click
            role="button" // Accessibility
            tabIndex={0} // Make focusable
            onKeyDown={(e) => e.key === 'Enter' && onCellClick(cell)} // Keyboard support
          >
            <img 
              src={cell.imageUrl} 
              alt={`Item ${cell.id}`}
              className="grid-image"
            />
            <p className="grid-description">{cell.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


export default HorizontalGrid;
export type { GridCell, HorizontalGridProps };
