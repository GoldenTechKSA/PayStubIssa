import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Image, Carousel, Form, Row, Col } from "react-bootstrap";
import { NavigateNext } from '@material-ui/icons';
import { updateAppSettings } from "../../redux/actions";
import Picture0 from "../../assets/images/picture0.png";
import Picture1 from "../../assets/images/picture1.jpg";
import Picture2 from "../../assets/images/picture2.jpg";
import Picture3 from "../../assets/images/picture3.jpg";
import Picture4 from "../../assets/images/picture4.jpg";
import Picture5 from "../../assets/images/picture5.png";
import { StyledButton } from "../../constants/button-styles";

const TemplateSelection = () => {
    const [index, setIndex] = useState(0);
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
            <Row className="">
                <Carousel id="TemplateSelectionCarousel" activeIndex={index} onSelect={handleSelect} indicators={false} wrap={false} interval={null} prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon"/>} nextIcon={<span aria-hidden="true" className="carousel-control-next-icon"/>}>
                    {/** in the future change this static control list to array map templatePics.map(x, i) => */}
                    <Carousel.Item className="carousel-item">
                        <Image className="w-100 h-100 img-fluid" src={Picture0} />
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
                <Col>
                    <Form className="float-right" onSubmit={handleSubmit}>
                        <StyledButton endIcon={<NavigateNext />} type="submit">Go Next</StyledButton>
                    </Form>
                </Col>
            </Row>
        </Container>
    )
};

export default TemplateSelection;