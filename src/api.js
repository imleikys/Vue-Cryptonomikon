const API_KEY =
  "1a4576fa6aa3d03d52fce93eaf302da200481cadd4b8d3b2035f27ecde75df46";

const tickersHandlers = new Map();

export const loadTickers = async () => {
  if (tickersHandlers.size === 0) {
    return;
  }

  try {
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
        ...tickersHandlers.keys(),
      ].join(",")}&tsyms=USD&api_key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((rawData) => {
        const updatedPrices = Object.fromEntries(
          Object.entries(rawData).map(([key, value]) => [key, value.USD])
        );

        Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
          const handlers = tickersHandlers.get(currency) ?? [];
          handlers.forEach(fn => fn(newPrice))
        });
      });
    return response;
  } catch (errorMSG) {
    console.error(errorMSG);
  }
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
};

window.tickers = tickersHandlers;
setInterval(loadTickers, 3500);
