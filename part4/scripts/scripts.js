//Set to keep track of ids of places whose details are visible
const detailsVisibleSet = new Set();

document.addEventListener('DOMContentLoaded', () => {
  /*------------------------------ Index Page Variables ------------------------------*/
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  let placesArray = [];

  /*------------------------------ Login Page Variables ------------------------------*/
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const pwdInput = document.getElementById('password');

  /*------------------------------ Place Page Variables ------------------------------*/

  const placeDetailsDiv = document.getElementById('place-details');
  const currPlaceId = window.location.search.split('=')[1];

  /*------------------------------ Global Functions ------------------------------*/

  if (loginButton != null) {
    loginButton.addEventListener('click', function() {
      window.location.href="login.html";}
    );
  }

  function logoutUser() {
  document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  window.location.href = 'index.html';
  }

  if (logoutButton != null) {
    logoutButton.addEventListener('click', logoutUser);
  }

  function getUserIdFromCookie() {
    const token = getCookie('token');

    if (token.length > 0) {
      try {
          jwt = JSON.parse(atob(token.split('.')[1]));
          const UUID = jwt.sub;;
          return UUID;
      } catch (e) {
          console.error('error: '+e);
      }
    };
  };

  async function getUserById(userId) {
    const jwt = getCookie('token');
    const url = `http://localhost:5000/api/v1/users/users/${userId}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const placeUserJson = await response.json();
      return placeUserJson;
    } catch (error) {
      console.error(error.message);
    }
  };

  //Get place with id of current place and returns according jsonified place object.
  async function getPlace(id) {
    const jwt = getCookie('token');
    const url = `http://localhost:5000/api/v1/places/${id}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const placeJson = await response.json();
      return placeJson;
    } catch (error) {
      console.error(error.message);
    }
  };

  function getCookie(name) {
    const cookie = document.cookie;
    if (cookie.startsWith(name)){
      const cookieArr = cookie.split("=");
      return cookieArr[1];
    } else {
      console.error("invalid cookie name")
    }
  }

  function isAuth() {
    const token = getCookie('token');
    return !!token;
  }

  async function loginUi(isAuthenticated) {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const greeting = document.getElementById('greeting');

    if (!isAuthenticated) {
      if (logoutLink && loginLink) {
        loginLink.style.display = 'flex';
        logoutLink.style.display = 'none';
      }
      return;
    }

    const user = await getUserById(getUserIdFromCookie());

    if (greeting) {
      const greetText = document.createTextNode(`Hello ${user.first_name} ${user.last_name}`);
      greeting.appendChild(greetText);
    }

    if (logoutLink && loginLink) {
      logoutLink.style.display = 'flex';
      loginLink.style.display = 'none';
    }
  }

  loginUi(isAuth());

  /*------------------------------ Index Page Functions ------------------------------*/

  if (window.location.pathname.endsWith("/index.html")) {

    // Get a list of places
    async function getPlaces() {
      const url = "http://localhost:5000/api/v1/places";
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const places = await response.json();
        return places
      } catch (error) {
        console.error(error.message);
      }
    };

    // Get most expensive place to set slider max value
    async function getExpensivePlace() {
      const url = "http://localhost:5000/api/v1/places";
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const places = await response.json();

        if (!Array.isArray(places) || places.length === 0) {
          console.error("No places available.");
          return null;
        }

        // Find the place with the highest price
        const expensivePlace = places.reduce((max, place) => {
          return place.price > max.price ? place : max;
        });

        return expensivePlace;

      } catch (error) {
        console.error("Error fetching places:", error.message);
        return null;
      }
    }

    // Creates slider with values going from 0 to max place's price
    async function createPriceSlider() {
      const place = await getExpensivePlace();
      if (!place) {
        console.warn("No expensive place found.");
        return;
      }

      const maxPrice = place.price;

      const sliderFilter = document.getElementById("slide-filter");
      sliderFilter.innerHTML = '';

      const label = document.createElement("label");
      label.textContent = 'Sort by price: ';

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = 0;
      slider.max = maxPrice;
      slider.value = maxPrice;
      slider.step = 1;
      slider.id = "price-slider";

      const valueDisplay = document.createElement("span");
      valueDisplay.textContent = `${slider.value} €`;

      slider.addEventListener("input", () => {
        valueDisplay.textContent = `${slider.value} €`;
      });

      sliderFilter.appendChild(label);
      sliderFilter.appendChild(slider);
      sliderFilter.appendChild(valueDisplay);
    }

    // Creates grid dynamically containing each places.
    function displayPlaces(places) {
      const placesList = document.getElementById('places-list');
      const placeGrid = document.createElement('div');
      const filterSection = document.getElementById('filter');

      placesList.innerHTML = '';
      placeGrid.className = 'grid-container';
      placesList.appendChild(placeGrid);

      if (places.length > 0) {
        filterSection.style.display = 'block';
      }
      places.forEach(place => {
        const placeElement = document.createElement('div');
        const detailsDiv = document.createElement('div');

        placeElement.className = 'place-card';
        placeElement.innerHTML = `
          <h3>${place.title}</h3>
          <p>${place.price}€ la nuit.</p>
          <button class="details_button" data-id="${place.id}" type="button">Details</button>
        `;

        detailsDiv.className = 'details-display';
        detailsDiv.innerHTML = `
        <h4>Description:</h4>
        <p>${place.description}</p>
        <button class="details-page-btn" data-id="${place.id}" type="button">Check this place</button>
        `;
        placeElement.appendChild(detailsDiv);

        if (detailsVisibleSet.has(String(place.id))) {
        detailsDiv.style.display = 'block';
        placeElement.querySelector('.details_button').textContent = 'Hide details';
        }

        placeGrid.appendChild(placeElement);
      });
    }

    // Filters places by price considering filter value
    function sliderFiltering() {
      const slider = document.getElementById('price-slider');

      slider.addEventListener('input', () => {
        const selectedMax = slider.value;
        const filteredPlaces = placesArray.filter(place => place.price <= selectedMax);
        displayPlaces(filteredPlaces);
      });
    }

    async function handleIndexPlacesDisplay() {
      const placesList = document.getElementById('places-list');
      if (placesList) {
        placesList.innerHTML = '';
      }

      if (!isAuth()) {
        const errPlaces = document.createElement("p");
        errPlaces.textContent = "Please, login to check places";
        errPlaces.className = "error-text";
        if (placesList) {
          placesList.appendChild(errPlaces);
        }
        return; // Stop si non authentifié
      }

      try {
        placesArray = await getPlaces();

        if (!placesArray || placesArray.length === 0) {
          const errPlaces = document.createElement("p");
          errPlaces.textContent = "No places to be displayed";
          errPlaces.className = 'error-text';
          if (placesList) {
            placesList.appendChild(errPlaces);
          }
        } else {
          displayPlaces(placesArray);
          await createPriceSlider();
          sliderFiltering();
        }
      } catch (error) {
        console.error("Error fetching places:", error.message);
      }
    }

    handleIndexPlacesDisplay();
  }

  /*------------------------------ Login Page Functions ------------------------------*/

  if (window.location.pathname.endsWith("/login.html")) {
    async function loginUser(email, password) {
      const response = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        let message = `Error ${response.status}`;
        try {
          if (document.getElementById('error-text')) {
            document.getElementById('error-text').remove();
          }
            const errorData = await response.json();
            message = errorData.message;
            emailInput.value="";
            pwdInput.value="";
            const errElem = loginForm.appendChild(document.createElement("p"));
            errElem.className = 'error-text'
            errElem.textContent = message;

        } catch {
            const text = await response.text();
            if (text) message = text;
        }

        throw new Error(message);
    }

      const data = await response.json();
      document.cookie = `token=${data.access_token}; path=/`;
      window.location.href = 'index.html';
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        loginForm.querySelectorAll('.error-text').forEach(el => el.remove());

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
          await loginUser(email, password);
        } catch (err) {
          console.error("Login error:", err);
        }
      });
    }
  }

  /*------------------------------ Place Page Functions ------------------------------*/

  if (/\/place(\.html)?$/.test(window.location.pathname)) {

    async function getPlaceReviews(placeId) {
      const jwt = getCookie('token');
      const url = `http://localhost:5000/api/v1/places/${placeId}/bookings`;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const reviewsJson = await response.json();
        return reviewsJson;
      } catch (error) {
        console.error(error.message);
      }
    };

    async function getPlaceRating(placeId) {
      const jwt = getCookie('token');
      const url = `http://localhost:5000/api/v1/places/${placeId}/rating`;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          if (response.status != 404) {
            throw new Error(`Response status: ${response.status}`);
          }
        }

        const placeRatingJson = await response.json();
        return placeRatingJson;
      } catch (error) {
        console.error(error.message);
      }
    };

    async function getPlaceAmenities(placeId) {
      const jwt = getCookie('token');
      const url = `http://localhost:5000/api/v1/places/${placeId}/amenities`;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const placeAmenitiesJson = await response.json();
        return placeAmenitiesJson;
      } catch (error) {
        console.error(error.message);
      }
    };

    async function getPlaceHost(placeId) {
      const place = await getPlace(placeId);
      const hostId = place.host_id;
      const jwt = getCookie('token');
      const url = `http://localhost:5000/api/v1/users/hosts/${hostId}`;

      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const placeHostJson = await response.json();
        return placeHostJson;
      } catch (error) {
        console.error(error.message);
      }
    };

    async function displayReviews(reviews) {
      const reviewGrid = document.createElement('div');
      reviewGrid.className = 'grid-container'
      if (reviews.length === 0) {
        // Affiche un message s'il n'y a pas de revue.
        return
      }

      for (const elem of reviews) {
        const user = await getUserById(elem.user_id);

        if (elem.review != null) {
          const reviewElem = document.createElement('div');
          reviewElem.className = 'review-card';
          reviewElem.innerHTML = `
            <h3>${user ? `${user.first_name} ${user.last_name}` : 'Anonymous'}'s Review</h3>
            <p>${elem.review.rating}/5</p>
            <p>${elem.review.text}</p>
          `;

          placeDetailsDiv.appendChild(reviewGrid)
          reviewGrid.appendChild(reviewElem);
        };
      }
    };

    function displayAmenities(placeAmenities) {
      const amenitiesList = document.createElement('ul');
      const amenitiesHeader = document.createElement('h4');
      const placeDetailsClass = placeDetailsDiv.getElementsByClassName('place-details');
      const amenities = placeAmenities;

      amenitiesList.className = 'class-info';
      amenitiesHeader.id = "amenities-header";
      amenitiesHeader.innerHTML = "Amenities available";

      if (amenities.length === 0) {
        amenitiesHeader.innerHTML = "";
        amenitiesHeader.innerHTML = "This place does not provide amenities";
        placeDetailsClass[0].appendChild(amenitiesHeader);
      }

      placeDetailsClass[0].appendChild(amenitiesHeader);
      amenities.forEach( amenity => {
          const amenityItem = document.createElement('li');
          amenityItem.className = 'class-info';
          amenityItem.innerHTML = `${amenity.name}`;

          amenitiesList.appendChild(amenityItem);
      });

      placeDetailsClass[0].appendChild(amenitiesList);
    };

    function displayInfos(place, rating, host) {
      const placeInfos = document.createElement('div');
      const placeDetailsClass = placeDetailsDiv.getElementsByClassName('place-details');

      placeInfos.className = 'place-infos';
      placeInfos.innerHTML = `
        <h3 id="place-title">${place.title}</h3>
        <p class="place-info">Host of the Place: ${host.first_name} ${host.last_name}</p>
        <p class="place-info">Price per night: ${place.price}</p>
        <p class="place-info">Description: ${place.description}</p>
        <p class="place-info">
            Users rating: ${rating?.average_rating != null ? `${rating.average_rating.toFixed(1)}/5` : "No ratings yet"}
        </p>
      `;

      placeDetailsClass[0].appendChild(placeInfos);
    };

    async function unpackPlacePromise(placeId) {
      const placeJson = await getPlace(placeId);
      const reviewsJson = await getPlaceReviews(placeId);
      const ratingJson = await getPlaceRating(placeId);
      const amenitiesJson = await getPlaceAmenities(placeId);
      const hostJson = await getPlaceHost(placeId);

      displayInfos(placeJson, ratingJson, hostJson);
      displayReviews(reviewsJson);
      displayAmenities(amenitiesJson);
    };

    async function handleFormPost(formData) {

      const postUrl = 'http://localhost:5000/api/v1/bookings';
      const jwt = getCookie('token');
      const numNight = Number(formData.nightCount);
      const numGuest = Number(formData.guestCount);
      const payload = {
        place_id: currPlaceId,
        check_in: formData.checkin,
        nights: numNight,
        guest_count: numGuest
      };
      const jsonData = JSON.stringify(payload)
      try {
          const response = await fetch(postUrl, {
            method: "POST",
            headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            },
            body: jsonData
          });
          if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
          };

          const jsonBookingPost = await response.json();
          return jsonBookingPost;

        } catch (error) {
          console.error(error.message);
        }
    }

    async function makePopupForm(placeId) {
      const today = new Date();
      const place = await getPlace(placeId);

      const popupBg = document.createElement('div');
      const form = document.createElement('form');
      const labelGuests = document.createElement('label');
      const selectGuests = document.createElement('select');
      const labelDate = document.createElement('label');
      const inputDate = document.createElement('input');
      const labelNights = document.createElement('label');
      const inputNights = document.createElement('input');
      const submitButton = document.createElement('input');

      popupBg.id = 'popup-bg';
      form.id = 'popup-form';
      labelGuests.textContent = 'Number of guests';
      selectGuests.id = 'select-guests';
      selectGuests.name = 'guestCount';
      labelDate.textContent = "Checkin date";
      inputDate.type = 'date';
      inputDate.name = 'checkin';
      labelNights.textContent = 'Number of nights stayed';
      inputNights.type = 'number';
      inputNights.name = 'nightCount';
      submitButton.type = 'submit';

      for (let i = 1; i <= place.capacity; i++) {
        const option = document.createElement('option');

        option.value = i;
        option.textContent = i;

        selectGuests.appendChild(option);
      };

      form.appendChild(labelGuests);
      form.appendChild(selectGuests);
      form.appendChild(labelDate);
      form.appendChild(inputDate);
      form.appendChild(labelNights);
      form.appendChild(inputNights);
      form.appendChild(submitButton);

      document.body.appendChild(popupBg);
      document.body.appendChild(form);

      popupBg.addEventListener('click', () => {
        popupBg.style.display = "none";
        form.style.display = "none";
      });

      form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        form.querySelectorAll('.error-text').forEach(e => e.remove());
        const data = Object.fromEntries(formData.entries());
        let hasError = false;

        for (const [key, value] of Object.entries(data)) {
          if (!value) {
            if (!form.querySelector('.error-text')) {
              const errMsg = document.createElement('p');
              errMsg.classList.add('error-text');
              errMsg.textContent = "Please complete all fields";
              form.appendChild(errMsg);
            }
            hasError = true;
            continue;
          }

          if (key === 'nightCount') {
            data[key] = parseInt(value);
            if (data[key] < 1) {
              const errMsg = document.createElement('p');
              errMsg.classList.add('error-text');
              errMsg.textContent = "Please book at least one night";
              form.appendChild(errMsg);
              hasError = true;
            }
          }

          if (key === 'checkin') {
            const userDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            userDate.setHours(0, 0, 0, 0);

            if (userDate < today) {
              const errMsg = document.createElement('p');
              errMsg.classList.add('error-text');
              errMsg.textContent = "Checkin date can't be past.";
              form.appendChild(errMsg);
              hasError = true;
            }
          }
        }

        if (!hasError) {

          form.reset();
          const booking = await handleFormPost(data);
        }
      });
    };

      function makeBtnSect() {
      const main = document.getElementsByTagName('main');
      const btnSection = document.createElement('section');

      btnSection.id = 'booking-button';
      btnSection.innerHTML = `
        <div id="make-booking">
            <button class="booking-button" data-id="${currPlaceId}" type="button">Book this place</button>
        </div>
      `;

      main[0].appendChild(btnSection);
    };

    unpackPlacePromise(currPlaceId);
    makeBtnSect();
    makePopupForm(currPlaceId)

  }
