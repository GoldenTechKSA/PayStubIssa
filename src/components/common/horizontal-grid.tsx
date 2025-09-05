import React, {useEffect} from "react";
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
  // The current index is used to highlight the selected cell
  currentIndex: number;
  cells: GridCell[];
};

const HorizontalGrid: React.FC<HorizontalGridProps> = ({ currentIndex, cells }) => {
  const { templateId } = useSelector<PayStubDetails, AppSettings>( state => state.appSettings);
  const dispatch = useDispatch();
//  console.log(`3 HorizontalGrid:templateId= ${templateId}, coming from userSelector call = ${currentIndex}`);

  const onCellClick = (event, id) => {
      event.preventDefault();
      dispatch(updateAppSettings({ templateId: id, nextTabStep: "template" }));
  };
  
  // Returns the image source path for a given image file name
  function getImageSrc(imageUrl: string): string {
    // console.log("ImageUrl in HorizontalGrid = ", imageUrl);
    return `/images/${imageUrl}`;
  }

  return (
    <div className="horizontal-grid-container">
      <div className="horizontal-grid">
        {cells.map((cell) => (
          <div key={cell.id} className="grid-cell" onClick={e => onCellClick(e, cell.id)} role="button" tabIndex={0} >
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
