// State management
const AppState = {
    currentStep: 1,
    searchPayload: null,
    selectedFlight: null,
    passengerDetails: null,
    paymentDetails: null
};

// Services
const FlightService = {
    searchFlights: (payload) => {
        return new Promise((resolve) => {
            // Simulate API delay
            setTimeout(() => {
                // Mock flight data
                const flights = [
                    { id: 'FL101', airline: 'SkyWays', from: payload.from, to: payload.to, depTime: '08:00', arrTime: '10:30', duration: '2h 30m', stops: 'Non-stop', price: 299 },
                    { id: 'FL102', airline: 'AeroJet', from: payload.from, to: payload.to, depTime: '11:15', arrTime: '14:00', duration: '2h 45m', stops: 'Non-stop', price: 345 },
                    { id: 'FL103', airline: 'Global Air', from: payload.from, to: payload.to, depTime: '15:30', arrTime: '19:45', duration: '4h 15m', stops: '1 Stop', price: 215 },
                    { id: 'FL104', airline: 'SkyWays', from: payload.from, to: payload.to, depTime: '20:00', arrTime: '22:30', duration: '2h 30m', stops: 'Non-stop', price: 275 }
                ];
                resolve(flights);
            }, 1200);
        });
    },
    selectFlight: (flightId) => {
        // Will be handled in UI
    }
};

const PassengerService = {
    savePassenger: (payload) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, passengerId: 'P' + Math.floor(1000 + Math.random() * 9000) });
            }, 1000);
        });
    }
};

const PaymentService = {
    processPayment: (payload) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, transactionId: 'TXN' + Math.floor(10000000 + Math.random() * 90000000) });
            }, 1500);
        });
    }
};

// DOM Elements & State
let currentFlights = [];

document.addEventListener('DOMContentLoaded', () => {
    
    // Toggle return date based on trip type
    const tripTypeRadios = document.querySelectorAll('input[name="tripType"]');
    const returnDateInput = document.getElementById('returnDate');
    
    tripTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'One Way') {
                returnDateInput.disabled = true;
                returnDateInput.value = '';
                returnDateInput.removeAttribute('required');
            } else {
                returnDateInput.disabled = false;
                returnDateInput.setAttribute('required', 'required');
            }
        });
    });

    // Step 1: Search Form Submit
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!searchForm.checkValidity()) {
            searchForm.classList.add('was-validated');
            return;
        }

        const payload = {
            tripType: document.querySelector('input[name="tripType"]:checked').value,
            from: document.getElementById('fromCity').value,
            to: document.getElementById('toCity').value,
            departDate: document.getElementById('departDate').value,
            returnDate: document.getElementById('returnDate').value,
            passengers: document.getElementById('passengers').value
        };

        AppState.searchPayload = payload;

        // UI Loading State
        const btnText = document.getElementById('searchBtnText');
        const spinner = document.getElementById('searchSpinner');
        btnText.textContent = 'Searching...';
        spinner.classList.remove('d-none');
        document.getElementById('searchBtn').disabled = true;

        // Call Service
        currentFlights = await FlightService.searchFlights(payload);

        // Reset UI Loading State
        btnText.textContent = 'Search Flights';
        spinner.classList.add('d-none');
        document.getElementById('searchBtn').disabled = false;

        renderFlights(currentFlights);
        goToStep(2);
    });

    // Step 3: Passenger Form Submit
    const passengerForm = document.getElementById('passengerForm');
    passengerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!passengerForm.checkValidity()) {
            e.stopPropagation();
            passengerForm.classList.add('was-validated');
            return;
        }

        const payload = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            passport: document.getElementById('passport').value,
            dob: document.getElementById('dob').value,
            seatPreference: document.getElementById('seatPreference').value
        };

        AppState.passengerDetails = payload;

        const btn = passengerForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
        btn.disabled = true;

        await PassengerService.savePassenger(payload);

        btn.innerHTML = originalText;
        btn.disabled = false;

        renderBookingSummary();
        goToStep(4);
    });

    // Step 4: Payment Formatting
    const cardNumberInput = document.getElementById('cardNumber');
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        value = value.replace(/(.{4})/g, '$1 ').trim(); // Add space every 4 digits
        e.target.value = value;
    });

    const expiryInput = document.getElementById('expiry');
    expiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // Step 4: Payment Form Submit
    const paymentForm = document.getElementById('paymentForm');
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!paymentForm.checkValidity()) {
            e.stopPropagation();
            paymentForm.classList.add('was-validated');
            return;
        }

        const payload = {
            cardName: document.getElementById('cardName').value,
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            expiry: document.getElementById('expiry').value,
            cvv: document.getElementById('cvv').value
        };

        AppState.paymentDetails = payload;

        const btn = document.getElementById('confirmBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';
        btn.disabled = true;

        const res = await PaymentService.processPayment(payload);

        if (res.success) {
            document.getElementById('bookingRef').textContent = res.transactionId;
            goToStep(5); // Success Screen
        } else {
            btn.innerHTML = originalText;
            btn.disabled = false;
            alert("Payment failed. Please try again.");
        }
    });

});