/*------------------------------ Booking page functions ------------------------------*/
  if (window.location.pathname.endsWith("/bookings.html")){

    async function getUserBookings() {
      const userId = getUserIdFromCookie();
      const token = getCookie('token');
      const url = `http://localhost:5000/api/v1/users/${userId}/bookings`;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }

        });
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return json
      } catch (error) {
        console.error(error.message);
      }
    };

    async function displayBookings() {
      const userBookings = document.getElementById('user-bookings');
      const gridContainer = document.createElement('div');
      const bookings = await getUserBookings();

      gridContainer.classList.add('grid-container');

      for (const booking of bookings) {
        const place = await getPlace(booking.place_id);
        const placeTitle = document.createElement('h4');
        const bookingDiv = document.createElement('div');
        const startDate = document.createElement('p');
        const endDate = document.createElement('p');
        const guestCount = document.createElement('p');
        const totalPrice = document.createElement('p');

        bookingDiv.classList.add('booking-card');

        placeTitle.textContent = place.title;
        startDate.textContent = `Checking date: ${booking.start_date}`;
        endDate.textContent = `Checkout Date: ${booking.end_date}`;
        guestCount.textContent = `Guest count: ${booking.guest_count}`;
        totalPrice.textContent = `Total price: ${booking.total_price} €`;

        bookingDiv.appendChild(placeTitle);
        bookingDiv.appendChild(startDate);
        bookingDiv.appendChild(endDate);
        bookingDiv.appendChild(guestCount);
        bookingDiv.appendChild(totalPrice);

        const reviewDiv = document.createElement('div');
        reviewDiv.classList.add('review-section');

        if (booking.review) {
          const reviewText = document.createElement('p');
          reviewText.textContent = `Your opinion: ${booking.review.text}`;

          const reviewRating = document.createElement('p');
          reviewRating.textContent = `Rating: ${booking.review.rating}/5`;

          reviewDiv.appendChild(reviewText);
          reviewDiv.appendChild(reviewRating);
        } else {
          const reviewPrompt = document.createElement('a');
          const deleteBtn = document.createElement('a');
          reviewPrompt.href = `add_review.html?booking_id=${booking.id}`;
          reviewPrompt.textContent = "Give us your opinion";
          deleteBtn.href = '#';
          deleteBtn.classList.add('delete-btn');
          deleteBtn.textContent = "Cancel this booking";
          deleteBtn.dataset.id = booking.id;

          deleteBtn.addEventListener('click', async function(event) {
            event.preventDefault();

            const jwt = getCookie('token');
            const bookingId = this.dataset.id;
            const url = `http://localhost:5000/api/v1/bookings/${bookingId}`;

            try {
              const response = await fetch( url, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${jwt}`
                }
              });

              if (!response.ok) {
                throw new Error(`Failed to delete booking: ${response.status}`);
              }
              const bookingCard = this.closest('.booking-card');
              if (bookingCard) {
                bookingCard.remove();
              }
            } catch (error) {
              console.error('Error :', error);
            }
          });

          reviewDiv.appendChild(reviewPrompt);
          reviewDiv.appendChild(deleteBtn);
        }

        userBookings.appendChild(gridContainer);
        gridContainer.appendChild(bookingDiv);
        bookingDiv.appendChild(reviewDiv);
      }

    }

    displayBookings();
  };

/*------------------------------ Add Review page functions ------------------------------*/

  if (/\/add_review(\.html)?$/.test(window.location.pathname)) {

    const reviewForm = document.getElementById('review-form');
    const errMsgRev = document.createElement('p');
    const errMsgRat = document.createElement('p');
    errMsgRev.classList.add('error-text');
    errMsgRat.classList.add('error-text');


    function displayMessage(message) {
      const errContainer = document.getElementById('review-msg') || document.createElement('p');
      errContainer.id = 'review-msg';
      errContainer.style.color = 'red';
      errContainer.textContent = message;
      reviewForm.appendChild(errContainer);
    }

    async function addReview(bookingId, reviewText, reviewRating) {
      const token = getCookie('token');
      const url = "http://localhost:5000/api/v1/reviews";
      const payload = JSON.stringify({
        booking_id: bookingId,
        text: reviewText,
        rating: reviewRating
      });

      try {
        const response = await fetch(url, {
          method: "POST",
          body: payload,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          // Check status and display specific message
          switch (response.status) {
            case 400:
              throw new Error("Requête invalide (400) : Invalid informations");
            case 401:
              throw new Error("Non autorisé (401) : Please reconnect.");
            case 403:
              throw new Error("Accès refusé (403) : No rights.");
            case 404:
              throw new Error("Not found (404).");
            case 409:
              throw new Error("Conflit (409) : Already existing review.");
            case 500:
              throw new Error("Erreur serveur (500) : Try again later.");
            default:
              throw new Error(`Unknown error : ${response.status}`);
          }
        }

        const json = await response.json();
        displayMessage("Thank you for your opinion");
        return true;

      } catch (error) {
        console.error("Error while sending review :", error.message);
        displayMessage(error.message); // Function to show error to user
        return false;
      }
    }

    document.getElementById("submit-review").addEventListener('click', async function(event) {
      event.preventDefault();
      const bookingId = window.location.search.split('=')[1];
      const reviewText = document.getElementById("review").value;
      const rating = parseInt(document.getElementById("rating").value);

      reviewForm.reset();
      errMsgRev.textContent = '';
      errMsgRat.textContent = '';

      if (isNaN(rating)) {
        errMsgRat.textContent = "Please give a rating";
        reviewForm.appendChild(errMsgRat);
      };

      if (reviewText.length === 0 || reviewText === null) {
        errMsgRev.textContent = "Please give us your opinion";
        reviewForm.appendChild(errMsgRev);
      };

     await addReview(bookingId, reviewText, rating);

    });
  };

});


/*------------------------------ Additionnal Event Listeners ------------------------------*/

  // Index page's places detail button
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('details_button')) {
    const placeId = event.target.dataset.id;
    const card = event.target.closest('.place-card');
    const detailsDiv = card.querySelector('.details-display');
    const detailsButton = card.querySelector('.details_button');

    const isVisible = detailsDiv.classList.contains('visible');

    if (isVisible) {
      detailsDiv.classList.remove('visible');
      detailsButton.textContent = 'See details';
      detailsVisibleSet.delete(placeId);
    } else {
      detailsDiv.classList.add('visible');
      detailsButton.textContent = 'Hide details';
      detailsVisibleSet.add(placeId);
    }
  }
});

// Places Cards' go to page detail button
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('details-page-btn')) {
    const placeId = event.target.dataset.id;
    window.location.href = `place.html?id=${placeId}`;
  }
});

document.addEventListener('click', function(event) {
  if (event.target.classList.contains('booking-button')) {
    const popupForm = document.getElementById('popup-form');
    const popupBg = document.getElementById('popup-bg');
    const placeId = event.target.dataset.id;

    popupForm.style.display = "block";
    popupBg.style.display = "block";
  }
});
