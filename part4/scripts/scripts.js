document.addEventListener('DOMContentLoaded', () => {
  // Index Page Variables
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  let placesArray = [];

  // Login page variables
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const pwdInput = document.getElementById('password');

  // Index page functions
  console.log(document.cookie);

  if (loginButton != null) {
    loginButton.addEventListener('click', function() {
      window.location.href="login.html";}
    );
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
  }

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
      placeElement.className = 'place-card';
      placeElement.innerHTML = `
        <h3>${place.title}</h3>
        <p>${place.price}</p>
        <button class="details_button" type="button">View details</button>
      `;

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

  // Checks if user is authenticated and display places accordingly
  async function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = ''; // Clear previous content

    if (!token) {
      if (logoutLink && loginLink) {
        console.log("Not logged in");
        const errPlaces = document.createElement("p");
        errPlaces.textContent = "Please, login to check places";
        errPlaces.className = "error-text";
        placesList.appendChild(errPlaces);
        loginLink.style.display = 'flex';
        logoutLink.style.display = 'none';
      }
      return;
    }

    if (logoutLink && loginLink) {
      logoutLink.style.display = 'flex';
      loginLink.style.display = 'none';
    }

    try {
      placesArray = await getPlaces();

      if (!placesArray || placesArray.length === 0) {
        const errPlaces = document.createElement("p");
        errPlaces.textContent = "No places to be displayed";
        errPlaces.className = 'error-text';
        placesList.appendChild(errPlaces);
      } else {
        displayPlaces(placesArray);
        await createPriceSlider();
        sliderFiltering();
      }
    } catch (error) {
      console.error("Error fetching places:", error.message);
    }
  }

  checkAuthentication();


  // Login page functions
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
          // console.log(message)
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

  function logoutUser() {
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
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

});
