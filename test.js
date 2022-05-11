"use strict";






function onNavMenuCoinsPage() {

  $("#main-content").load("./pages/coins.html", () => {
    setTimeout(loadAllCoinsToPage);
    $("#coins-search-btn").on("click", onSearchCoin);
  });

}

function onNavMenuReportsPage() {

  $("#main-content").load("./pages/reports.html", () => {

    // run immediately after page loads

  });
}

function onNavMenuAboutPage() {
  $("#main-content").load("./pages/about.html", () => {

    // run immediately after page loads

  });
}


function updateNavMenuActivePage() {

  $("#navigationMenu .nav-link.active").removeClass("active");
  $(this).addClass("active");

}

$("#nav-coins").on("click", onNavMenuCoinsPage);

$("#nav-reports").on("click", onNavMenuReportsPage);

$("#nav-about").on("click", onNavMenuAboutPage);

$("#navigationMenu")
  .on("click", ".nav-link", updateNavMenuActivePage);

// // $("#main-content").load("./templates/all_coins.html", () => {
// //   loadAllCoinsToPage();
// //   $("#coins-search-btn").on("click", onSearchCoin);
// // });

// $("#all-coins").on("click", () => {
//   $("#main-content").load("./templates/all_coins.html", () => {
//     loadAllCoinsToPage();
//   });
// });
// $("#reports").on("click", () => {
//   $("#main-content").load("./templates/live_reports.html");
// });
// $("#about").on("click", () => {
//   $("#main-content").load("./templates/about.html");
// });

// $("#navigationMenu")
//   .on("click", ".nav-link", function () {

//     $("#navigationMenu .nav-link.active").removeClass("active");
//     $(this).addClass("active");

//     // // load page
//     // $("#main-content").load($(this).attr("data-page-url"));

//   });
// // $("#main-content").load("./templates/live_reports.html");

onNavMenuCoinsPage();



/*

dear future astro:

okay yeah so once again i left all the work for you, huh? sorry about that, i hope you're doing well
on a personal note DRINK WATER and EAT FRUIT SUGAR i need you healthy <3
on a professional note,
  - go over all the code in this file. there's a lot of stupid choices youve made along the way, and it's hard to clean the code as is.
  - consider reducing the functions even more by making new ones that are separate, we don't need those huge blocks that just confuse us.
  - sort out where everything goes, it looks messy and we need a clean code.
  - ADD COMMENTS.
  - there's a few functions here that need revamping, mainly:
    - the one that displays the loading thing for more info. it's all just a block of html, it looks horrible and probably not very smart.
    - the error handlers: we want to display a helpful message to the user for it to know we did a fucky wucky uwu. so add some nice html with bootstrap and then make it display with these functions.
  - consider making a global-ish object to store important stuff that you might change; like class names or the duration for a reset (more info in local storage)
once you are done with these, you can move on to the next two pages:
  - start with the about me since it should be easy. probably should start writing notes about your decisions in this project.
  - do the reports page:
    - read the instructions
    - listen to the lesson
    - form a plan
once done with this, finalise the design, clean up the html, and make sure to change stuff like favicon and page title and all that shit.

i wish you the best of luck.
go make me proud.

*/


function getUrlForChartInfoAPI() {

  const savedCoins = getSavedCoinsFromLocalStorage();
  const savedCoinsSymbols = savedCoins.map(coin => coin.symbol);

  return `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${savedCoinsSymbols.join()}&tsyms=USD`;
}

function getLiveInfoAboutSavedCoins() {

  const API = getUrlForChartInfoAPI();

  return $.get(API);
}

function displayChartData(data) {

  console.log(data);
}


function testReport() {

  //
  getLiveInfoAboutSavedCoins()
    .done(displayChartData)
    .done(data => {
      const interval = setInterval(displayChartData, 1000, data);

      $(document).one("click", ".nav-link", () => {
        clearInterval(interval);
      })
    });

}















function loadAllCoinsToPage() {

  // display loading bar
  const coinListContainer = $("#coin-list-container")

  // get coins from server
  getAllCoins()
    // then hide the loading bar
    .finally(() => coinListContainer.empty())
    // then if successful, display coins
    .then(coins => displayAllCoins(coins, coinListContainer))
    // then if unsuccessful, display an error
    .catch(response => displayErrorForFetchingAllCoins(response.statusCode));

  // notes: error message displays as a card bc the container is set to row-cols-3
  // make sure to fix this by either completely rewriting that container, or by dynamically creating the container, or by some other way
  // also, consider caching the coins since we don't need them to be updated constantly. the api recommends once a day, but once every 2 minutes could also work. the data shouldbe relevant
}

