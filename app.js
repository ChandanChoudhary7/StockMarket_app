// Stock Market Tracker PWA - Main Application
class StockTracker {
  constructor() {
    this.data = {
      countries: [
        {"code": "IN", "name": "India", "flag": "🇮🇳"},
        {"code": "US", "name": "United States", "flag": "🇺🇸"}
      ],
      indian_indices: [
        {"symbol": "^NSEI", "name": "NIFTY 50", "displayName": "NIFTY 50"},
        {"symbol": "^BSESN", "name": "BSE SENSEX", "displayName": "BSE SENSEX"},
        {"symbol": "^NSEBANK", "name": "NIFTY BANK", "displayName": "NIFTY BANK"},
        {"symbol": "^NSEIT", "name": "NIFTY IT", "displayName": "NIFTY IT"},
        {"symbol": "NIFTYNXT50.NS", "name": "NIFTY NEXT 50", "displayName": "NIFTY NEXT 50"}
      ],
      us_indices: [
        {"symbol": "^GSPC", "name": "S&P 500", "displayName": "S&P 500"},
        {"symbol": "^DJI", "name": "DOW JONES", "displayName": "DOW JONES"},
        {"symbol": "^IXIC", "name": "NASDAQ", "displayName": "NASDAQ"},
        {"symbol": "^RUT", "name": "RUSSELL 2000", "displayName": "RUSSELL 2000"},
        {"symbol": "^VIX", "name": "VIX", "displayName": "VIX"}
      ],
      indian_stocks: [
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "displayName": "Reliance Industries"},
        {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "displayName": "TCS"},
        {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "displayName": "HDFC Bank"},
        {"symbol": "INFY.NS", "name": "Infosys", "displayName": "Infosys"},
        {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "displayName": "Hindustan Unilever"},
        {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "displayName": "ICICI Bank"},
        {"symbol": "SBIN.NS", "name": "State Bank of India", "displayName": "SBI"},
        {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "displayName": "Bharti Airtel"},
        {"symbol": "ITC.NS", "name": "ITC Limited", "displayName": "ITC"},
        {"symbol": "LT.NS", "name": "Larsen & Toubro", "displayName": "L&T"}
      ],
      us_stocks: [
        {"symbol": "AAPL", "name": "Apple Inc.", "displayName": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "displayName": "Microsoft"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "displayName": "Alphabet (Google)"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "displayName": "Amazon"},
        {"symbol": "TSLA", "name": "Tesla Inc.", "displayName": "Tesla"},
        {"symbol": "META", "name": "Meta Platforms Inc.", "displayName": "Meta (Facebook)"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "displayName": "NVIDIA"},
        {"symbol": "NFLX", "name": "Netflix Inc.", "displayName": "Netflix"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "displayName": "JPMorgan Chase"},
        {"symbol": "V", "name": "Visa Inc.", "displayName": "Visa"}
      ],
      default_selection: {
        "country": "IN",
        "type": "index",
        "symbol": "^NSEI"
      }
    };
    
