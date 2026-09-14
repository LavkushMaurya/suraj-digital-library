import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default async (request) => {

    // Allow browser preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    }

    // Only POST is allowed
    if (request.method !== "POST") {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Only POST requests are allowed."
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );
    }

    try {

        const body = await request.json();

        const {
            bookingNumber,
            amount
        } = body;

        // Basic validation
        if (!bookingNumber) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Booking number is required."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        // Only ₹500 is allowed
        if (Number(amount) !== 500) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Invalid payment amount."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        // Razorpay amount is in paise
        const options = {
            amount: 50000,
            currency: "INR",
            receipt: bookingNumber,
            notes: {
                booking_number: bookingNumber
            }
        };

        const order = await razorpay.orders.create(options);

        return new Response(
            JSON.stringify({
                success: true,
                order: {
                    id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    receipt: order.receipt
                }
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );

    } catch (error) {

        console.error(
            "Create Razorpay order error:",
            error
        );

        return new Response(
            JSON.stringify({
                success: false,
                message: "Unable to create Razorpay order."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );
    }
};