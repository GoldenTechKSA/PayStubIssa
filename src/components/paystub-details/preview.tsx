import React, { useState, useEffect } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PrintTemplate0 from "../print/template0/printTemplate0";
import PrintTemplate1 from "../print/template1/printTemplate1";
import PrintTemplate2 from "../print/template2/printTemplate2";
import PrintTemplate3 from "../print/template3/printTemplate3";
import PrintTemplate4 from "../print/template4/printTemplate4";
import PrintTemplate5 from "../print/template5/printTemplate5";
import PrintTemplate6 from "../print/template6/printTemplate6";
import PrintTemplate7 from "../print/template7/printTemplate7";
import PrintTemplate8 from "../print/template8/printTemplate8";
import PrintTemplate9 from "../print/template9/printTemplate9";
import PrintTemplate10 from "../print/template10/printTemplate10";
import PrintTemplate11 from "../print/template11/printTemplate11";
import PrintTemplate12 from "../print/template12/printTemplate12";
import PrintTemplate13 from "../print/template13/printTemplate13";
import PayPal from "../common/paypal-payment";
import PDFDownloadButton from "../pdf/pdf-button-comp";
import * as templateIds from "../../constants/template-ids";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";
import { updateAppSettings } from "../../redux/actions";
import { telemetryService } from "../../services/telemetry-service";
import TemplateManager from "templates/components/templatemanager";
import TemplateRegistry from "components3col/templateregistry";
import store from "../../redux/store";

const Preview = () => {
    const state = store.getState();
    const { templateId, canPrint } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    const [canPrintStub, setCanPrintStub] = useState(canPrint);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    console.log("store: in Preview Component", store, "CompanyInfo:", state);

    useEffect(() => {
        dispatch(updateAppSettings({ canPrint: canPrintStub }));
    }, [canPrintStub, dispatch]);

    const handlePaymentSuccess = (details: any) => {
        const newPayment: any = {
        id: details.id,
        amount: details.purchase_units[0].amount.value,
        currency: details.purchase_units[0].amount.currency_code,
        timestamp: new Date(),
        status: 'completed'
        };

        setCanPrintStub(true);
        
        // Telemetry event logging
        telemetryService.track("PaymentSuccess", {
            paymentId: newPayment.id,
            amount: newPayment.amount,
            currency: newPayment.currency,
            status: newPayment.status,
            timestamp: newPayment.timestamp.toISOString(),
            payer: details.payer?.email_address || undefined,
            paystubTemplate: templateId
        });    
    };

    const handlePaymentError = (error: any) => {
        // Telemetry event logging for payment errors
        telemetryService.track("PaymentError", {
            message: error?.message || String(error),
            code: error?.code || undefined,
            stack: error?.stack || undefined,
            timestamp: new Date().toISOString(),
            // Optionally add more context, e.g.:
            // attemptedAmount: ...,
            // userId: ...,
            // paystubTemplate: templateId
        });

        // Show a user notification here
        alert("There was an error processing your payment. Please try again.");
       };

    const printPaystub = () => {
        window.onafterprint = () => {
            // This runs after the print dialog is closed
            alert("Welcome back! You have returned from printing.");
            // You can also update state or navigate here
            navigate("/print-complete");
        };
        window.print();
    }
 
    return (
        < div className= "" >
            <Row className={ canPrintStub ? "mt-5" : "no-print mt-5"}>
                <Col md={7}>
                    <main>
                        <TemplateManager initialTemplateId="paystub_regular" allowEditing={false} onDataChange={(data) => {
                            console.log('Paystub data updated:', data);
                        }}/>
                    </main>

                    {/* { canPrint && (
                        <div>
                            { templateId === templateIds.PAYSTUB_TEMPLATE_0 && <TemplateRegistry store={state} id={templateId} canPrintStub={canPrintStub}/> }
                            { templateId === templateIds.PAYSTUB_TEMPLATE_1 && <TemplateRegistry store={state} id={templateId} canPrintStub={canPrintStub}/> }
                        </div>
                    )} */}
                </Col>
                <Col md={{span: 2, offset:1 }}>
                    <Row className="mb-3">
                        <PayPal onPaymentSuccess={handlePaymentSuccess} onPaymentError={handlePaymentError}/>
                    </Row>
                    { canPrintStub && (<Row className="no-print mb-3">
                        {/* Print Pay Stub Button*/}
                        <Button className="float-right mb-4" onClick={printPaystub} type="button">Print Paystub</Button>
                    </Row>)}
                    { canPrintStub && (<Row className="no-print mb-3">
                        <PDFDownloadButton targetId="pdf-content" fileName="my-document" buttonText="Export as PDF"/>
                    </Row>)}
                </Col>
            </Row>
        </div>
    );
}

export default Preview;