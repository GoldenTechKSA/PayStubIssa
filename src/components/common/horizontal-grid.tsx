import React from "react";
import "../../index.css";
import { useDispatch } from "react-redux";
import { updateAppSettings } from "../../redux/actions";

export interface ImageFileData {
    id: number;
    imageFile: string;
    imageName: string;
    title: string;
    description: string;
}

type HorizontalGridProps = {
  updateIndex: (i: number) => void;
  // The current index is used to highlight the selected cell
  currentIndex: number;
  cells: ImageFileData[];
};

const HorizontalGrid: React.FC<HorizontalGridProps> = ({ updateIndex, currentIndex, cells }) => {
  const dispatch = useDispatch();

  const onCellClick = (event, id) => {
    updateIndex(id);
    event.preventDefault();
    dispatch(updateAppSettings({ templateId: id, nextTabStep: "template" }));
  };
  
  // Returns the image source path for a given image file name
  function getImageSrc(imageUrl: string): string {
    return `/images/${imageUrl}`;
  }

  return (
    <div className="horizontal-grid-container">
      <div className="horizontal-grid">
        {cells.map((cell) => cell.id <= 13 && (
          <div key={cell.id} className="grid-cell" onClick={e => onCellClick(e, cell.id)} role="button" tabIndex={currentIndex} >
            <img src={getImageSrc(cell.imageName)} alt={cell.description} />
            <p className="grid-description">{cell.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalGrid;
export type { HorizontalGridProps };
