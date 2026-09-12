/* ==========================================
   SURAJ DIGITAL LIBRARY
========================================== */

const TOTAL_SEATS = 20;

let selectedSeat = null;

let bookedSeats =
    JSON.parse(
        localStorage.getItem(
            "surajLibrarySeats"
        )
    ) || [];


/* ==========================================
   PAGE LOAD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createSeats();

        updateSeatCount();

        setupDate();

        setupPlan();

        setupMobileMenu();

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


    for (
        let i = 1;
        i <= TOTAL_SEATS;
        i++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "seat";


        button.dataset.seat =
            i;


        if (
            bookedSeats.includes(i)
        ) {

            button.classList.add(
                "booked"
            );

            button.disabled = true;


            button.innerHTML = `

                <i class="fa-solid fa-lock"></i>

                <strong>
                    Seat ${formatSeat(i)}
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
                    Seat ${formatSeat(i)}
                </strong>

                <small>
                    AVAILABLE
                </small>

            `;


            button.addEventListener(
                "click",
                () => selectSeat(i)
            );

        }


        if (i <= 10) {

            left.appendChild(button);

        }

        else {

            right.appendChild(button);

        }

    }

}


/* ==========================================
   SELECT SEAT
========================================== */

function selectSeat(number) {

    if (
        bookedSeats.includes(number)
    ) {

        return;

    }


    document
        .querySelectorAll(
            ".seat.selected"
        )
        .forEach(
            seat => {

                seat.classList.remove(
                    "selected"
                );

                seat.classList.add(
                    "available"
                );

            }
        );


    selectedSeat = number;


    const seat =
        document.querySelector(
            `.seat[data-seat="${number}"]`
        );


    seat.classList.remove(
        "available"
    );

    seat.classList.add(
        "selected"
    );


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

function completePayment() {

    const booking =
        window.pendingBooking;


    if (!booking) {

        return;

    }


    if (
        bookedSeats.includes(
            booking.seat
        )
    ) {

        alert(
            "This seat is already booked."
        );

        closePayment();

        createSeats();

        return;

    }


    bookedSeats.push(
        booking.seat
    );


    localStorage.setItem(
        "surajLibrarySeats",
        JSON.stringify(
            bookedSeats
        )
    );


    createSeats();

    updateSeatCount();


    const bookingId =
        "SDL" +
        Math.floor(
            100000 +
            Math.random() * 900000
        );


    document.getElementById(
        "bookingId"
    ).textContent =
        bookingId;


    document.getElementById(
        "successSeat"
    ).textContent =
        "Seat " +
        formatSeat(
            booking.seat
        );


    document.getElementById(
        "successName"
    ).textContent =
        booking.name;


    document.getElementById(
        "successDate"
    ).textContent =
        formatDate(
            booking.date
        );


    closePayment();


    document.getElementById(
        "successModal"
    ).classList.add(
        "show"
    );


    selectedSeat = null;


    document.getElementById(
        "selectedSeat"
    ).textContent =
        "Please select a seat";


    document.getElementById(
        "bookSeatBtn"
    ).disabled = true;


    document.getElementById(
        "bookingForm"
    ).reset();


    window.pendingBooking = null;

}


/* ==========================================
   COUNTERS
========================================== */

function updateSeatCount() {

    const booked =
        bookedSeats.length;


    const available =
        TOTAL_SEATS - booked;


    document.getElementById(
        "totalSeats"
    ).textContent =
        TOTAL_SEATS;


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