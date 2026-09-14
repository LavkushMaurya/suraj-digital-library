import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

export default async (request) => {

    // Allow browser requests
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
            seat,
            name,
            mobile,
            email,
            date,
            amount
        } = body;

        // Basic validation
        if (!seat || !name || !mobile || !date) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Name, mobile, seat and date are required."
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

        // Only our monthly plan is allowed
        if (Number(amount) !== 500) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Invalid booking amount."
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

        // Find the selected seat
        const { data: seatData, error: seatError } =
            await supabase
                .from("seats")
                .select("id, seat_number, status")
                .eq("seat_number", Number(seat))
                .single();

        if (seatError || !seatData) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Selected seat does not exist."
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        // Do not allow a manually blocked seat
        if (seatData.status === "booked") {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: `Seat ${seatData.seat_number} is already booked.`
                }),
                {
                    status: 409,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        /*
         * Monthly booking:
         * start_date = selected date
         * end_date   = one month later
         */
        const startDate = new Date(`${date}T00:00:00Z`);

        if (Number.isNaN(startDate.getTime())) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Invalid booking date."
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

        const endDate = new Date(startDate);
        endDate.setUTCMonth(endDate.getUTCMonth() + 1);

        const startDateString =
            startDate.toISOString().slice(0, 10);

        const endDateString =
            endDate.toISOString().slice(0, 10);

        // Check existing confirmed/active booking
        const { data: existingBooking, error: bookingCheckError } =
            await supabase
                .from("bookings")
                .select("id")
                .eq("seat_id", seatData.id)
                .in("booking_status", ["confirmed", "active"])
                .lt("start_date", endDateString)
                .gt("end_date", startDateString)
                .limit(1);

        if (bookingCheckError) {
            console.error(
                "Booking availability error:",
                bookingCheckError
            );

            throw new Error(
                "Unable to check seat availability."
            );
        }

        if (existingBooking && existingBooking.length > 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: `Seat ${seatData.seat_number} is already booked for these dates.`
                }),
                {
                    status: 409,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        // Generate booking number
        const bookingNumber =
            "SDL-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 7)
                .toUpperCase();

        // Create booking
        const { data: booking, error: insertError } =
            await supabase
                .from("bookings")
                .insert({
                    booking_number: bookingNumber,
                    student_name: name.trim(),
                    mobile: mobile.trim(),
                    email: email ? email.trim() : null,
                    seat_id: seatData.id,
                    plan: "monthly",
                    amount: 500,
                    start_date: startDateString,
                    end_date: endDateString,
                    payment_status: "pending",
                    booking_status: "pending"
                })
                .select(
                    "id, booking_number, seat_id, start_date, end_date, amount, payment_status, booking_status"
                )
                .single();

        if (insertError) {
            console.error(
                "Booking insert error:",
                insertError
            );

            throw new Error(
                "Unable to create booking."
            );
        }

        // Successful response
        return new Response(
            JSON.stringify({
                success: true,
                message: "Booking created successfully.",
                booking: booking
            }),
            {
                status: 201,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );

    } catch (error) {

        console.error(
            "Create booking error:",
            error
        );

        return new Response(
            JSON.stringify({
                success: false,
                message: "Server error while creating booking."
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