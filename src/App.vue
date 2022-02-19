<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
      v-if="loading"
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <div class="container">
      <app-add-ticker
        :tickers="tickers"
        @add-ticker="onAddHandler"
        @finish-loading="loading = false"
      ></app-add-ticker>
      <template v-if="tickers.length">
        <hr>
          <div>
            <button 
              class="mx-2 my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              @click="page--"
              :disabled="page === 1"
            >Назад</button>
            <button 
              class="mx-2 my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              @click="page++"
              :disabled="!hasNextPage"
            >Вперёд</button>
            <div>
              <p>Фильтр:</p> <input v-model="filter">
            </div>
          </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
            v-for="t in paginatedTickers"
            @click="onSelectTicker(t)"
            :class="{'border-2': selectedTicker === t, 'bg-red-100': t.price === '_'}"
            :key="t"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{t.name}} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{formatPrice(t.price)}}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
              @click.stop="onRemoveHandler(t)"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

      <app-graph
        :selectedTicker="selectedTicker"
        :graph="graph"
        @graph-resize="onGraphChange"
        @close-graph="onCloseGraph"
        v-if="selectedTicker.name !== undefined"
      ></app-graph>
    </div>
  </div>
</template>

<script>
import {subscribeToTicker, unsubscribeFromTicker} from './api';
import AppAddTicker from './components/AppAddTicker.vue';
import AppGraph from './components/AppGraph.vue';

export default {
  name: 'App',
  components: {
    AppAddTicker,
    AppGraph,
  },
  data() {
    return {
      loading: false,
      tickers: [],
      selectedTicker: {},
      graph: [],
      page: 1,
      filter: '',
      maxGraphElements: 1,
      graphSize: 1,
    };
  },

  created() {
    const windowData = Object.fromEntries(new URL(window.location).searchParams.entries());
    const localData = JSON.parse(localStorage.getItem('cryptonomicon-tokens-list'));

    const VALID_KEYS = ['filter', 'page'];

    VALID_KEYS.forEach(key => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });

    if (localData) {
      this.tickers = localData; 
      this.tickers.forEach(ticker => 
        subscribeToTicker(ticker.name, (newPrice) => this.updateTicker(ticker.name, newPrice))
      );
    }

    setInterval(this.updateTickers, 3500);
  },

  computed: {
    filteredTickers() {
      return this.tickers.filter(ticker => ticker.name.includes(this.filter))
    },

    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page
      }
    }
  },

  methods: {
    onAddHandler(ticker) {
      const currentTicker = { name: ticker, price: "_" };
      this.filter = '';

      this.tickers = [...this.tickers, currentTicker];
      subscribeToTicker(currentTicker.name, newPrice => {
        this.updateTicker(currentTicker.name, newPrice)
      });
    },
    
    formatPrice(price) {
      if (price === '_') {
        return price;
      }
      
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    onGraphChange(graphSize) {
      this.graphSize = graphSize;
      this.calculateMaxGraphElements();
    },

    updateTicker(tickerName, price) {
      this.tickers.filter(ticker => ticker.name === tickerName).forEach(
        ticker => {
          if (ticker === this.selectedTicker) {
            this.graph.push(ticker.price)

            while (this.graph.length > this.maxGraphElements) {
              this.graph.shift();
            }
          }
          ticker.price = price
        }
      )
    },

    calculateMaxGraphElements() {
      if (this.graphSize === undefined) {
        return;
      }
      this.maxGraphElements = this.graphSize.clientWidth / 38; 
    },

    onRemoveHandler(tickerToRemove) {
      this.tickers = this.tickers.filter((t) => t !== tickerToRemove);

      if (this.tickerToRemove === this.selectedTicker) {
        this.onCloseGraph();
      }

      unsubscribeFromTicker(tickerToRemove.name);
      localStorage.setItem('cryptonomicon-tokens-list', JSON.stringify(this.tickers));
    },

    onCloseGraph() {
      this.selectedTicker = {};
    },

    onSelectTicker(selectedTicker) {
      this.selectedTicker = selectedTicker;
    },
  },
  mounted() {
    window.addEventListener('resize', this.calculateMaxGraphElements);
    this.loading = true;
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.calculateMaxGraphElements);
  },

  watch: {
    selectedTicker: function() {
      this.graph = [];
      this.$nextTick().then(this.calculateMaxGraphElements);
    },

    tickers: function() {
      localStorage.setItem('cryptonomicon-tokens-list', JSON.stringify(this.tickers));
    },

    paginatedTickers: function() {
      if(this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },

    filter: function() {
      this.page = 1;
    },

    pageStateOptions: function(value) {
      window.history.pushState(null, document.title, `${window.location.pathname}?filter=${value.filter}&page=${value.page}`)
    },
  }
};
</script>
