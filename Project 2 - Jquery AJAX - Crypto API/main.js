$(function () {

  "use strict";

  // API links
  // all coins - https://api.coingecko.com/api/v3/coins/list
  // specific coin - https://api.coingecko.com/api/v3/coins/{id}

/*
things to change:

- coin id is now on col element, not card element

- coin switches are now identified by the ".saveCoinSwitch" class

- coin more info collapsers no longer have an ID, and are now identified by the ".moreInfoCollapser" class

- showMoreInfoAboutCoin() now accept coinId AND the collapser element itself

*/


/*

additional stuff:

classes:
  saveCoinSwitch - input that adds coin to your saved stuff
  moreInfoCollapser - container for more info that also collapses
  moreInfoButton
  coinCard
  coinCardImage

*/



  // API getter functions

  function getAllCoinsFromAPI() { // returns ajax request

    return $.get("https://api.coingecko.com/api/v3/coins/list");

  }

  function getMoreInfoFromAPI(coinId) { // returns ajax request

    return $.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);

  }


  // local storage

  function getSelectedCoinsFromLocalStorage() {

    const selectedCoinsJSON = localStorage.getItem("selectedCoins");
    let selectedCoins;

    if (selectedCoinsJSON === null) {
      selectedCoins = [];

    } else {
      selectedCoins = JSON.parse(selectedCoinsJSON);
    }

    return selectedCoins;
  }

  function updateLocalStorageWithSelectedCoins(selectedCoins) {

    const selectedCoinsJSON = JSON.stringify(selectedCoins);

    localStorage.setItem("selectedCoins", selectedCoinsJSON);
  }






  // DOM creation functions

  function createCoinCard(coin) {

    const card = $("<div/>")
      .addClass("card coin-display h-100")
      .append(
        $("<div/>").addClass("card-body")
        .append(
          $("<div/>").addClass("coin-basic-information")
          .append(createCoinSwitchButton(coin.id))
          .append(createCoinTitle(coin.symbol))
          .append(createCoinDescription(coin.name))
        )
        .append(
          $("<div/>").addClass("coin-additional-information")
          .append(createCoinCollapser())
          .append(createCoinMoreInfoButton(coin.id))
        )
      );

    return $("<div/>", {
      id: `coin-${coin.id}`
    })
      .addClass("col")
      .append(card);

  }

  function createCoinSwitchButton(coinId) {

    return $("<div/>")
      .addClass("float-end ms-3")
      .append(
        $("<div/>")
        .addClass("form-check form-switch form-switch-lg")
        .append(
          $("<input/>", {
            type: "checkbox",
            role: "switch"
          })
          .addClass("form-check-input saveCoinSwitch")
          // turn on switch if the coin is saved
          .prop("checked", () => getSelectedCoinsFromLocalStorage().includes(coinId))
          // add click functionality
          .on("click", function () {

            if ($(this).prop("checked")) { // switch is turned on
              saveCoin(coinId);

            } else { // switch is turned off
              unsaveCoin(coinId);
            }
          })
        )
      );
  }

  function createCoinTitle(coinSymbol) {

    return $("<h3/>")
      .addClass("card-title")
      .text(coinSymbol);
  }

  function createCoinDescription(coinName) {

    return $("<p/>")
      .addClass("card-text")
      .text(coinName);
  }

  function createCoinCollapser() {

    return $("<div/>")
      .addClass("container-fluid mt-3 moreInfoCollapser")
      .hide();
  }

  function createCoinMoreInfoButton(coinId) {

    return $("<button/>")
      .addClass("btn btn-primary btn-more-info mt-3")
      .text("More Info")
      .on("click", () => {

        const moreInfoCollapser = $(`#coin-${coinId}`).find(".moreInfoCollapser");

        if (moreInfoCollapser.is(":hidden")) {
          // clicked to show
          showMoreInfoAboutCoin(moreInfoCollapser, coinId);

        } else {
          //
          hideMoreInfoAboutCoin(moreInfoCollapser);
        }
      });
  }

  function createMoreInfoAboutCoin(coinData) {

    return $("<div/>")
      .addClass("row align-items-center")
      .append(
        $("<div/>")
        .addClass("col-lg-auto col-md-6 col-auto mt-2")
        .append(
          $("<img/>")
          .attr("src", coinData.image)
          .addClass("coin-image")
          // in case no image is provided, use a placeholder
          .on("error", function () {
            $(this)
              .off("error")
              .attr("src", "./images/image_unavailable.jpeg"); // POSSIBLY CHANGE IMAGE
          })
        )
      ).append(
        $("<div/>")
        .addClass("col mt-2")
        // coin value part
        .append(
          $("<ul/>")
          .addClass("list-unstyled m-0")
          .append(
            createExchangeRateDisplayForCoin("USD", coinData.currentPrice.usd, "$")
          ).append(
            createExchangeRateDisplayForCoin("EUR", coinData.currentPrice.eur, "€")
          ).append(
            createExchangeRateDisplayForCoin("ILS", coinData.currentPrice.ils, "₪")
          )
        )
      );
  }

function createExchangeRateDisplayForCoin(currency, value, symbol) {

  // if no price is provided, we need to display it correctly
  const exchangeRateHasValue = (value !== undefined);

  return $("<li/>")
    .addClass("card-text font-monospace")
    .append(
      $("<span/>")
      .addClass("fw-bold me-2")
      .text(`${currency}: `)
    )
    .append(
      $("<span/>")
      .addClass(() => {
        if (exchangeRateHasValue) {
          return "text-success"
        } else {
          return "text-muted";
        }
      })
      .text(() => {
        if (exchangeRateHasValue) {
          return `${symbol}${value}`;
        } else {
          return "unavailable";
        }
      })
    );
}







  function displayCoin(coinInformation, parentElement) {

    createCoinCard(coinInformation).appendTo(parentElement);

  }

  function displayAllCoins(coins, parentElement) {

    // coins.forEach(coin => {
    //   displayCoin(coin, parentElement);
    // });

    for (let i = 0; i < 100; i++) { // for development
      displayCoin(coins[i], parentElement);
    }

  }

  function displayMoreInfoAboutCoin(coinData, parentElement) {

    createMoreInfoAboutCoin(coinData).appendTo(parentElement);

  }






});
