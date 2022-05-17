$(function () {

  "use strict";


  // globals (for easy update)
  const moreInfoExpiryDuration = 2 * 60 * 1000; // 2 minutes

  // getters
  function getCoinCard(coinId) {
    return $(`#coin-${coinId}`);
  }

  function getAllCoins() {

    return new Promise((resolve, reject) => {

      const allCoinsJSON = localStorage.getItem("allCoins");

      if (allCoinsJSON === null) {

        getAllCoinsFromAPI()
          .fail(reject)
          .done(allCoins => {
            localStorage.setItem("allCoins", JSON.stringify(allCoins));
            resolve(allCoins);
          });

      } else {
        const allCoins = JSON.parse(allCoinsJSON);
        resolve(allCoins);
      }
    });
  }

  function getMoreInfoAboutCoin(coinId) {

    return new Promise((resolve, reject) => {

      const coinDataJSON = localStorage.getItem(coinId);

      if (coinDataJSON !== null) {
        // data is in local storage but might be expired
        const coinData = JSON.parse(coinDataJSON);

        if (coinData.expirationTimestamp > Date.now()) {
          // not expired
          setTimeout(() => resolve(coinData)); // without timeout the promise will resolve before it gets returned
        }
        // else: expired, get new info from server below
      }

      // we couldn't get more info from local storage, get it from server instead
      getMoreInfoFromAPI(coinId)
        .fail(reject)
        .done(data => {
          // get only relevant data
          const coinData = {
            image: data.image.large,
            currentPrice: {
              usd: data.market_data.current_price.usd,
              eur: data.market_data.current_price.eur,
              ils: data.market_data.current_price.ils
            },
            // in the case of the user leaving the page before the previous info was scheduled to be deleted, it will stay in storage; so add a timestamp to check if it's relevant
            expirationTimestamp: getExpirationTimestampForCoinData()
          };

          localStorage.setItem(coinId, JSON.stringify(coinData));
          setTimeout(() => localStorage.removeItem(coinId), moreInfoExpiryDuration);

          resolve(coinData);
        });
    });
  }




  // API getters

  function getAllCoinsFromAPI() {
    return $.get("https://api.coingecko.com/api/v3/coins/list");
  }

  function getMoreInfoFromAPI(coinId) {
    return $.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);
  }




  // DOM creation functions

  function createCoinCard(coin) {

    // create the BootStrap card element
    const card = $("<div/>")
      .addClass("card h-100 coinCard")
      .append(
        $("<div/>").addClass("card-body")
        .append(
          $("<div/>")
          .append(createCoinCardSaveCoinSwitch(coin))
          .append(createCoinCardTitle(coin.symbol))
          .append(createCoinCardDescription(coin.name))
        )
        .append(
          $("<div/>")
          .append(createCoinCardMoreInfoCollapser())
          .append(createCoinCardMoreInfoButton(coin.id))
        )
      );

    // store the card in a column element
    return $("<div/>")
      .attr({
        // store the coin's information without the need to get it out of the coincard's elements
        "data-coin-id": coin.id,
        "data-coin-symbol": coin.symbol
      })
      .addClass("col")
      .append(card);

  }

  function createCoinCardSaveCoinSwitch(coin) {

    // create the checkbox itself
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
          unsaveCoin(coin.id);
        }
      });

    // create the wrapper for the checkbox - this is purely cosmetic
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
      .text(coinSymbol.toUpperCase());
  }

  function createCoinCardDescription(coinName) {

    return $("<p/>")
      .addClass("card-text")
      .text(coinName);
  }

  function createCoinCardMoreInfoCollapser() {

    return $("<div/>")
      .addClass("container-fluid mt-3 moreInfoCollapser")
      // don't make it visible unless it is clicked to open
      .hide();
  }

  function createCoinCardMoreInfoButton(coinId) {

    return $("<button/>")
      .addClass("btn btn-primary moreInfoButton mt-3")
      .text("More Info")
      .on("click", function () {

        const moreInfoCollapser = $(this).closest(".coinCard") // get the coinCard parent,
          .find(".moreInfoCollapser"); // then get the collapser child

        // check to see if the collapser is currently hidden, to know if the button was clicked to show or hide more info
        if (moreInfoCollapser.is(":hidden")) {
          // clicked to show
          showMoreInfoAboutCoin(coinId, moreInfoCollapser);

        } else {
          // clicked to hide
          hideMoreInfoAboutCoin(moreInfoCollapser);
        }
      });
  }


  function createCoinCardMoreInfoAboutCoin(coinData) {

    // create the image element
    const coinImage = $("<img/>")
      .attr("src", coinData.image)
      .addClass("coinCardImage")
      // in case no image is provided, use a placeholder
      .on("error", displayPlaceholderImageForCoin);

    // create the price element
    const coinExchangeRate = $("<ul/>")
      .addClass("list-unstyled m-0")
      .append(createCoinCardMoreInfoExchangeRate("USD", coinData.currentPrice.usd))
      .append(createCoinCardMoreInfoExchangeRate("EUR", coinData.currentPrice.eur))
      .append(createCoinCardMoreInfoExchangeRate("ILS", coinData.currentPrice.ils));

    // construct it with grid layout
    return $("<div/>")
      .addClass("row align-items-center")
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

    // create the little currency symbol text thingy
    const currencyNameElement = $("<span/>")
      .addClass("fw-bold me-2")
      .text(`${currency}: `);

    // create the little text thingy with the price in it
    const priceValueElement = $("<span/>")
      .addClass(exchangeRateHasValue ? "text-primary" : "text-muted")
      .text(exchangeRateHasValue ? getFormattedPriceString(price, currency) : "unavailable");

    // construct it into pretty layout
    return $("<li/>")
      .addClass("card-text font-monospace")
      // add currency text
      .append(currencyNameElement)
      // add coin price text
      .append(priceValueElement);
  }


  function createCoinCardForModal(coin) {

    const newCard = createCoinCard(coin);

    // change switch behaviour - we don't want it to save, we want it to remove
    newCard.find(".saveCoinSwitch")
      .off("click")
      .on("click", () => {
        unsaveCoin(coin.id);
      });

    return newCard;
  }



  // actions

  function saveCoin(coin) {

    const savedCoins = getSavedCoinsFromLocalStorage();

    // make sure user didnt select too many coins
    if (savedCoins.length < 5) {

      addSavedCoinToLocalStorage(coin);
      // in most cases it would already be checked, but not if the function was called from the selection modal; I would still rather manually check it every time
      getCoinCard(coin.id).find(".saveCoinSwitch").prop("checked", true);

    } else {
      // too many coins already saved, user can't save this one
      unsaveCoin(coin.id);
      // prompt user to replace a coin
      openSelectionModalToReplaceCoinWith(coin);
    }
  }

  function unsaveCoin(coinId) {

    removeSavedCoinFromLocalStorage(coinId);
    // in most cases it would already be unchecked, but not if the function was called from the saveCoin function; I would still rather manually uncheck it every time
    getCoinCard(coinId).find(".saveCoinSwitch").prop("checked", false);
  }


  function showMoreInfoAboutCoin(coinId, coinMoreInfoCollapser) {

    // add loading bar
    displayLoadingScreenForMoreInfo(coinMoreInfoCollapser);
    // then make the collapser visible
    coinMoreInfoCollapser.show();


    getMoreInfoAboutCoin(coinId)
      .finally(() => coinMoreInfoCollapser.empty()) // get rid of the loading bar
      .then(moreInfoData => displayMoreInfoAboutCoin(moreInfoData, coinMoreInfoCollapser))
      .catch(() => displayErrorForFetchingMoreInfoAboutCoin(coinMoreInfoCollapser));

  }

  function hideMoreInfoAboutCoin(moreInfoCollapser) {
    moreInfoCollapser.hide().empty();
  }


  function openSelectionModalToReplaceCoinWith(newCoin) {

    const modalWindow = $("#selectCoinToRemoveModal");
    const modalContent = modalWindow.find(".coinContainerModal").empty();

    // add a coin card for every saved coin
    getSavedCoinsFromLocalStorage()
      .forEach(savedCoin => {
        const coinCard = createCoinCardForModal(savedCoin);
        coinCard.find(".saveCoinSwitch")
          .on("click", () => {
            saveCoin(newCoin);
            bootstrap.Modal.getOrCreateInstance(modalWindow).hide();
          });

        coinCard.appendTo(modalContent);
      });

    // add a coin card for the new coin, but make it not interactable
    createCoinCardForModal(newCoin)
      .appendTo(modalContent)
      .find(".saveCoinSwitch")
      .prop("indeterminate", true)
      .prop("disabled", true);

    // open modal
    bootstrap.Modal.getOrCreateInstance(modalWindow).show();
  }


  // display DOM

  function addCoinCardToPage(coinInformation, parentElement) {

    createCoinCard(coinInformation)
      .attr("id", `coin-${coinInformation.id}`)
      .appendTo(parentElement);

  }

  function displayAllCoinCards(coins) {

    return new Promise((resolve) => {

      const parentElement = $(`<div class="row row-cols-1 row-cols-md-3 g-3 p-0 m-0" id="coin-list-container"></div>`);

      coins.forEach(coin => {
        setTimeout(() => addCoinCardToPage(coin, parentElement)); // settimeout helps prevent the huge lag from rendering over 10k blocks of dynamically created html
      });

      setTimeout(() => {
        $("#coin-list-container").replaceWith(parentElement);
        resolve();
      });

    });

  }

  function displayMoreInfoAboutCoin(coinData, parentElement) {
    createCoinCardMoreInfoAboutCoin(coinData).appendTo(parentElement);
  }



  // loaders

  function displayCoinsLoading() {

    $("#coin-list-container").replaceWith(`
    <div class="row row-cols-1 row-cols-md-3 g-3 p-0 m-0" id="coin-list-container">

  <!-- placeholders will be removed once loading is finished -->

  <!-- card placeholder 1 -->

  <div class="col">
    <div class="card coinCard h-100 placeholder-glow">
      <div class="card-body">
        <div class="coin-basic-information">

          <div class="float-end ms-3">
            <div class="form-check form-switch form-switch-lg">
              <div class="form-check-input placeholder"></div>
            </div>
          </div>

          <h3 class="card-title placeholder col-4"></h3>

          <p class="card-text">
            <span class="placeholder col-3"></span>
            <span class="placeholder col-2"></span>
            <span class="placeholder col-4"></span>
            <span class="placeholder col-6"></span>
          </p>

        </div>

        <div class="coin-additional-information">
          <div class="btn btn-primary disabled placeholder mt-3 col-3"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- card placeholder 2 -->

  <div class="col">
    <div class="card coinCard h-100 placeholder-glow">
      <div class="card-body">
        <div class="coin-basic-information">
          <div class="float-end ms-3">
            <div class="form-check form-switch form-switch-lg">
              <div class="form-check-input placeholder"></div>
            </div>
          </div>

          <h3 class="card-title placeholder col-3"></h3>

          <p class="card-text">
            <span class="placeholder col-2"></span>
            <span class="placeholder col-4"></span>
            <span class="placeholder col-3"></span>
          </p>
        </div>

        <div class="coin-additional-information">
          <div class="btn btn-primary disabled placeholder mt-3 col-3"></div>
        </div>

      </div>
    </div>
  </div>

  <!-- card placeholder 3 -->

  <div class="col">
    <div class="card coinCard h-100 placeholder-glow">
      <div class="card-body">
        <div class="coin-basic-information">

          <div class="float-end ms-3">
            <div class="form-check form-switch form-switch-lg">
              <div class="form-check-input placeholder"></div>
            </div>
          </div>

          <h3 class="card-title placeholder col-4"></h3>

          <p class="card-text">
            <span class="placeholder col-3"></span>
            <span class="placeholder col-4"></span>
            <span class="placeholder col-5"></span>
          </p>

        </div>

        <div class="coin-additional-information">
          <div class="btn btn-primary disabled placeholder mt-3 col-3"></div>
        </div>

      </div>
    </div>
  </div>

  <!-- card placeholder 4 -->

  <div class="col">
    <div class="card coinCard h-100 placeholder-glow">
      <div class="card-body">
        <div class="coin-basic-information">

          <div class="float-end ms-3">
            <div class="form-check form-switch form-switch-lg">
              <div class="form-check-input placeholder"></div>
            </div>
          </div>

          <h3 class="card-title placeholder col-3"></h3>

          <p class="card-text">
            <span class="placeholder col-2"></span>
            <span class="placeholder col-1"></span>
            <span class="placeholder col-4"></span>
            <span class="placeholder col-2"></span>
          </p>

        </div>

        <div class="coin-additional-information">
          <div class="btn btn-primary disabled placeholder mt-3 col-3"></div>
        </div>

      </div>
    </div>
  </div>

  <!-- card placeholder 5 -->

  <div class="col">
    <div class="card coinCard h-100 placeholder-glow">
      <div class="card-body">
        <div class="coin-basic-information">
          <div class="float-end ms-3">
            <div class="form-check form-switch form-switch-lg">
              <div class="form-check-input placeholder"></div>
            </div>
          </div>

          <h3 class="card-title placeholder col-4"></h3>

          <p class="card-text">
            <span class="placeholder col-2"></span>
            <span class="placeholder col-5"></span>
            <span class="placeholder col-3"></span>
            <span class="placeholder col-4"></span>
          </p>

        </div>

        <div class="coin-additional-information">
          <div class="btn btn-primary disabled placeholder mt-3 col-3"></div>
        </div>

      </div>
    </div>
  </div>

  <!-- card placeholder 6 -->

  <div class="col">
    <div class="card coinCard h-100 placeholder-glow">
      <div class="card-body">
        <div class="coin-basic-information">

          <div class="float-end ms-3">
            <div class="form-check form-switch form-switch-lg">
              <div class="form-check-input placeholder"></div>
            </div>
          </div>

          <h3 class="card-title placeholder col-2"></h3>

          <p class="card-text">
            <span class="placeholder col-3"></span>
            <span class="placeholder col-1"></span>
            <span class="placeholder col-2"></span>
          </p>

        </div>

        <div class="coin-additional-information">
          <div class="btn btn-primary disabled placeholder mt-3 col-3"></div>
        </div>

      </div>
    </div>
  </div>

  <!-- end loaders -->
</div>
    `)
  }

  function displayLoadingScreenForMoreInfo(parentElement) {

    parentElement.html(`
<div class="row align-items-center placeholder-glow">
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
</div>`);
  }

  function displaySearchLoadingIcon() {
    $("#coins-search-btn")
      .prop("disabled", true)
      .text("Searching...")
      .prepend(`<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>`);
  }

  function removeSearchLoadingIcon() {
    $("#coins-search-btn")
      .prop("disabled", false)
      .text("Search");
  }


  // error handlers

  function displayPlaceholderImageForCoin() {

    $(this)
      .off("error") // prevents infinite loop in case of placeholder image not being available
      .attr("src", "./images/image_unavailable.jpeg"); // set new source
  }

  function displayErrorForFetchingAllCoins() {

    $("#coin-list-container").replaceWith(`
  <div role="alert" class="alert alert-warning gx-0 gy-2 p-2 m-0">
    We ran into a problem while trying to load the coins.
    <br />
    Please try again.
  </div>`);
  }

  function displayErrorForFetchingMoreInfoAboutCoin(parentElement) {

    parentElement.html(`
  <div class="alert alert-warning m-0" role="alert">
    We ran into a problem while trying to get more info.
    <br />
    Please try again.
  </div>
  `);
  }

  function displayMessageForNoSearchResults() {

    $("#coin-list-container").replaceWith(`
<div id="coin-list-container" class="row gx-0 gy-2 p-2 m-0">
  <div class="col">
    <div class="alert alert-warning fst-italic">
      We were unable to find any results that match your criteria.
    </div>
  </div>
</div>
    `);
  }


  // local storage

  function getSavedCoinsFromLocalStorage() {

    const savedCoinsJSON = localStorage.getItem("savedCoins");
    let savedCoins = []; // if item is not in local storage, use this value

    // check if localStorage item exists
    if (savedCoinsJSON !== null) {
      // item exists, parse it into savedCoins
      savedCoins = JSON.parse(savedCoinsJSON);
    }

    return savedCoins;
  }

  function updateSavedCoinsToLocalStorage(savedCoins) {

    const savedCoinsJSON = JSON.stringify(savedCoins);

    localStorage.setItem("savedCoins", savedCoinsJSON);
  }


  function addSavedCoinToLocalStorage(coin) {

    const savedCoins = getSavedCoinsFromLocalStorage();
    savedCoins.push(coin);
    updateSavedCoinsToLocalStorage(savedCoins);

  }

  function removeSavedCoinFromLocalStorage(targetCoinId) {

    let savedCoins = getSavedCoinsFromLocalStorage();
    // get a new array of all the coins whose id is not equal to targetCoinId
    savedCoins = savedCoins.filter(savedCoin => savedCoin.id !== targetCoinId);
    updateSavedCoinsToLocalStorage(savedCoins);

  }




  // search functionality

  async function onSearchCoin() {

    try {
      $("#no-results").hide();
      displaySearchLoadingIcon();
      displayCoinsLoading();

      const query = getSearchQueryForCoins();
      const filter = getSearchFilterForCoins();

      let coins;
      if (filter === "all") {
        coins = await getAllCoins();

      } else { // filter === "saved"
        coins = getSavedCoinsFromLocalStorage();
      }

      let filteredCoins;

      if (query === "") {
        filteredCoins = coins;

      } else {
        filteredCoins = await searchCoins(coins, query);
      }

      await displayAllCoinCards(filteredCoins);

    } catch {

      displayMessageForNoSearchResults();

    } finally {

      removeSearchLoadingIcon();

    }
  }


  function getSearchQueryForCoins() {
    return $("#coins-searchbar").val().trim().toLowerCase();
  }

  function getSearchFilterForCoins() {
    return $("#coins-filtermenu").val();
  }



  function searchCoins(allCoins, query) {

    return new Promise((resolve, reject) => {

      // get only relevant coins
      const filteredCoins = allCoins.filter(coin => {

        const currentCoinSymbol = coin.symbol.toLowerCase();

        return (currentCoinSymbol.includes(query));
      });

      // if no results, display an appropriate message
      if (filteredCoins.length > 0) {
        resolve(filteredCoins);

      } else {
        reject(); // reject
      }
    });
  }


  function checkIfCoinIsSaved(coinId) {

    const savedCoins = getSavedCoinsFromLocalStorage();
    const coinIsSaved = savedCoins.some(
      // coins are saved as objects, so compare their IDs
      savedCoin => (savedCoin.id === coinId)
    );
    return coinIsSaved;
  }



  // live reports functionality

  function activateLiveDataChart() {

    const savedCoinsSymbols = getSavedCoinsFromLocalStorage().map(coin => coin.symbol);
    const liveDataAPI = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${savedCoinsSymbols.join()}&tsyms=USD`;

    createSavedCoinsLiveDataChart(savedCoinsSymbols);

    // first API call - since the next ones will have a 2 second delay
    updateChart(liveDataAPI);
    // set it up for the chart to update every 2 seconds starting now
    const updateChartInterval = setInterval(updateChart, 2000, liveDataAPI);
    stopIntervalOnUserChangePage(updateChartInterval);
  }

  function updateChart(dataAPI) {
    $.get(dataAPI).done(updateSavedCoinsLiveDataChart);
  }

  function updateSavedCoinsLiveDataChart(liveData) {

    const time = Date.now();
    const chart = $("#liveReports").CanvasJSChart();

    chart.options.data.forEach(series => {

      const coin = series.name;
      const coinPrice = liveData[coin];

      if (coinPrice !== undefined) {
        series.dataPoints.push({
          x: time,
          y: coinPrice.USD
        });
      }
    });

    chart.render();
  }

  function createSavedCoinsLiveDataChart(coinsSymbols) {

    // chart options - mainly cosmetics
    const options = {
      backgroundColor: "transparent",
      axisX: {
        labelAngle: 0,
        minimum: Date.now() - 10000 // 10 seconds ago - prevents timestamps of "???ms"
      },
      axisY: {
        prefix: "$",
        gridColor: "rgba(0, 0, 0, 0.1)"
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        verticalAlign: "top",
        fontSize: 22,
        fontColor: "dimGrey",
        itemclick: toggleDataSeries
      },
      data: [] // set dynamically below
    };


    // fill chart with starter data
    coinsSymbols.forEach(coin => {

      options.data.push({
        type: "line",
        name: coin.toUpperCase(),
        xValueType: "dateTime",
        xValueFormatString: "hh:mm:ss TT",
        showInLegend: true,
        markerSize: 0,
        dataPoints: []
      });

    });


    // create chart object
    $("#liveReports").CanvasJSChart(options);
  }

  function toggleDataSeries(e) {
    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
      e.dataSeries.visible = false;
    } else {
      e.dataSeries.visible = true;
    }
    e.chart.render();
  }

  function stopIntervalOnUserChangePage(interval) {

    $(document).one("click", ".nav-link:not(#nav-reports)", () => {
      clearInterval(interval);
    });
  }


  // utility stuff

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


  function getExpirationTimestampForCoinData() {
    return Date.now() + moreInfoExpiryDuration;
  }




  // initialisers

  function loadAllCoinsToPage() {
    // display loading bar
    // const coinListContainer = $("#coin-list-container")

    // get coins from server
    getAllCoins()
      // then if successful, display coins
      .then(allCoins => displayAllCoinCards(allCoins))
      // then if unsuccessful, display an error
      .catch(displayErrorForFetchingAllCoins);
  }

  // navbar functionality

  function onNavMenuCoinsPage() {

    $("#main-content").load("./pages/coins.html", () => {
      setTimeout(loadAllCoinsToPage)
      $("#coins-search-btn").on("click", onSearchCoin);
    });

  }

  function onNavMenuReportsPage() {

    $("#main-content").load("./pages/reports.html", () => {
      activateLiveDataChart();
    });
  }

  function onNavMenuAboutPage() {
    $("#main-content").load("./pages/about.html");
  }


  function updateNavMenuActivePage() {

    $("#navigationMenu .nav-link.active").removeClass("active");
    $(this).addClass("active");

  }


  // final setup

  $("#nav-coins").on("click", onNavMenuCoinsPage);

  $("#nav-reports").on("click", onNavMenuReportsPage);

  $("#nav-about").on("click", onNavMenuAboutPage);

  $("#navigationMenu").on("click", ".nav-link", updateNavMenuActivePage);



  onNavMenuCoinsPage();

  // it's been a pleasure serving with you, chief.
  // I'm going to sleep.

});
