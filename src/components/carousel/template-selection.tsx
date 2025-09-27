import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Container, Image, Carousel, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings } from "../../redux/actions";
import { ImageFileData } from "../../components/common/horizontal-grid";

const TemplateSelection = ({index}) => {
    const [currentIndex, setCurrentIndex] = useState<number>(index); // Initialize index with templateId
    const [payStubTemplates, setPayStubTemplates] = useState<ImageFileData[]>([]);
    const dispatch = useDispatch();

    useEffect(() => {
        // Fetch images name from the images folder
        fetch("/images/image-names.json")
            .then(res => res.json())
            .then((files: ImageFileData[]) => {
                setPayStubTemplates(
                    files.map((file, i) => ({
                        id: i,
                        imageFile: file.imageFile,
                        imageName: file.imageName,
                        title: file.title,
                        description: file.description,
                    }))
                );
            });
    }, []);    

    useEffect(() => {
      setCurrentIndex(index);
    }, [index]);
    
    const handleSelect = (i) => {
      setCurrentIndex(i);
    };
  
    const handleSubmit = (event) => {
        event.preventDefault();
        dispatch(updateAppSettings({ templateId: currentIndex, nextTabStep: "company" }));
    };

    // Returns the image source path for a given image file name
    function getImageSrc(imageUrl: string): string {
        return `/images/${imageUrl}`;
    }

    return (
        <Container>
            <Row  className="mt-1 mb-2">
                <h2>Select PayStub template to use:</h2>
            </Row>
            <Row className="remove-later-hero-block">
                <Carousel id="TemplateSelectionCarousel" activeIndex={currentIndex} onSelect={handleSelect} indicators={false} wrap={false} interval={null} prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon"/>} nextIcon={<span aria-hidden="true" className="carousel-control-next-icon"/>}>
                    { payStubTemplates.map((template, i) => (
                        <Carousel.Item className="carousel-item" key={i}>
                            <Image className="w-100 h-100 img-fluid" src={getImageSrc(template.imageFile)} />
                            <Carousel.Caption className="carousel-title">{template.description}</Carousel.Caption>
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