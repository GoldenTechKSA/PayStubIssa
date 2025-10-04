import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Container, Image, Carousel, Row, Col, Button, Form } from "react-bootstrap";
import { updateAppSettings } from "../../redux/actions";
import { getImageSrc } from "../../utils/util";

const TemplateSelection = ({index, carouselImages}) => {
    const [currentIndex, setCurrentIndex] = useState<number>(index); // Initialize index with templateId
    const [enableCanPrint, setEnableCanPrint] = useState <boolean>(false);
    const dispatch = useDispatch();

    useEffect(() => {
      setCurrentIndex(index);
    }, [index]);
    
    const handleSelect = (i) => {
      setCurrentIndex(i);
    };
  
    const handleSubmit = (event) => {
        event.preventDefault();
        dispatch(updateAppSettings({ templateId: currentIndex, canPrint: enableCanPrint, nextTabStep: "company" }));
    };

    return (
        <Container>
            <Row  className="mt-1 mb-2">
                <h2>Select PayStub template to use:</h2>
            </Row>
            <Row className="mt-1 mb-2">
                <Carousel id="TemplateSelectionCarousel" activeIndex={currentIndex} onSelect={handleSelect} indicators={false} wrap={false} interval={null} prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon"/>} nextIcon={<span aria-hidden="true" className="carousel-control-next-icon"/>}>
                    { carouselImages.map((template, i) => (
                        <Carousel.Item key={i}>
                            <div className="template-carousel-content">
                                <Image src={getImageSrc(template.imageFile)} alt={template.title}/>
                                <Carousel.Caption className="carousel-title">{template.description}</Carousel.Caption>
                            </div>
                        </Carousel.Item>
                    ))}
                </Carousel>
                <Row className="justify-content-center mt-4 ">
                    <Form.Check type="checkbox" id="enableCheckBox" label="Enable Defaults for Company" className="mt-2 label_fontsize" checked={enableCanPrint} onChange={e => setEnableCanPrint(e.target.checked)}/>                        
                </Row>
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