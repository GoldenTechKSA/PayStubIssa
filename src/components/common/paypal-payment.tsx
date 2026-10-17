import React, { useRef, useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { paymentsApi, PaymentsApiError, type Cart, type CapturedOrder, type OrderMeta } from "services/payments-api";
import { telemetry } from "services/telemetry-service";
import { T } from "telemetry/codes";

interface PayPalProps {
    /** What is being bought. The server prices it; the browser never sends an amount. */
    cart: Cart;
    /** Optional audit fields recorded with the order (attestation time, template). */
    meta?: OrderMeta;
    onPaymentSuccess: (result: CapturedOrder) => void;
    onPaymentError: (error: unknown) => void;
}

/**
 * Load the PayPal JS SDK once, using the client id the server reports, so the
 * browser is automatically on sandbox or live to match the server's credentials.
 */
let sdkPromise: Promise<void> | null = null;
function loadPayPalSdk(clientId: string, currency: string): Promise<void> {
    if (window.paypal && window.paypal.Buttons) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        const params = new URLSearchParams({ "client-id": clientId, currency, intent: "capture", components: "buttons" });
        script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
        script.async = true;
        script.onload = () => (window.paypal && window.paypal.Buttons ? resolve() : reject(new Error("PayPal SDK loaded without Buttons")));
        script.onerror = () => { sdkPromise = null; reject(new Error("PayPal SDK failed to load")); };
        document.head.appendChild(script);
    });
    return sdkPromise;
}

type Status = "loading" | "ready" | "failed";

const PayPal: React.FC<PayPalProps> = ({ cart, meta, onPaymentSuccess, onPaymentError }) => {
    const paypalRef = useRef<HTMLDivElement | null>(null);
    // Latest props without re-rendering the (mount-once) buttons: createOrder reads
    // these at click time, so changing the stub count is picked up for free.
    const cartRef = useRef(cart);
    const metaRef = useRef(meta);
    const successRef = useRef(onPaymentSuccess);
    const errorRef = useRef(onPaymentError);
    cartRef.current = cart;
    metaRef.current = meta;
    successRef.current = onPaymentSuccess;
    errorRef.current = onPaymentError;

    const [status, setStatus] = useState<Status>("loading");
    const [failure, setFailure] = useState<string>("");

    useEffect(() => {
        const container = paypalRef.current;
        if (!container) return;
        let cancelled = false;
        let buttons: any;

        (async () => {
            try {
                const config = await paymentsApi.getConfig();
                await loadPayPalSdk(config.clientId, config.currency);
                if (cancelled) return;

                buttons = window.paypal.Buttons({
                    style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 48 },

                    // The server quotes the cart and creates the PayPal order; we only relay its id.
                    createOrder: async () => {
                        const { orderId } = await paymentsApi.createOrder(cartRef.current, metaRef.current);
                        telemetry.emit(T.PAYMENT_ORDER_CREATED, { orderId });
                        return orderId;
                    },

                    // The server captures and verifies the amount, then issues the unlock token.
                    onApprove: async (data: any, actions: any) => {
                        telemetry.emit(T.PAYMENT_CAPTURE_STARTED, { orderId: data?.orderID ?? null });
                        try {
                            const result = await paymentsApi.captureOrder(data.orderID);
                            successRef.current(result);
                        } catch (err) {
                            // Buyer's funding source was declined: let PayPal offer another one.
                            if (err instanceof PaymentsApiError && err.code === "INSTRUMENT_DECLINED" && actions?.restart) {
                                return actions.restart();
                            }
                            errorRef.current(err);
                        }
                    },

                    onCancel: (data: any) => telemetry.emit(T.PAYMENT_CANCELLED, { orderId: data?.orderID ?? null }),

                    onError: (err: unknown) => errorRef.current(err),
                });

                if (!buttons.isEligible || buttons.isEligible()) {
                    await buttons.render(container);
                    if (!cancelled) setStatus("ready");
                } else {
                    throw new Error("PayPal is not available in this browser");
                }
            } catch (err) {
                if (cancelled) return;
                telemetry.emit(T.PAYMENT_BUTTONS_FAILED, { message: (err as any)?.message || String(err) });
                setStatus("failed");
                setFailure(
                    err instanceof PaymentsApiError
                        ? err.message
                        : "The payment options could not be loaded. Please disable any ad/script blocker and refresh the page.",
                );
            }
        })();

        return () => {
            cancelled = true;
            try { buttons && buttons.close && buttons.close(); } catch { /* ignore */ }
            if (container) container.innerHTML = "";
        };
    }, []);

    return (
        <div className="no-print">
            {status === "loading" && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">Loading secure checkout…</Typography>
                </Box>
            )}
            <div ref={paypalRef} />
            {status === "failed" && (
                <Typography variant="body2" color="error">{failure}</Typography>
            )}
        </div>
    );
};

export default PayPal;