function getAllCoins() {

  return new Promise((resolve, reject) => {

    const allCoinsJSON = localStorage.getItem("allCoins");

    if (allCoinsJSON === null) {

      getAllCoinsFromAPI()
        .done(coins => {
          localStorage.setItem("allCoins", JSON.stringify(coins));
          resolve(coins);
        })
        .fail(response => reject(response));

    } else {

      const allCoins = JSON.parse(allCoinsJSON);
      resolve(allCoins);

    }
  });
}

function createCoinCard(coin) {

  const card = $("<div/>")
    .addClass("card h-100 coinCard")
    .append(
      $("<div/>").addClass("card-body")
      .append(
        $("<div/>").addClass("coin-basic-information")
        .append(createCoinCardSaveCoinSwitch(coin))
        .append(createCoinCardTitle(coin.symbol))
        .append(createCoinCardDescription(coin.name))
      )
      .append(
        $("<div/>").addClass("coin-additional-information")
        .append(createCoinCardMoreInfoCollapser())
        .append(createCoinCardMoreInfoButton(coin.id))
      )
    );

  return $("<div/>")
    .attr({ // store the coin's information without the need to get it out of the coincard's elements
      "data-coin-id": coin.id,
      "data-coin-symbol": coin.symbol
    })
    .addClass("col")
    .append(card);

}


// POSSIBLY GET RID OF LATER, SEE COMMENTS ON createCoinCard()
function createCoinCardSaveCoinSwitch(coin) {

  // input element itself
  const switchCheckbox = $("<input/>", {
      type: "checkbox",
      role: "switch"
    })
    .addClass("form-check-input saveCoinSwitch")
    // turn on switch if the coin is saved
    .prop("checked", () => checkIfCoinIsSaved(coin.id))
    // add click functionality
    .on("click", function () {

      if ($(this).prop("checked")) { // switch is turned on
        saveCoin(coin);

      } else { // switch is turned off
        unsaveCoin(coin);
      }
    });

  // wrapper div for better visuality
  const switchElement = $("<div/>")
    .addClass("float-end ms-3")
    .append(
      $("<div/>")
      .addClass("form-check form-switch form-switch-lg")
      .append(switchCheckbox)
    );

  return switchElement;
}

function createCoinCardTitle(coinSymbol) {

  return $("<h3/>")
    .addClass("card-title")
    .text(coinSymbol); // convert to uppercase?
}

function createCoinCardDescription(coinName) {

  return $("<p/>")
    .addClass("card-text")
    .text(coinName);
}

function createCoinCardMoreInfoCollapser() {

  return $("<div/>")
    .addClass("container-fluid mt-3 moreInfoCollapser") // moreInfoCollapser
    .hide();
}

function createCoinCardMoreInfoButton(coinId) {

  return $("<button/>")
    .addClass("btn btn-primary moreInfoButton mt-3")
    .text("More Info")
    .on("click", function () {
      const moreInfoCollapser = $(this).closest(".coinCard").find(".moreInfoCollapser");

      if (moreInfoCollapser.is(":hidden")) {
        // clicked to show
        showMoreInfoAboutCoin(coinId, moreInfoCollapser);

      } else {
        //
        hideMoreInfoAboutCoin(moreInfoCollapser);
      }
    });
}
// END POSSIBLY GET RID OF BLOCK


// REFACTOR THIS PART ONCE DONE WITH THE PREVIOUS SECTION REWRITE
function createCoinCardMoreInfoAboutCoin(coinData) {

  const coinImage = $("<img/>")
    .attr("src", coinData.image)
    .addClass("coinCardImage")
    // in case no image is provided, use a placeholder
    .on("error", displayPlaceholderImage);

  const coinExchangeRate = $("<ul/>")
    .addClass("list-unstyled m-0")
    .append(createCoinCardMoreInfoExchangeRate("USD", coinData.currentPrice.usd))
    .append(createCoinCardMoreInfoExchangeRate("EUR", coinData.currentPrice.eur))
    .append(createCoinCardMoreInfoExchangeRate("ILS", coinData.currentPrice.ils));

  // construct it with grid layout
  return $("<div/>")
    .addClass("row align-items-center")
    //
    .append(
      $("<div/>")
      .addClass("col-lg-auto col-md-6 col-auto mt-2")
      .append(coinImage)
    )
    .append(
      $("<div/>")
      .addClass("col mt-2")
      .append(coinExchangeRate)
    );
}

