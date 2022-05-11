function displayAllCoins(coins) {

  const container = createCoinCardContainer();

  addCoinCardsToContainer(coins, container).then(container => {
    //
    $("#coin-list-container").replaceWith(container);

  });


}

function addCoinCardsToContainer(coins, container) {

  return new Promise((resolve, reject) => {

    coins.forEach(coin => {
      createCoinCard(coin)
        .then(coinCard => setTimeout(() => container.append(coinCard)));
    });

    resolve(container);
  });
}