    this.currentSymbol = this.data.default_selection.symbol;
    this.currentCountry = this.data.default_selection.country;
    this.refreshInterval = null;
    this.deferredPrompt = null;
    this.cache = new Map();
    this.apiProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://corsproxy.io/?'
    ];
    this.currentProxyIndex = 0;
    
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    this.setupPWA();
    this.populateCountryDropdown();
    this.populateSymbolDropdown();
    
    // Wait a moment for DOM to be ready, then fetch data
    setTimeout(() => {
      this.fetchData();
    }, 100);
    
    this.startAutoRefresh();
  }
  
  setupEventListeners() {
    // Country dropdown change
    const countrySelect = document.getElementById('countrySelect');
    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => {
        console.log('Country changed to:', e.target.value);
        this.currentCountry = e.target.value;
        this.populateSymbolDropdown();
        // Auto-select first option and fetch data
        const symbolSelect = document.getElementById('symbolSelect');
        if (symbolSelect && symbolSelect.options.length > 0) {
          this.currentSymbol = symbolSelect.value;
          this.fetchData();
        }
      });
    }
    
    // Symbol dropdown change
    const symbolSelect = document.getElementById('symbolSelect');
    if (symbolSelect) {
      symbolSelect.addEventListener('change', (e) => {
        console.log('Symbol changed to:', e.target.value);
        if (e.target.value) {
          this.currentSymbol = e.target.value;
          this.fetchData();
        }
      });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('Refresh button clicked');
        this.fetchData(true);
      });
    }
    
    // Install prompt handlers
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.installApp();
      });
    }
    
    const dismissInstall = document.getElementById('dismissInstall');
    if (dismissInstall) {
      dismissInstall.addEventListener('click', () => {
        this.hideInstallPrompt();
      });
    }
    
    // Online/offline detection
    window.addEventListener('online', () => {
      const indicator = document.getElementById('offlineIndicator');
      if (indicator) indicator.classList.add('hidden');
      this.fetchData();
    });
    
    window.addEventListener('offline', () => {
      const indicator = document.getElementById('offlineIndicator');
      if (indicator) indicator.classList.remove('hidden');
    });
  }
  
  setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(this.createServiceWorker())
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
    
    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      setTimeout(() => this.showInstallPrompt(), 5000); // Show after 5 seconds
    });
  }
  
  createServiceWorker() {
    const swCode = `
      const CACHE_NAME = 'stock-tracker-v1';
      const urlsToCache = [
        '/',
        '/index.html',
        '/style.css',
        '/app.js'
      ];

      self.addEventListener('install', function(event) {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then(function(cache) {
              return cache.addAll(urlsToCache);
            })
        );
      });

      self.addEventListener('fetch', function(event) {
        event.respondWith(
          caches.match(event.request)
            .then(function(response) {
              if (response) {
                return response;
              }
              return fetch(event.request);
            }
          )
        );
      });
    `;
    
    const blob = new Blob([swCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }
  
  populateCountryDropdown() {
    const select = document.getElementById('countrySelect');
    if (!select) return;
    
    select.innerHTML = '';
    
    this.data.countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = `${country.flag} ${country.name}`;
      if (country.code === this.currentCountry) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    console.log('Country dropdown populated with', select.children.length, 'options');
  }
  
  populateSymbolDropdown() {
    const select = document.getElementById('symbolSelect');
    if (!select) return;
    
    select.innerHTML = '';
    
    console.log('Populating symbols for country:', this.currentCountry);
    
    // Add indices
    const indicesGroup = document.createElement('optgroup');
    indicesGroup.label = '📊 Indices';
    
    const indices = this.currentCountry === 'IN' ? this.data.indian_indices : this.data.us_indices;
    indices.forEach(index => {
      const option = document.createElement('option');
      option.value = index.symbol;
      option.textContent = index.displayName;
      indicesGroup.appendChild(option);
    });
    
    select.appendChild(indicesGroup);
    
    // Add stocks
    const stocksGroup = document.createElement('optgroup');
    stocksGroup.label = '📈 Stocks';
    
    const stocks = this.currentCountry === 'IN' ? this.data.indian_stocks : this.data.us_stocks;
    stocks.forEach(stock => {
      const option = document.createElement('option');
      option.value = stock.symbol;
      option.textContent = stock.displayName;
      stocksGroup.appendChild(option);
    });
    
    select.appendChild(stocksGroup);
    
    // Set current symbol or default to first index
    if (indices.some(index => index.symbol === this.currentSymbol)) {
      select.value = this.currentSymbol;
    } else {
      this.currentSymbol = indices[0].symbol;
      select.value = this.currentSymbol;
    }
    
    console.log('Symbol dropdown populated with', select.children.length, 'optgroups, current symbol:', this.currentSymbol);
  }
  
  async fetchData(forceRefresh = false) {
    const cacheKey = this.currentSymbol;
    const now = Date.now();
    const cacheExpiry = 30000; // 30 seconds
    
    console.log('Fetching data for symbol:', this.currentSymbol);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < cacheExpiry) {
        console.log('Using cached data for', cacheKey);
        this.displayData(cached.data);
        return;
      }
    }
    
    this.showLoading();
    
    // Try multiple API approaches
    let lastError = null;
    
    // First try: Direct Yahoo Finance API
    try {
      const directUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(this.currentSymbol)}`;
      console.log('Trying direct API:', directUrl);
      
      const response = await fetch(directUrl);
      if (response.ok) {
        const data = await response.json();
        const stockData = await this.parseYahooData(data);
        this.cache.set(cacheKey, { data: stockData, timestamp: now });
        this.displayData(stockData);
        this.hideLoading();
        return;
      }
    } catch (error) {
      console.log('Direct API failed:', error.message);
      lastError = error;
    }
    
    // Second try: Use proxy services
    for (let i = 0; i < this.apiProxies.length; i++) {
      try {
        const proxy = this.apiProxies[i];
        const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(this.currentSymbol)}`;
        const url = proxy + encodeURIComponent(apiUrl);
        
        console.log('Trying proxy API:', proxy);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
          timeout: 10000
        });
        
        if (response.ok) {
          const data = await response.json();
          const stockData = await this.parseYahooData(data);
          this.cache.set(cacheKey, { data: stockData, timestamp: now });
          this.displayData(stockData);
          this.hideLoading();
          return;
        }
      } catch (error) {
        console.log(`Proxy ${this.apiProxies[i]} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If all methods fail, try mock data for demo
    console.log('All API methods failed, using mock data');
    this.displayMockData();
    this.hideLoading();
  }
  
  async parseYahooData(data) {
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid data structure received from API');
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0] || {};
    
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.previousClose || 0;
    
    return {
      symbol: meta.symbol,
      name: this.getDisplayName(meta.symbol),
      currency: meta.currency || 'USD',
      currentPrice: currentPrice,
      previousClose: previousClose,
      openPrice: meta.regularMarketOpen || previousClose,
      dayHigh: meta.regularMarketDayHigh || currentPrice,
      dayLow: meta.regularMarketDayLow || currentPrice,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || currentPrice * 1.2,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || currentPrice * 0.8,
      marketState: meta.marketState || 'CLOSED',
      regularMarketTime: meta.regularMarketTime || Math.floor(Date.now() / 1000),
      timezone: meta.timezone || 'UTC',
      change: currentPrice - previousClose,
      changePercent: previousClose ? ((currentPrice - previousClose) / previousClose * 100) : 0
    };
  }
  
  displayMockData() {
    // Generate realistic mock data for demo purposes
    const basePrice = this.currentCountry === 'IN' ? 24650 : 4350;
    const mockChange = (Math.random() - 0.5) * 100;
    
    const mockData = {
      symbol: this.currentSymbol,
      name: this.getDisplayName(this.currentSymbol),
      currency: this.currentCountry === 'IN' ? 'INR' : 'USD',
      currentPrice: basePrice + mockChange,
      previousClose: basePrice,
      openPrice: basePrice + (Math.random() - 0.5) * 50,
      dayHigh: basePrice + Math.abs(mockChange) + 50,
      dayLow: basePrice - Math.abs(mockChange) - 50,
      fiftyTwoWeekHigh: basePrice * 1.15,
      fiftyTwoWeekLow: basePrice * 0.85,
      marketState: 'CLOSED',
      regularMarketTime: Math.floor(Date.now() / 1000),
      timezone: this.currentCountry === 'IN' ? 'IST' : 'EST',
      change: mockChange,
      changePercent: (mockChange / basePrice) * 100
    };
    
    this.displayData(mockData);
  }
  
  getDisplayName(symbol) {
    const allSymbols = [
      ...this.data.indian_indices,
      ...this.data.us_indices,
      ...this.data.indian_stocks,
      ...this.data.us_stocks
    ];
    
    const found = allSymbols.find(item => item.symbol === symbol);
    return found ? found.displayName : symbol;
  }
  
  displayData(data) {
    console.log('Displaying data:', data);
    
    // Update stock header
    const nameEl = document.getElementById('stockName');
    const symbolEl = document.getElementById('stockSymbol');
    if (nameEl) nameEl.textContent = data.name;
    if (symbolEl) symbolEl.textContent = data.symbol;
    
    // Format currency
    const currencySymbol = data.currency === 'INR' ? '₹' : '$';
    
    // Current price
    const currentPriceEl = document.getElementById('currentPrice');
    if (currentPriceEl) {
      currentPriceEl.textContent = `${currencySymbol}${this.formatNumber(data.currentPrice)}`;
    }
    
    // Price change
    const changeEl = document.getElementById('priceChange');
    if (changeEl) {
      const changeText = `${data.change >= 0 ? '+' : ''}${this.formatNumber(data.change)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
      changeEl.textContent = changeText;
      changeEl.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Other data points
    const openPriceEl = document.getElementById('openPrice');
    if (openPriceEl) {
      openPriceEl.textContent = `${currencySymbol}${this.formatNumber(data.openPrice)}`;
    }
    
    const previousCloseEl = document.getElementById('previousClose');
    if (previousCloseEl) {
      previousCloseEl.textContent = `${currencySymbol}${this.formatNumber(data.previousClose)}`;
    }
    
    const allTimeHighEl = document.getElementById('allTimeHigh');
    if (allTimeHighEl) {
      allTimeHighEl.textContent = `${currencySymbol}${this.formatNumber(data.fiftyTwoWeekHigh)}`;
    }
    
    // Calculate correction percentage
    const correctionPercent = ((data.fiftyTwoWeekHigh - data.currentPrice) / data.fiftyTwoWeekHigh) * 100;
    const correctionEl = document.getElementById('correctionPercent');
    if (correctionEl) {
      correctionEl.textContent = `-${correctionPercent.toFixed(2)}%`;
    }
    
    // Calculate upside percentage
    const upsidePercent = ((data.fiftyTwoWeekHigh - data.currentPrice) / data.currentPrice) * 100;
    const upsideEl = document.getElementById('upsidePercent');
    if (upsideEl) {
      upsideEl.textContent = `+${upsidePercent.toFixed(2)}%`;
    }
    
    // Market status
    const statusEl = document.getElementById('marketStatus');
    if (statusEl) {
      const isOpen = data.marketState === 'REGULAR' || data.marketState === 'PREPRE' || data.marketState === 'PRE';
      statusEl.textContent = isOpen ? 'Open' : 'Closed';
      statusEl.className = `data-value market-status ${isOpen ? 'open' : 'closed'}`;
    }
    
    // Last updated
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
      const lastUpdated = new Date(data.regularMarketTime * 1000).toLocaleString();
      lastUpdatedEl.textContent = lastUpdated;
    }
    
    // Show stock data
    const stockDataEl = document.getElementById('stockData');
    if (stockDataEl) {
      stockDataEl.classList.remove('hidden');
    }
    
    // Hide error if it was showing
    const errorEl = document.getElementById('errorContainer');
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }
  
  formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    } else {
      return num.toFixed(2);
    }
  }
  
  showLoading() {
    const loadingEl = document.getElementById('loadingContainer');
    const errorEl = document.getElementById('errorContainer');
    const stockEl = document.getElementById('stockData');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (stockEl) stockEl.classList.add('hidden');
    
    // Add spinning animation to refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.classList.add('refreshing');
      refreshBtn.disabled = true;
    }
  }
  
  hideLoading() {
    const loadingEl = document.getElementById('loadingContainer');
    if (loadingEl) loadingEl.classList.add('hidden');
    
    // Remove spinning animation from refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.classList.remove('refreshing');
      refreshBtn.disabled = false;
    }
  }
  
  showError(message) {
    const errorEl = document.getElementById('errorContainer');
    const messageEl = document.getElementById('errorMessage');
    const stockEl = document.getElementById('stockData');
    
    if (errorEl) errorEl.classList.remove('hidden');
    if (messageEl) messageEl.textContent = message;
    if (stockEl) stockEl.classList.add('hidden');
  }
  
  startAutoRefresh() {
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      if (navigator.onLine) {
        this.fetchData();
      }
    }, 30000);
  }
  
  showInstallPrompt() {
    const promptEl = document.getElementById('installPrompt');
    if (promptEl) promptEl.classList.remove('hidden');
  }
  
  hideInstallPrompt() {
    const promptEl = document.getElementById('installPrompt');
    if (promptEl) promptEl.classList.add('hidden');
  }
  
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.hideInstallPrompt();
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing StockTracker...');
  window.app = new StockTracker();
});

// Add to window for testing purposes
window.StockTracker = StockTracker;