function createCoinCardMoreInfoExchangeRate(currency, price) {

  // if no price is provided, we need to display it correctly
  const exchangeRateHasValue = (price !== undefined);

  const currencyNameElement = $("<span/>")
    .addClass("fw-bold me-2")
    .text(`${currency}: `);

  const priceValueElement = $("<span/>")
    .addClass(() => exchangeRateHasValue ? "text-primary" : "text-muted")
    .text(() => exchangeRateHasValue ? getFormattedPriceString(price, currency) : "unavailable");

  return $("<li/>")
    .addClass("card-text font-monospace")
    // add currency text
    .append(currencyNameElement)
    // add coin price text
    .append(priceValueElement);
}




function displayLoadingScreenForMoreInfo(parentElement) {
  // not sure if i want to make it dynamically since there's no dynamic info
  // maybe just load from external html file, but then it would be async and load after the inforsmation
  $(`<div class="row align-items-center placeholder-glow">

  <div class="col-lg-auto col-md-6 col-auto mt-2">

    <div class="coinCardImage placeholder"></div>

  </div>

  <div class="col mt-2">
    <ul class="list-unstyled m-0">

      <li class="card-text font-monospace">
        <span class="placeholder coin-currency-placeholder me-2"></span>
        <span class="placeholder coin-price-placeholder"></span>
      </li>

      <li class="card-text font-monospace">
        <span class="placeholder coin-currency-placeholder me-2"></span>
        <span class="placeholder coin-price-placeholder"></span>
      </li>

      <li class="card-text font-monospace">
        <span class="placeholder coin-currency-placeholder me-2"></span>
        <span class="placeholder coin-price-placeholder"></span>
      </li>

    </ul>
  </div>

</div>`)
    .appendTo(parentElement);

}

function displayMoreInfoAboutCoin(coinData, parentElement) {

  createCoinCardMoreInfoAboutCoin(coinData).appendTo(parentElement);

}



function addCoinCardToPage(coinInformation, parentElement) {

  createCoinCard(coinInformation)
    .attr("id", getCoinCardId(coinInformation.id))
    .appendTo(parentElement);

}

function displayAllCoins(coins, parentElement) {

  coins.forEach(coin => {
    addCoinCardToPage(coin, parentElement);
  });

  // for (let i = 0; i < 100; i++) { // for development
  //   addCoinCardToPage(coins[i], parentElement);
  // }

}




















// what the fuck is this abomination
// i did it so that you can easily add the new coin you want to select to the modal but have it not be targeted by the same code that makes all the buttons deselect then close and actually i just dont wany yhat one to be clickable so i guess it doesnt matter so maybe it actually works
function createCoinDisplayForModal(coin) {

  const newCard = createCoinCard(coin)
  // getCoinCard(coinId).clone()
  // .removeAttr("id"); // cant have 2 same ids
  // newCard.find(".coin-additional-information").remove();
  newCard.find(".saveCoinSwitch")
    .off("click")
    .on("click", () => {
      unsaveCoin(coin);
      // the only thing this does is deselect the coin so the coin that was just clicked is already deselected which means it won't affect it
    });
  return newCard;

}

function AddCoinCardToModal(coin) {

  const newCard = createCoinDisplayForModal(coin);
  // newCard.appendTo(parentElement);
  $("#selectCoinToRemoveModal").find(".coinContainerModal")
    .append(newCard);
}




// external function
// STOP PROCRASTINATING THE WARNINGS

// IMMEDIATELY START REPORTS PAGE (monday)

function openSelectionModalToReplaceCoinWith(coindata) {

  const modalWindow = $("#selectCoinToRemoveModal");
  const modalContent = modalWindow.find(".coinContainerModal").empty();
  // add "choose coin to replace this with"

  getSavedCoinsFromLocalStorage()
    .forEach(coin => {
      const coinCard = createCoinDisplayForModal(coin);
      coinCard.find(".saveCoinSwitch").on("click", () => {
        saveCoin(coindata);
        bootstrap.Modal.getOrCreateInstance(modalWindow).hide();
      });

      coinCard.appendTo(modalContent);
    });
  // // update all modal coins
  // modalContent.find(".saveCoinSwitch").on("click", () => {
  //   // select new coin
  //   // saveCoin(coindata);
  //   // close modal
  //   bootstrap.Modal.getOrCreateInstance(modalWindow).hide();
  // });
  // TAKE TO SEPARATE FUNCTION
  createCoinDisplayForModal(coindata)
    .appendTo(modalContent)
    .find(".saveCoinSwitch")
    .prop("indeterminate", true)
    .prop("disabled", true);
  // open modal
  bootstrap.Modal.getOrCreateInstance(modalWindow).show();

}






