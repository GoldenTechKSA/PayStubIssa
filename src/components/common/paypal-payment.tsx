import React, { useRef, useEffect } from "react";

// Business SandBox Account for Testing: sb-3cbdv6115562@business.example.com tTk9q7!<
// Personal SandBox Account used to test CC transations: sb-93etm6755470@personal.example.com H$%j4Cu)

const PayPal = () => {
    const paypal = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        window.paypal.Buttons({
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
                })
            },
            onApprove: async (data, actions) => {
                const order = await actions.order.capture().then(function(details){
                    alert("Transaction completed by" + details.payer.name.given_name);
                });
                console.log("Successful Order",order);
            },
            onError: (err) => {
                console.log(err);
            }
        }).render(paypal.current)
    }, [])

    return (
        <div className="no-print">
            <div ref={paypal} />
        </div>
    );
}

export default PayPal;