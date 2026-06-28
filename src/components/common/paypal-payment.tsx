import React, { useRef, useEffect, useState } from "react";
import { Typography } from "@mui/material";

const PayPal = ({ onPaymentSuccess, onPaymentError }) => {
    const paypalRef = useRef<HTMLDivElement | null>(null);
    // Keep latest callbacks without re-running the (mount-once) render effect.
    const successRef = useRef(onPaymentSuccess);
    const errorRef = useRef(onPaymentError);
    successRef.current = onPaymentSuccess;
    errorRef.current = onPaymentError;

    const [sdkFailed, setSdkFailed] = useState(false);

    useEffect(() => {
        const container = paypalRef.current;
        if (!container) return;

        let cancelled = false;
        let buttons: any;
        let pollId: ReturnType<typeof setInterval> | undefined;
        let attempts = 0;

        const renderButtons = () => {
            if (cancelled || !container) return false;
            if (!window.paypal || !window.paypal.Buttons) return false; // SDK not ready yet

            buttons = window.paypal.Buttons({
                style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 48 },
                createOrder: (data, actions) => actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                        {
                            description: "Purchasing Paystub",
                            amount: { currency_code: "USD", value: 8.99 },
                        },
                    ],
                }),
                onApprove: async (data, actions) => {
                    const order = await actions.order.capture();
                    successRef.current(order);
                },
                onError: (err) => {
                    errorRef.current(err);
                },
            });
            buttons.render(container);
            return true;
        };

        // The SDK script in index.html may still be loading — render as soon as it's ready.
        if (!renderButtons()) {
            pollId = setInterval(() => {
                attempts += 1;
                if (renderButtons() || attempts > 50 /* ~10s */) {
                    if (pollId) clearInterval(pollId);
                    pollId = undefined;
                    if (attempts > 50 && !cancelled) setSdkFailed(true);
                }
            }, 200);
        }

        return () => {
            cancelled = true;
            if (pollId) clearInterval(pollId);
            try { buttons && buttons.close && buttons.close(); } catch { /* ignore */ }
            if (container) container.innerHTML = "";
        };
    }, []);

    return (
        <div className="no-print">
            <div ref={paypalRef} />
            {sdkFailed && (
                <Typography variant="body2" color="error">
                    The payment options could not be loaded. Please disable any ad/script blocker and refresh the page.
                </Typography>
            )}
        </div>
    );
};

export default PayPal;