function getMoreInfoAboutCoin(coinId) {


  return new Promise((resolve, reject) => {

    //
    // check if local storage
    // let coinData; // declaring here so it doesnt get lost inside an inner scope
    const coinDataJSON = localStorage.getItem(coinId);

    if (coinDataJSON !== null) {

      // data is in local storage but might be expired
      const coinData = JSON.parse(coinDataJSON);

      if (coinData.expirationTimestamp > Date.now()) {
        // not expired
        setTimeout(() => resolve(coinData)); // without timeout the promise will resolve before it gets returned
      }
      // else: expired
      // remove? it will be overwritten anyway (i guess unless theres an error)

    }
    // local storage is empty

    getMoreInfoFromAPI(coinId)
      .fail(
        response => {
          reject(response);
        }
      )
      .done(data => {

        const coinData = {
          image: data.image.large,
          currentPrice: {
            usd: data.market_data.current_price.usd,
            eur: data.market_data.current_price.eur,
            ils: data.market_data.current_price.ils
          },
          expirationTimestamp: getExpirationTimestampForCoinData()
        };

        localStorage.setItem(coinId, JSON.stringify(coinData));
        setTimeout(() => localStorage.removeItem(coinId), getDurationForCoinData());
        resolve(coinData);
      });


  });
  // turn data into minified version with expiry timestamp
}



function getAllCoinsFromAPI() {

  return $.get("https://api.coingecko.com/api/v3/coins/list");
  // possibly add more settings?
  // this function is really tiny

}

function getMoreInfoFromAPI(coinId) {

  return $.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);

}



function getSavedCoinsFromLocalStorage() {

  const selectedCoinsJSON = localStorage.getItem("savedCoins");
  let selectedCoins;

  if (selectedCoinsJSON === null) {
    selectedCoins = [];

  } else {
    selectedCoins = JSON.parse(selectedCoinsJSON);
  }

  return selectedCoins;
}

function updateSavedCoinsToLocalStorage(selectedCoins) {

  const selectedCoinsJSON = JSON.stringify(selectedCoins);

  localStorage.setItem("savedCoins", selectedCoinsJSON);
}

function addSavedCoinToLocalStorage(coin) {

  const savedCoins = getSavedCoinsFromLocalStorage();
  savedCoins.push(coin);
  updateSavedCoinsToLocalStorage(savedCoins);

}

function removeSavedCoinFromLocalStorage(coin) {

  const savedCoins = getSavedCoinsFromLocalStorage();
  const updatedSavedCoins = savedCoins.filter(savedCoin => savedCoin.id !== coin.id);
  updateSavedCoinsToLocalStorage(updatedSavedCoins);

}






function showMoreInfoAboutCoin(coinId, moreInfoCollapser) {

  // show loading
  displayLoadingScreenForMoreInfo(moreInfoCollapser);
  moreInfoCollapser.show();


  getMoreInfoAboutCoin(coinId)
    .finally(() => moreInfoCollapser.empty())
    .then(coinData => displayMoreInfoAboutCoin(coinData, moreInfoCollapser))
    .catch(() => displayErrorForFetchingMoreInfoAboutCoin(moreInfoCollapser));

}

function hideMoreInfoAboutCoin(moreInfoCollapser) {

  moreInfoCollapser
    .hide()
    .empty();
}


function saveCoin(coin) {

  const selectedCoins = getSavedCoinsFromLocalStorage();

  if (selectedCoins.length < 5) {

    // add coin
    addSavedCoinToLocalStorage(coin);

    getCoinCard(coin.id).find(".saveCoinSwitch").prop("checked", true);

  } else {
    // too many coins already saved, you can't save this one
    unsaveCoin(coin);
    // getCoinCard(coin.id).find(".saveCoinSwitch").prop("checked", false);
    // prompt user to replace a coin
    openSelectionModalToReplaceCoinWith(coin);

  }
}

function unsaveCoin(coin) {
  // possible change coin to coinId

  removeSavedCoinFromLocalStorage(coin);

  getCoinCard(coin.id).find(".saveCoinSwitch").prop("checked", false);

}



function displaySearchLoadingIcon() {

  $("#coins-search-btn")
    .prop("disabled", true)
    .text("Loading...")
    .prepend(`<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>`);

}

function removeSearchLoadingIcon() {

  $("#coins-search-btn")
    .prop("disabled", false)
    .text("Search");
}