function renderFlights(flights) {
    const container = document.getElementById('flightResults');
    container.innerHTML = '';

    if (flights.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted fs-5">No flights found for your search criteria.</p></div>';
        return;
    }

    flights.forEach(flight => {
        const card = document.createElement('div');
        card.className = 'col-12';
        card.innerHTML = `
            <div class="card flight-card shadow-sm rounded-4">
                <div class="card-body p-4">
                    <div class="row align-items-center">
                        <div class="col-md-3 col-sm-12 d-flex align-items-center mb-3 mb-md-0">
                            <div class="airline-logo me-3">${flight.airline.substring(0,2).toUpperCase()}</div>
                            <div>
                                <h6 class="fw-bold mb-0 text-dark">${flight.airline}</h6>
                                <small class="text-muted">Flight ${flight.id}</small>
                            </div>
                        </div>
                        <div class="col-md-5 col-sm-12 mb-3 mb-md-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="text-center">
                                    <h4 class="fw-bold mb-0 text-dark">${flight.depTime}</h4>
                                    <small class="text-muted text-uppercase fw-bold">${flight.from}</small>
                                </div>
                                <div class="flex-grow-1 px-3 flight-timeline">
                                    <div class="flight-line"></div>
                                    <span class="flight-stops border rounded-pill px-2 py-1">${flight.duration} • ${flight.stops}</span>
                                </div>
                                <div class="text-center">
                                    <h4 class="fw-bold mb-0 text-dark">${flight.arrTime}</h4>
                                    <small class="text-muted text-uppercase fw-bold">${flight.to}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 col-sm-12 text-md-end text-center d-flex flex-column flex-md-row justify-content-md-end align-items-center gap-3">
                            <div class="text-md-end">
                                <h3 class="fw-bold text-primary mb-0">$${flight.price}</h3>
                                <small class="text-muted">per passenger</small>
                            </div>
                            <button class="btn btn-primary px-4 shadow-sm" onclick="selectFlight('${flight.id}')">Select</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.selectFlight = function(flightId) {
    const flight = currentFlights.find(f => f.id === flightId);
    if (flight) {
        AppState.selectedFlight = flight;
        goToStep(3);
    }
};

function renderBookingSummary() {
    const summaryContainer = document.getElementById('summaryDetails');
    const f = AppState.selectedFlight;
    const p = AppState.passengerDetails;
    const passengersCount = parseInt(AppState.searchPayload.passengers);
    const total = f.price * passengersCount;

    summaryContainer.innerHTML = `
        <div class="mb-3 bg-white p-3 rounded border">
            <small class="text-muted d-block text-uppercase fw-bold mb-1">Flight Details</small>
            <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold text-dark">${f.from} <i class="bi bi-arrow-right mx-1 text-muted"></i> ${f.to}</span>
                <span class="badge bg-primary">${f.airline}</span>
            </div>
            <div class="text-muted small mt-1"><i class="bi bi-clock me-1"></i>${f.depTime} - ${f.arrTime} (${f.duration})</div>
        </div>
        <div class="mb-3 bg-white p-3 rounded border">
            <small class="text-muted d-block text-uppercase fw-bold mb-1">Passenger Details</small>
            <span class="fw-bold text-dark"><i class="bi bi-person-fill me-1"></i>${p.fullName}</span>
            ${passengersCount > 1 ? `<div class="text-muted small mt-1">+ ${passengersCount - 1} additional passenger(s)</div>` : ''}
            <div class="text-muted small mt-1"><i class="bi bi-geo-alt-fill me-1"></i>Seat: ${p.seatPreference}</div>
        </div>
    `;

    document.getElementById('summaryTotal').textContent = `$${total}`;
    document.getElementById('payBtnAmount').textContent = `$${total}`;
}

window.goToStep = function(step) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('d-none'));
    
    // Manage specific steps
    if (step <= 4) {
        document.getElementById('step' + step).classList.remove('d-none');
        updateProgressBar(step);
    } else {
        // Step 5 is Success Screen
        document.getElementById('successScreen').classList.remove('d-none');
        document.getElementById('progressIndicatorContainer').classList.add('d-none');
    }
    
    AppState.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function updateProgressBar(step) {
    const bar = document.getElementById('progressBar');
    const steps = document.querySelectorAll('.step-indicator');
    const labels = document.querySelectorAll('.step-labels span');
    
    // Widths for 4 steps: 0%, 33%, 66%, 100%
    const widths = [0, 0, 33, 66, 100];
    bar.style.width = widths[step] + '%';

    steps.forEach((s, idx) => {
        if (idx < step) {
            s.classList.remove('btn-secondary');
            s.classList.add('btn-primary');
        } else {
            s.classList.remove('btn-primary');
            s.classList.add('btn-secondary');
        }
    });

    labels.forEach((l, idx) => {
        if (idx < step) {
            l.classList.add('text-primary');
            l.classList.add('fw-bold');
            l.classList.remove('text-muted');
            l.classList.remove('fw-medium');
        } else {
            l.classList.remove('text-primary');
            l.classList.remove('fw-bold');
            l.classList.add('text-muted');
            l.classList.add('fw-medium');
        }
    });
}
