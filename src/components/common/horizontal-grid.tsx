import React from "react";
import "../../index.css";
import { useDispatch } from "react-redux";
import { updateAppSettings } from "../../redux/actions";
import { getImageSrc } from "../../utils/util";

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
  
  return (
    <div className="horizontal-grid-container">
      <div className="horizontal-grid">
        {cells.map((cell) => (
          <div key={cell.id} className={`grid-cell ${currentIndex === cell.id ? 'selected' : ''}`} onClick={e => onCellClick(e, cell.id)} role="button" tabIndex={0} >
            <div className="image-container">
              <img src={getImageSrc(cell.imageFile)} alt={cell.title} />
            </div>
            <div className="image-title">{cell.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalGrid;
export type { HorizontalGridProps };