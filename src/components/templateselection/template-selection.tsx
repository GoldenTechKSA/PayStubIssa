import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Image, Carousel, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings } from "../../redux/actions";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";
import Picture1 from "../../assets/images/picture1.png";
import Picture2 from "../../assets/images/picture2.png";
import Picture3 from "../../assets/images/picture3.png";
import Picture4 from "../../assets/images/picture4.png";
import Picture5 from "../../assets/images/picture5.png";
import Picture6 from "../../assets/images/picture6.png";

const TemplateSelection = () => {
    const { templateType } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    console.log("Template Index from the Grid = ", templateType);

    const [index, setIndex] = useState(templateType || 0); // Initialize index with templateType or default to 0
    const dispatch = useDispatch();
  
    const handleSelect = (i) => {
      console.log("Carousel current Index", i);
      setIndex(i);
    };
  
    const handleSubmit = (event) => {
        console.log("Moving to next step with index = ", index);
        event.preventDefault();
        dispatch(updateAppSettings({ templateType: index, nextTabStep: "company" }));
    };
    
    return (
        <Container className="m-0 p-0 no-gutters">
            <Row  className="mt-4 mb-3">
                <h2>Select PayStub template to use:</h2>
            </Row>
            <Row className="hero-block">
                <Carousel id="TemplateSelectionCarousel" activeIndex={index} onSelect={handleSelect} indicators={false} wrap={false} interval={null} prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon"/>} nextIcon={<span aria-hidden="true" className="carousel-control-next-icon"/>}>
                    {/** in the future change this static control list to array map templatePics.map(x, i) => */}
                    <Carousel.Item className="carousel-item">
                        <Image className="w-100 h-100 img-fluid" src={Picture6} />
                        <Carousel.Caption className="" style={{color: "red"}}>Add caption if needed here!</Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item>
                        <Image className="w-100 h-100 img-fluid" src={Picture1} />
                        <Carousel.Caption className="" style={{color: "red"}}>Add caption if needed here!</Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item>
                        <Image className="w-100 h-100 img-fluid" src={Picture2} />
                        <Carousel.Caption className="" style={{color: "red"}}>Add caption if needed here!</Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item>
                        <Image className="w-100 h-100 img-fluid" src={Picture3} />
                        <Carousel.Caption  className="" style={{color: "red"}}>Add caption if needed here!</Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item>
                        <Image className="w-100 h-100 img-fluid" src={Picture4} />
                        <Carousel.Caption  className="" style={{color: "red"}}>Add caption if needed here!</Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item>
                        <Image className="w-100 h-100 img-fluid" src={Picture5} />
                        <Carousel.Caption className="" style={{color: "red"}}>Add caption if needed here!</Carousel.Caption>
                    </Carousel.Item>
                </Carousel>
            </Row>
            <Row className="w-100 justify-content-end row-relative">
                <Col className="mx-4">
                    <Button className="float-right" onClick={handleSubmit} type="submit">Save & Continue</Button>
                </Col>
            </Row>
        </Container>
    )
};

export default TemplateSelection;