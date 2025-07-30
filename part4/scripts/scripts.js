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

  function getCookie(name) {
      const cookie = document.cookie;
      if (cookie.startsWith(name)){
        const cookieArr = cookie.split("=");
        return cookieArr[1];
      } else {
        console.error("invalid cookie name")
      }
  }

  // Checks if user is authenticated
  function isAuth() {
    const token = getCookie('token');

    if (!token) return false;
    else return true;
  };

  // Display login/logout button in regards of user auth
  function loginUi(isAuth) {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    loginLink

    if (!isAuth) {
      if (logoutLink && loginLink) {
        loginLink.style.display = 'flex';
        logoutLink.style.display = 'none';
      }
      return;
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
      placesList.innerHTML = '';

      placeGrid.className = 'grid-container';
      placesList.appendChild(placeGrid);

      places.forEach(place => {
        const placeElement = document.createElement('div');
        const detailsDiv = document.createElement('div');
        placeElement.className = 'place-card';
        placeElement.innerHTML = `
          <h3>${place.title}</h3>
          <p>${place.price}€ la nuit.</p>
          <button class="details_button" data-id="${place.id}" type="button">View details</button>
        `;

        detailsDiv.className = 'details-display';
        detailsDiv.style.display = 'none';
        detailsDiv.innerHTML = `
        <h4>Description:</h4>
        <p>${place.description}</p>
        <button class="details-page-btn" data-id="${place.id}" type="button">Consulter ce lieu</button>
        `;
        placeElement.appendChild(detailsDiv);

        //After appending place card, display the details of visible cards
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
        placesList.innerHTML = ''; // Clear previous content
      }

      if (!isAuth()) {
        const errPlaces = document.createElement("p");
        errPlaces.textContent = "Please, login to check places";
        errPlaces.className = "error-text";
        if (placesList) {
          placesList.appendChild(errPlaces);
        }
        return; // Stop here if not authenticated
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
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
              await loginUser(email, password);
            } catch (err) {
              console.error("Login error:", err);
              // alert("Something went wrong. Please try again.");
          }
        });
    }
  }

  /*------------------------------ Place Page Functions ------------------------------*/

  if (/\/place(\.html)?$/.test(window.location.pathname)) {

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

    async function getPlaceUser(userId) {
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
        const user = await getPlaceUser(elem.user_id);

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
      amenitiesHeader.innerHTML = "Commodités à disposition";

      if (amenities.length === 0) {
        amenitiesHeader.innerHTML = "";
        amenitiesHeader.innerHTML = "Ce logement ne propose pas de commodités";
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
        <p class="place-info">Hôte du logement: ${host.first_name} ${host.last_name}</p>
        <p class="place-info">Prix par nuit: ${place.price}</p>
        <p class="place-info">Description: ${place.description}</p>
        <p class="place-info">
            Note des utilisateurs: ${rating?.average_rating != null ? `${rating.average_rating.toFixed(1)}/5` : "Pas encore d'évaluation"}
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
            'Authorization': `Bearer ${getCookie('token')}`,
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
      labelGuests.textContent = 'Nombre de personnes';
      selectGuests.id = 'select-guests';
      selectGuests.name = 'guestCount';
      labelDate.textContent = "Date d'arrivée";
      inputDate.type = 'date';
      inputDate.name = 'checkin';
      labelNights.textContent = 'Nombre de nuités';
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
              errMsg.textContent = "Veuillez renseigner tous les champs";
              form.appendChild(errMsg);
            }
            hasError = true;
            continue;
          }

          if (key === 'nightCount') {
            data[key] = parseInt(value);
          }

          if (key === 'checkin') {
            const userDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            userDate.setHours(0, 0, 0, 0);

            if (userDate < today) {
              const errMsg = document.createElement('p');
              errMsg.classList.add('error-text');
              errMsg.textContent = "La date d'arrivée ne peut pas être antérieure à aujourd'hui.";
              form.appendChild(errMsg);
              hasError = true;
            }
          }
        }

        if (!hasError) {

          form.reset();
          const booking = await handleFormPost(data);
          console.log(booking.id)
        }
      });
    };

      function makeBtnSect() {
      const main = document.getElementsByTagName('main');
      const btnSection = document.createElement('section');

      btnSection.id = 'booking-button';
      btnSection.innerHTML = `
        <div id="make-booking">
            <button class="booking-button" data-id="${currPlaceId}" type="button">Réserver ce lieu</button>
        </div>
      `;

      main[0].appendChild(btnSection);
    };

    unpackPlacePromise(currPlaceId);
    makeBtnSect();
    makePopupForm(currPlaceId)

  }

});
/*------------------------------ Additionnal Event Listeners ------------------------------*/

  // Index page's places detail button
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('details_button')) {
    const placeId = event.target.dataset.id;
    const card = event.target.closest('.place-card');
    const detailsDiv = card.querySelector('.details-display');
    const detailsButton = card.querySelector('.details_button');

    if (detailsDiv.style.display === 'block') {
      detailsDiv.style.display = 'none';
      detailsButton.textContent = 'View details';
      detailsVisibleSet.delete(placeId);
    } else {
      detailsDiv.style.display = 'block';
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
