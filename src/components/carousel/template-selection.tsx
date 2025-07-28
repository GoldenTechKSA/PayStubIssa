import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Image, Carousel, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings } from "../../redux/actions";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

type GridCell = {
  id: number;
  imageUrl: string;
  caption: string;
};

const TemplateSelection = ({index}) => {
    const { templateId } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    const [currentIndex, setCurrentIndex] = useState(index); // Initialize index with templateId
    const [payStubTemplates, setPayStubTemplates] = useState<GridCell[]>([]);
    const dispatch = useDispatch();

    useEffect(() => {
        // Fetch images name from the images folder
        fetch("/images/image-names.json")
            .then(res => res.json())
            .then((files: string[]) => {
                setPayStubTemplates(
                    files.map((file, i) => ({
                        id: i,
                        imageUrl: file,
                        caption: `Issam Describe Item ${i}`,
                    }))
                );
            });
    }, []);    

    const handleSelect = (i) => {
      // console.log("TemplateSelection:handleSelect:index", i);
      setCurrentIndex(i);
    };
  
    const handleSubmit = (event) => {
        event.preventDefault();
        dispatch(updateAppSettings({ templateId: index, nextTabStep: "company" }));
        console.log("TemplateSelection:Submited template ID is:", index);
        console.log("moving to the next screen <Company Information>: (company)");
    };

    // Returns the image source path for a given image file name
    function getImageSrc(imageUrl: string): string {
        return `/images/${imageUrl}`;
    }

    useEffect(() => {
        if (typeof currentIndex === "number" && templateId !== currentIndex) {
            setCurrentIndex(index); // Ensure index is set to a valid number
        }
    }, [currentIndex, templateId]);
    
    return (
        <Container>
            <Row  className="mt-1 mb-2">
                <h2>Select PayStub template to use:</h2>
            </Row>
            <Row className="remove-later-hero-block">
                <Carousel id="TemplateSelectionCarousel" activeIndex={index} onSelect={handleSelect} indicators={false} wrap={false} interval={null} prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon"/>} nextIcon={<span aria-hidden="true" className="carousel-control-next-icon"/>}>
                    { payStubTemplates.map((template, i) => (
                        <Carousel.Item className="carousel-item" key={i}>
                            <Image className="w-100 h-100 img-fluid" src={getImageSrc(template.imageUrl)} />
                            <Carousel.Caption className="carousel-title">{template.caption}</Carousel.Caption>
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