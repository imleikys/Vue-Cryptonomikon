const API_KEY =
  "1a4576fa6aa3d03d52fce93eaf302da200481cadd4b8d3b2035f27ecde75df46";

const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)
const AGGREGATE_INDEX = "5";

socket.addEventListener('message', (e) => {
  const messageResponse = JSON.parse(e.data);
  if (messageResponse.TYPE !== AGGREGATE_INDEX) {
    return;
  }

  if (messageResponse.PRICE === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(messageResponse.FROMSYMBOL) ?? [];
  handlers.forEach(fn => fn(messageResponse.PRICE));

});

function sendMessageOnWS(message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message);
    return;
  }

  socket.addEventListener('open', () => {
    socket.send(message);
  }, {once: true});
}

function subscribeToTickerOnWS(ticker) {
  sendMessageOnWS(
    JSON.stringify({
      "action": "SubAdd",
      "subs": [`5~CCCAGG~${ticker}~USD`]
    })
  );
}

function unsubscribeFromTickerOnWS(ticker) {
  sendMessageOnWS(
    JSON.stringify({
      "action": "SubRemove",
      "subs": [`5~CCCAGG~${ticker}~USD`]
    })
  );
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWS(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWS(ticker);
};

window.tickers = tickersHandlers;
