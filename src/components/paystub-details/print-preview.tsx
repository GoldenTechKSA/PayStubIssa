import React, { useState, useEffect } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PayPal from "../common/paypal-payment";
import PDFDownloadButton from "../pdf/pdf-button-comp";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";
import { updateAppSettings } from "../../redux/actions";
import { telemetryService } from "../../services/telemetry-service";
import TemplateManager from "templates/components/templatemanager";
import store from "../../redux/store";

const PrintPreview = () => {
    const state: PayStubDetails = store.getState();
    const { templateId, canPrint } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    const [canPrintStub, setCanPrintStub] = useState(canPrint);
    const dispatch = useDispatch();
    const navigate = useNavigate();

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
                {/* Display the selected PAYSTUB template in a print preview format with watermark behind it */}
                <Col md={7}>
                    <TemplateManager id={templateId} store={state}/>
                </Col>
                {/* Display PAYPAL payment component and the print pdf option */}
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

export default PrintPreview;