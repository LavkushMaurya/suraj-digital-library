/* ==========================================
   SURAJ DIGITAL LIBRARY
========================================== */

const TOTAL_SEATS = 20;

const SUPABASE_URL =
    "https://txynvqoiqrfwcpekgyzk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_1Yog7uDXq_2U0Uj63WvqAg_SldipMkc";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

let selectedSeat = null;

let bookedSeats = [];

let seatsData = [];


/* ==========================================
   PAGE LOAD
========================================== */
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadSeats();

        setupDate();
        setupPlan();
        setupMobileMenu();

        setupRealtimeSeats();

    }
);

let currentPosition = 0;

const track = document.querySelector(".study-track");


function moveSlide(direction) {

    if (direction === 1) {

        currentPosition -= 60;

        if (currentPosition < -160) {
            currentPosition = 0;
        }

    } else {

        currentPosition += 60;

        if (currentPosition > 0) {
            currentPosition = -160;
        }

    }

    track.style.transform =
        `translateX(${currentPosition}px)`;
}


/* Auto scroll */

setInterval(() => {

    moveSlide(1);

}, 2500);


/* ==========================================
   CREATE SEATS
========================================== */

function createSeats() {

    const left =
        document.getElementById(
            "leftSeats"
        );

    const right =
        document.getElementById(
            "rightSeats"
        );

    left.innerHTML = "";
    right.innerHTML = "";


    seatsData.forEach(seatData => {

        const number =
            seatData.seat_number;

        const button =
            document.createElement(
                "button"
            );

        button.className = "seat";

        button.dataset.seat = number;


        if (
            seatData.status === "booked"
        ) {

            button.classList.add(
                "booked"
            );

            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-lock"></i>

                <strong>
                    Seat ${formatSeat(number)}
                </strong>

                <small>
                    BOOKED
                </small>
            `;

        }

        else {

            button.classList.add(
                "available"
            );

            button.innerHTML = `
                <i class="fa-solid fa-chair"></i>

                <strong>
                    Seat ${formatSeat(number)}
                </strong>

                <small>
                    AVAILABLE
                </small>
            `;

            button.addEventListener(
                "click",
                () => selectSeat(number)
            );

        }


        if (number <= 10) {

            left.appendChild(button);

        }

        else {

            right.appendChild(button);

        }

    });

    updateSeatCount();

}


/* ==========================================
   LOAD SEATS FROM SUPABASE
========================================== */

async function loadSeats() {

    const {
        data,
        error
    } = await supabaseClient
        .from("seats")
        .select("*")
        .order(
            "seat_number",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Supabase seat error:",
            error
        );

        alert(
            "Unable to load seats. Please try again."
        );

        return;

    }


    seatsData = data || [];

    createSeats();

}


/* ==========================================
   REAL-TIME SEAT UPDATES
========================================== */

function setupRealtimeSeats() {

    supabaseClient
        .channel("seats-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "seats"
            },
            payload => {

                console.log(
                    "Seat update:",
                    payload
                );

                loadSeats();

            }
        )
        .subscribe();

}

/* ==========================================
   SELECT SEAT
========================================== */
function selectSeat(number) {

    const seatData =
        seatsData.find(
            seat =>
                seat.seat_number === number
        );


    if (
        !seatData ||
        seatData.status === "booked"
    ) {

        return;

    }


    document
        .querySelectorAll(
            ".seat.selected"
        )
        .forEach(seat => {

            seat.classList.remove(
                "selected"
            );

            seat.classList.add(
                "available"
            );

        });


    selectedSeat = number;


    const seat =
        document.querySelector(
            `.seat[data-seat="${number}"]`
        );


    if (seat) {

        seat.classList.remove(
            "available"
        );

        seat.classList.add(
            "selected"
        );

    }


    document.getElementById(
        "selectedSeat"
    ).textContent =
        "Seat " +
        formatSeat(number);


    document.getElementById(
        "bookSeatBtn"
    ).disabled = false;

}


/* ==========================================
   OPEN BOOKING
========================================== */

document.getElementById(
    "bookSeatBtn"
).addEventListener(
    "click",
    () => {

        if (!selectedSeat) {

            return;

        }


        document.getElementById(
            "modalSeat"
        ).textContent =
            "Seat " +
            formatSeat(selectedSeat);


        document.getElementById(
            "bookingModal"
        ).classList.add(
            "show"
        );

    }
);


/* ==========================================
   DATE
========================================== */

function setupDate() {

    const date =
        document.getElementById(
            "bookingDate"
        );


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    date.min = today;

    date.value = today;

}


/* ==========================================
   PLAN
========================================== */

function setupPlan() {

    document.getElementById(
        "plan"
    ).addEventListener(
        "change",
        function () {

            document.getElementById(
                "amount"
            ).textContent =
                "₹" +
                (this.value || 0);

        }
    );

}


/* ==========================================
   BOOKING FORM
========================================== */

document.getElementById(
    "bookingForm"
).addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const name =
            document.getElementById(
                "studentName"
            ).value.trim();


        const mobile =
            document.getElementById(
                "studentMobile"
            ).value.trim();


        const date =
            document.getElementById(
                "bookingDate"
            ).value;


        const plan =
            document.getElementById(
                "plan"
            );


        const amount =
            Number(plan.value);


        if (
            !name ||
            !mobile ||
            !date ||
            !amount
        ) {

            alert(
                "Please fill all required fields."
            );

            return;

        }


        if (
            !/^[0-9]{10}$/.test(
                mobile
            )
        ) {

            alert(
                "Please enter a valid mobile number."
            );

            return;

        }


        window.pendingBooking = {

            seat: selectedSeat,

            name: name,

            mobile: mobile,

            date: date,

            amount: amount

        };


        document.getElementById(
            "bookingModal"
        ).classList.remove(
            "show"
        );


        openPayment();

    }
);


/* ==========================================
   PAYMENT
========================================== */

function openPayment() {

    const booking =
        window.pendingBooking;


    document.getElementById(
        "paymentSeat"
    ).textContent =
        "Seat " +
        formatSeat(
            booking.seat
        );


    document.getElementById(
        "paymentAmount"
    ).textContent =
        "₹" +
        booking.amount;


    document.getElementById(
        "payAmount"
    ).textContent =
        "₹" +
        booking.amount;


    document.getElementById(
        "paymentModal"
    ).classList.add(
        "show"
    );

}


/* ==========================================
   DEMO PAYMENT
========================================== */
async function completePayment() {

    const booking = window.pendingBooking;

    if (!booking) {
        alert("Booking information is missing.");
        return;
    }

    try {

        // STEP 1: Create booking in our backend
        const bookingResponse = await fetch(
            "https://suraj-digital.netlify.app/.netlify/functions/create-booking",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    seat: booking.seat,
                    name: booking.name,
                    mobile: booking.mobile,
                    email: booking.email || "",
                    date: booking.date,
                    amount: booking.amount
                })
            }
        );

        const bookingResult =
            await bookingResponse.json();

        console.log(
            "Booking response:",
            bookingResult
        );

        if (
            !bookingResponse.ok ||
            !bookingResult.success
        ) {

            alert(
                bookingResult.message ||
                "Unable to create booking."
            );

            return;
        }

        const bookingNumber =
            bookingResult.booking.booking_number;


        // STEP 2: Create Razorpay order
        const orderResponse = await fetch(
            "https://suraj-digital.netlify.app/.netlify/functions/create-order",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    bookingNumber: bookingNumber,
                    amount: booking.amount
                })
            }
        );

        const orderResult =
            await orderResponse.json();

        console.log(
            "Razorpay order response:",
            orderResult
        );

        if (
            !orderResponse.ok ||
            !orderResult.success
        ) {

            alert(
                orderResult.message ||
                "Unable to create payment order."
            );

            return;
        }


        // STEP 3: Open Razorpay Checkout
        // UPI ONLY

        const options = {

            key: "rzp_test_Tbpu9ZZFWUWbsm",

            amount:
                orderResult.order.amount,

            currency:
                orderResult.order.currency,

            name:
                "Suraj Digital Library",

            description:
                "Monthly Library Seat Booking",

            order_id:
                orderResult.order.id,

            prefill: {

                name:
                    booking.name,

                contact:
                    booking.mobile,

                email:
                    booking.email || ""
            },

            notes: {

                booking_number:
                    bookingNumber,

                seat:
                    String(booking.seat)
            },

            theme: {

                color: "#1f4f8f"
            },

            // SHOW ONLY UPI
            config: {

                display: {

                    blocks: {

                        upi_only: {

                            name: "Pay via UPI",

                            instruments: [

                                {
                                    method: "upi"
                                }

                            ]

                        }

                    },

                    sequence: [
                        "block.upi_only"
                    ],

                    preferences: {

                        show_default_blocks: false

                    }

                }

            },

            handler: function (paymentResponse) {

                console.log(
                    "Razorpay payment response:",
                    paymentResponse
                );

                alert(
                    "Payment completed.\n\n" +
                    "Payment ID: " +
                    paymentResponse.razorpay_payment_id +
                    "\n\n" +
                    "Payment verification will be connected next."
                );

            },

            modal: {

                ondismiss: function () {

                    console.log(
                        "Razorpay checkout closed."
                    );

                }
            }
        };


        const razorpay =
            new Razorpay(options);

        razorpay.open();


    } catch (error) {

        console.error(
            "Payment error:",
            error
        );

        alert(
            "Unable to connect to the payment server. Please try again."
        );
    }
}

/* ==========================================
   COUNTERS
========================================== */

function updateSeatCount() {

    const total =
        seatsData.length;

    const booked =
        seatsData.filter(
            seat =>
                seat.status === "booked"
        ).length;

    const available =
        total - booked;


    document.getElementById(
        "totalSeats"
    ).textContent =
        total || TOTAL_SEATS;


    document.getElementById(
        "availableSeats"
    ).textContent =
        available;


    document.getElementById(
        "bookedSeats"
    ).textContent =
        booked;

}


/* ==========================================
   SERVICE MODAL
========================================== */

function openServices() {

    document.getElementById(
        "serviceModal"
    ).classList.add(
        "show"
    );

}


function closeServices() {

    document.getElementById(
        "serviceModal"
    ).classList.remove(
        "show"
    );

}


/* ==========================================
   MODAL CLOSE
========================================== */

function closeBooking() {

    document.getElementById(
        "bookingModal"
    ).classList.remove(
        "show"
    );

}


function closePayment() {

    document.getElementById(
        "paymentModal"
    ).classList.remove(
        "show"
    );

}


function closeSuccess() {

    document.getElementById(
        "successModal"
    ).classList.remove(
        "show"
    );

}


/* ==========================================
   MOBILE MENU
========================================== */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenu"
        );


    const nav =
        document.getElementById(
            "navbarMenu"
        );


    button.addEventListener(
        "click",
        () => {

            if (
                nav.style.display === "flex"
            ) {

                nav.style.display =
                    "none";

            }

            else {

                nav.style.display =
                    "flex";

                nav.style.position =
                    "absolute";

                nav.style.top =
                    "68px";

                nav.style.left =
                    "0";

                nav.style.width =
                    "100%";

                nav.style.background =
                    "#076fdc";

                nav.style.flexDirection =
                    "column";

                nav.style.padding =
                    "20px";

            }

        }
    );

}


/* ==========================================
   HELPERS
========================================== */

function formatSeat(number) {

    return String(number)
        .padStart(2, "0");

}


function formatDate(date) {

    return new Date(
        date + "T00:00:00"
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}