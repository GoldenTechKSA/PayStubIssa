import React from "react";
import "../../index.css";
import { useSelector, useDispatch } from "react-redux";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";
import { updateAppSettings } from "../../redux/actions";

type GridCell = {
  id: number;
  imageUrl: string;
  description: string;
};

type HorizontalGridProps = {
  cells: GridCell[];
};

const HorizontalGrid: React.FC<HorizontalGridProps> = ({ cells }) => {
  const { templateType } = useSelector<PayStubDetails, AppSettings>( state => state.appSettings);
  console.log("TemplateType in HorizontalGrid = ", templateType);
  const progressBarItems = [1, 2 ,3, 4, 5];
  const currentProgressStepIndex = templateType;
  const dispatch = useDispatch();

  const onCellClick = (id) => {
      // event.preventDefault();
      dispatch(updateAppSettings({ templateType: id, nextTabStep: "template" }));
      alert(`You clicked ${id}`);
  };
  
  // Returns the image source path for a given image file name
  function getImageSrc(imageUrl: string): string {
    console.log("ImageUrl in HorizontalGrid = ", imageUrl);
    return `/images/${imageUrl}`;
  }

  return (
    <div className="horizontal-grid-container">
      <div className="horizontal-grid">
        {cells.map((cell) => (
          <div key={cell.id} className="grid-cell" onClick={(e) => onCellClick(cell.id)} role="button" tabIndex={0} >
            <img src={getImageSrc(cell.imageUrl)} alt={`Item ${cell.id}`} />
            <p className="grid-description">{cell.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


export default HorizontalGrid;
export type { GridCell, HorizontalGridProps };
