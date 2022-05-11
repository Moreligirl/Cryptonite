/*
SEARCH

container -> get children -> for each:
  find .card-title
  if (search is in text)
    col -> show
  else
    col -> hide
*/

function searchAllCoins(query) {

  $("#coin-list-container").children()
    .each(function () {

      if ($(this).find(".card-title").text().toLowerCase().includes(query.toLowerCase())) {

        $(this).show();

      } else {

        $(this).hide();
      }
    })
}

function searchSavedCoins(query) {

  $("#coin-list-container").children()
    .each(function () {

      const currentCoinId = $(this).find(".card").attr("id").slice(5); // slice to cut off the "coin-" part
      const currentCoinSymbol = $(this).find(".card-title").text().toLowerCase();
      const selectedCoins = getSavedCoinsFromLocalStorage();

      if (selectedCoins.includes(currentCoinId) && currentCoinSymbol.includes(query.toLowerCase())) {

        $(this).show();

      } else {

        $(this).hide();
      }
    })
}



function getSearchQueryForCoins() {

  const coinSearchbar = $("#coins-searchbar");
  return coinSearchbar.val();

}

function getSearchFilterForCoins() {

  const filterMenu = $("#coins-filtermenu");
  return filterMenu.val();

}

function isSearchFilterForCoinsBySelectedOnly() {

  const filter = getSearchFilterForCoins();

  if (filter === "selected") {
    return true;
  }

  // (filter === "all")
  return false;

  // note: there is the option that the user somehow selected an option that doesn't exist
  // however it's not a big deal, since it can't do anything bad
  // so we will treat it as if there is no filter selected
}



function onSearchCoin() {

  // get query
  const query = getSearchQueryForCoins();
  // get filters

  // if filters
  if (isSearchFilterForCoinsBySelectedOnly()) {

    searchSavedCoins(query);

  } else {

    searchAllCoins(query);

  }

  // reset searchbar
  // reset checkbox

  // searchAllCoins(query);
}
$("#coins-search-btn").on("click", onSearchCoin);







// START




