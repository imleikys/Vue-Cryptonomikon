<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keydown.enter="onAddHandler"
            @input="onInputHandler"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-if="ticker.length"
          class="flex bg-white shadow-md p-1 rounded-md flex-wrap"
        >
          <span
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
            v-for="coin in sortedSuggests"
            :key="coin.Symbol"
            @click="onAddHandler(coin.Symbol)"
          >
            {{ coin.Symbol }}
          </span>
        </div>
        <div v-if="tickerError.length !== 0" class="text-sm text-red-600">
          {{ tickerError }}
        </div>
      </div>
    </div>
    <app-add-button @click="onAddHandler"></app-add-button>
  </section>
</template>

<script>
import AppAddButton from './AppAddButton.vue';

export default {
  props: {
    tickers: {
      type: Array,
      required: true,
    }
  },

  emits: {
    'add-ticker': (value) => typeof value === 'string',
    'finish-loading': null,
  },

  data() {
    return {
      ticker: '',
      tickerError: '',
      suggestCoins: [],
    }
  },

  methods: {
    onAddHandler(selectedCoin) {
      let currentTicker = ''; 
      if (typeof selectedCoin === "string") {
        currentTicker = selectedCoin.toUpperCase();
      } else {
        currentTicker = this.ticker.toUpperCase();
      }

      this.$props.tickers.forEach(ticker => {
        if (ticker.name === currentTicker) {
          this.tickerError = 'Такой тикер уже добавлен';
          return;
        }
      })

      if(this.tickerError) {
        return;
      }

      this.$emit('add-ticker', currentTicker);

      this.ticker = '';
      this.tickerError = '';
    },

    onInputHandler() {
      this.suggestCoins = Object.values(this.coins).filter((coin)=> coin.FullName.toLowerCase().includes(this.ticker.toLowerCase()));
      if (this.suggestCoins.length === 0) {
        this.tickerError = 'Монета не найдена';
      } else {
        this.tickerError = '';
      }
    },

    async getCoins() {
      try {
        const f = await fetch(
          'https://min-api.cryptocompare.com/data/all/coinlist?summary=true'
        )

        const response = await f.json();
        this.coins = response.Data;
      } catch (error) {
        console.warn(error);
      }

      this.$emit('finish-loading');
    }
  },

  computed: {
    sortedSuggests() {
      return this.suggestCoins.slice(0, 4);
    },
  },

  mounted() {
    this.getCoins();
  },

  components: {
    AppAddButton
  }
}
</script>
