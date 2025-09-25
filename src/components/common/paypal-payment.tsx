import React, { useRef, useEffect } from "react";

const PayPal = ({ onPaymentSuccess, onPaymentError }) => {
    const paypal = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Capture the current ref value
        const paypalContainer = paypal.current;

        // Render PayPal Buttons
        const buttons = window.paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                        {
                            description: "Purchasing Paystub",
                            amount: {
                                currency_code: "USD",
                                value: 8.99
                            }
                        }
                    ]
                });
            },
            onApprove: async (data, actions) => {
                const order = await actions.order.capture();
                onPaymentSuccess(order);
                console.log("Successful Order", order);
            },
            onError: (err) => {
                onPaymentError(err);
                console.log(err);
            }
        });

        if (paypalContainer) {
            buttons.render(paypalContainer);
        }

        // Cleanup: use the captured ref value
        return () => {
            buttons.close && buttons.close();
            if (paypalContainer) {
                paypalContainer.innerHTML = "";
            }
        };
    }, [onPaymentSuccess, onPaymentError]);

    return (
        <div className="no-print">
            <div ref={paypal} />
        </div>
    );
};

export default PayPal;