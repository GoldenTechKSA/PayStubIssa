import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Image, Carousel, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings } from "../../redux/actions";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

type GridCell = {
  id: number;
  imageUrl: string;
  caption: string;
};

const TemplateSelection = () => {
    const { templateId } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    console.log("Template Index from the Grid = ", templateId);

    const payStubTemplates: GridCell[] = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        imageUrl: `picture${i + 1}.png`,
        caption: `Item ${i + 1}`,
    }));

    const [index, setIndex] = useState(templateId || 0); // Initialize index with templateId or default to 0
    const dispatch = useDispatch();
  
    const handleSelect = (i) => {
      console.log("Carousel current Index", i);
      setIndex(i);
    };
  
    const handleSubmit = (event) => {
        console.log("Moving to next step with index = ", index);
        event.preventDefault();
        dispatch(updateAppSettings({ templateId: index, nextTabStep: "company" }));
    };

    // Returns the image source path for a given image file name
    function getImageSrc(imageUrl: string): string {
        return `/images/${imageUrl}`;
    }
    
    console.log("Carousel index = ", index);
    return (
        <Container>
            <Row  className="mt-4 mb-3">
                <h2>Select PayStub template to use:</h2>
            </Row>
            <Row className="hero-block">
                <Carousel id="TemplateSelectionCarousel" activeIndex={index} onSelect={handleSelect} indicators={false} wrap={false} interval={null} prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon"/>} nextIcon={<span aria-hidden="true" className="carousel-control-next-icon"/>}>
                    { payStubTemplates.map((template, i) => (
                        <Carousel.Item className="carousel-item" key={i}>
                            <Image className="w-100 h-100 img-fluid" src={getImageSrc(template.imageUrl)} />
                            <Carousel.Caption className="" style={{ color: "red" }}>{template.caption}</Carousel.Caption>
                        </Carousel.Item>
                    ))}
                </Carousel>
                <Row className="justify-content-center mt-4 ">
                    <Col xs={12} sm={6} md={4} lg={3} className="d-flex justify-content-center">
                        <Button onClick={handleSubmit} type="submit">Save & Continue</Button>
                    </Col>
                </Row>
            </Row>
        </Container>
    )
};

export default TemplateSelection;