function onSearchCoin() {

  $("#no-results").hide();
  displaySearchLoadingIcon();

  setTimeout(() => {

    // get query
    const query = getSearchQueryForCoins();
    const filter = getSearchFilterForCoins();


    // if filters
    if (isSearchFilterForCoinsBySelectedOnly()) {

      searchSavedCoins(query).then(removeSearchLoadingIcon);

    } else {

      searchAllCoins(query).then(removeSearchLoadingIcon);

    }

  });

}

function getSearchQueryForCoins() {

  const coinSearchbar = $("#coins-searchbar");
  return coinSearchbar.val().toLowerCase();

}

function getSearchFilterForCoins() {

  const filterMenu = $("#coins-filtermenu");
  return filterMenu.val();

}

function searchAllCoins(query) {

  return new Promise((resolve, reject) => {

    const allCoins = $("#coin-list-container").children().hide();

    const filteredCoins = allCoins.filter(function () {

      const currentCoinSymbol = $(this).attr("data-coin-symbol").toLowerCase();

      return currentCoinSymbol.includes(query);

    });

    if (filteredCoins.length === 0) {

      // cant find any results, display appropriate message
      $("#no-results").show();

    } else {

      filteredCoins.show();

    }

    resolve();

  });
}

function searchSavedCoins(query) {

return new Promise((resolve, reject) => {

  const allCoins = $("#coin-list-container").children().hide();

  const filteredCoins = allCoins.filter(function () {

    const currentCoinSymbol = $(this).attr("data-coin-symbol").toLowerCase();

    const currentCoinId = $(this).attr("data-coin-id");
    const coinIsSaved = checkIfCoinIsSaved(currentCoinId);

    return (coinIsSaved && currentCoinSymbol.includes(query));

  });

  if (filteredCoins.length === 0) {

    // cant find any results, display appropriate message
    $("#no-results").show();

  } else {

    filteredCoins.show();

  }

  resolve();

});
}

function isSearchFilterForCoinsBySelectedOnly() {

  const filter = getSearchFilterForCoins();

  if (filter === "saved") {
    return true;
  }

  // (filter === "all")
  return false;

  // note: there is the option that the user somehow selected an option that doesn't exist
  // however it's not a big deal, since it can't do anything bad
  // so we will treat it as if there is no filter selected
}





// on stuff

// error handlers

function displayErrorForFetchingAllCoins(errorCode) { // UPDATE MESSAGE

  // check different codes for what the problem is

  const errorMessage = $("<div/>", {
      role: "alert",
      class: "alert alert-warning gx-0 gy-2 p-2 m-0"
    })
    .html(`We ran into a problem while trying to load the coins.
    <br />
    Please try again.`);

  $("#coin-list-container").replaceWith(errorMessage);

  // try again button?

}

function displayErrorForFetchingMoreInfoAboutCoin(parentElement) {


  const errorMessage = $("<div/>", {
      role: "alert",
      class: "alert alert-warning m-0"
    })
    .html(`We ran into a problem while trying to get more info.
    <br />
    Please try again.`);

  parentElement.empty()
    .append(errorMessage);


}

function displayPlaceholderImage() {

  $(this)
    .off("error") // prevents infinite loop in case of placeholder image not being available
    .attr("src", "./images/image_unavailable.jpeg"); // set new source
}






function getCoinCardId(coinId) {

  // easily change the ID format
  return `coin-${coinId}`;
}

function getCoinCard(coinId) {

  const coinCardId = getCoinCardId(coinId);
  return $(`#${coinCardId}`);
}


function checkIfCoinIsSaved(coinId) {

  const savedCoins = getSavedCoinsFromLocalStorage();
  const coinIsSaved = savedCoins.some(
    // coins are saved as objects, so compare their IDs
    savedCoin => (savedCoin.id === coinId)
  );
  return coinIsSaved;
}




function getDurationForCoinData() {

  let duration = 2; // minutes
  duration *= 60; // seconds
  duration *= 1000; // milliseconds

  return duration;

}

function getExpirationTimestampForCoinData() {

  const delayInMilliseconds = getDurationForCoinData();
  // convert to timestamp
  return Date.now() + delayInMilliseconds;
}

function getFormattedPriceString(price, currency) {

  // options for the currency format
  const options = {
    style: "currency",
    currency: currency,
    currencyDisplay: "narrowSymbol", // USD will display as "$" instead of "US$"
    minimumFractionDigits: 2,
    maximumFractionDigits: 20
  };
  const priceFormat = new Intl.NumberFormat(undefined, options); // undefined selects the default locale of the user

  return priceFormat.format(price);
}
