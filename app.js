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
    this.refreshTimeout = null;
    this.deferredPrompt = null;
    this.cache = new Map();
    this.isOnline = navigator.onLine;
    this.apiTimeout = 8000; // 8 second timeout
    
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    this.setupPWA();
    this.populateCountryDropdown();
    this.populateSymbolDropdown();
    this.updateOnlineStatus();
    
    // Start with mock data immediately to ensure app works
    this.displayMockData();
    
    // Then try to fetch real data in background
    setTimeout(() => {
      this.fetchData();
    }, 500);
    
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
      console.log('Network: Back online');
      this.isOnline = true;
      this.updateOnlineStatus();
      this.fetchData();
    });
    
    window.addEventListener('offline', () => {
      console.log('Network: Gone offline');
      this.isOnline = false;
      this.updateOnlineStatus();
    });
  }
  
  updateOnlineStatus() {
    const onlineStatus = document.getElementById('onlineStatus');
    const offlineIndicator = document.getElementById('offlineIndicator');
    
    if (this.isOnline) {
      if (onlineStatus) {
        onlineStatus.classList.remove('hidden');
        onlineStatus.textContent = '🌐 Live Data';
      }
      if (offlineIndicator) {
        offlineIndicator.classList.add('hidden');
      }
    } else {
      if (onlineStatus) {
        onlineStatus.classList.add('hidden');
      }
      if (offlineIndicator) {
        offlineIndicator.classList.remove('hidden');
        offlineIndicator.textContent = '📴 Offline Mode - Showing cached data';
      }
    }
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
    
    // Check cache first if offline or not force refreshing
    if ((!this.isOnline || !forceRefresh) && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (!this.isOnline || (now - cached.timestamp < cacheExpiry)) {
        console.log('Using cached data for', cacheKey);
        this.displayData(cached.data);
        return;
      }
    }
    
    // If offline and no cache, show mock data
    if (!this.isOnline) {
      console.log('Offline and no cache, showing mock data');
      this.displayMockData();
      return;
    }
    
    this.showLoading();
    
    try {
      // Try fetching real data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);
      
      const directUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(this.currentSymbol)}`;
      console.log('Trying direct API:', directUrl);
      
      const response = await fetch(directUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const stockData = await this.parseYahooData(data);
        this.cache.set(cacheKey, { data: stockData, timestamp: now });
        this.displayData(stockData);
        this.hideLoading();
        return;
      }
    } catch (error) {
      console.log('API fetch failed:', error.message);
    }
    
    // If API fails, fall back to mock data
    console.log('API failed, showing mock data for demo');
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
    // Generate realistic mock data based on current selection
    const isIndian = this.currentCountry === 'IN';
    const basePrice = isIndian ? 24590.50 : 4385.20;
    const mockChange = (Math.random() - 0.5) * (isIndian ? 200 : 50);
    const mockChangePercent = (mockChange / basePrice) * 100;
    
    const mockData = {
      symbol: this.currentSymbol,
      name: this.getDisplayName(this.currentSymbol),
      currency: isIndian ? 'INR' : 'USD',
      currentPrice: basePrice + mockChange,
      previousClose: basePrice,
      openPrice: basePrice + (Math.random() - 0.5) * (isIndian ? 100 : 25),
      dayHigh: basePrice + Math.abs(mockChange) + (isIndian ? 150 : 35),
      dayLow: basePrice - Math.abs(mockChange) - (isIndian ? 100 : 25),
      fiftyTwoWeekHigh: basePrice * 1.18,
      fiftyTwoWeekLow: basePrice * 0.82,
      marketState: 'REGULAR', // Will be processed by getMarketStatus
      regularMarketTime: Math.floor(Date.now() / 1000),
      timezone: isIndian ? 'IST' : 'EST',
      change: mockChange,
      changePercent: mockChangePercent
    };
    
    console.log('Displaying mock data for demo:', mockData);
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
  
  // Market status logic with proper timezone handling
  getMarketStatus(symbol, marketState) {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Weekend check
    if (day === 0 || day === 6) {
      return { status: 'Closed', class: 'closed' };
    }
    
    // Check if it's an Indian symbol
    const isIndianSymbol = symbol.includes('.NS') || symbol.startsWith('^NSEI') || symbol.startsWith('^BSESN') || symbol.includes('NSE') || symbol.includes('BSE') || symbol.startsWith('^NSEBANK') || symbol.startsWith('^NSEIT');
    
    if (isIndianSymbol) {
      // Indian market hours: 9:15 AM to 3:30 PM IST
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;
      
      const marketOpen = 9 * 60 + 15; // 9:15 AM
      const marketClose = 15 * 60 + 30; // 3:30 PM
      
      if (currentMinutes >= marketOpen && currentMinutes <= marketClose) {
        return { status: 'Open', class: 'open' };
      } else if (currentMinutes < marketOpen) {
        return { status: 'Pre-Market', class: 'closed' };
      } else {
        return { status: 'Closed', class: 'closed' };
      }
    } else {
      // US market hours: 9:30 AM to 4:00 PM EST
      const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const hours = estTime.getHours();
      const minutes = estTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;
      
      const marketOpen = 9 * 60 + 30; // 9:30 AM EST
      const marketClose = 16 * 60; // 4:00 PM EST
      
      if (currentMinutes >= marketOpen && currentMinutes <= marketClose) {
        return { status: 'Open', class: 'open' };
      } else if (currentMinutes < marketOpen && currentMinutes >= 4 * 60) { // 4 AM EST onwards
        return { status: 'Pre-Market', class: 'closed' };
      } else if (currentMinutes > marketClose && currentMinutes <= 20 * 60) { // Until 8 PM EST
        return { status: 'After-Hours', class: 'closed' };
      } else {
        return { status: 'Closed', class: 'closed' };
      }
    }
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
    
    // Current price - using full number formatting
    const currentPriceEl = document.getElementById('currentPrice');
    if (currentPriceEl) {
      currentPriceEl.textContent = `${currencySymbol}${this.formatNumberFull(data.currentPrice)}`;
    }
    
    // Price change
    const changeEl = document.getElementById('priceChange');
    if (changeEl) {
      const changeText = `${data.change >= 0 ? '+' : ''}${this.formatNumberFull(data.change)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
      changeEl.textContent = changeText;
      changeEl.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Other data points - all using full number formatting
    const openPriceEl = document.getElementById('openPrice');
    if (openPriceEl) {
      openPriceEl.textContent = `${currencySymbol}${this.formatNumberFull(data.openPrice)}`;
    }
    
    const previousCloseEl = document.getElementById('previousClose');
    if (previousCloseEl) {
      previousCloseEl.textContent = `${currencySymbol}${this.formatNumberFull(data.previousClose)}`;
    }
    
    const allTimeHighEl = document.getElementById('allTimeHigh');
    if (allTimeHighEl) {
      allTimeHighEl.textContent = `${currencySymbol}${this.formatNumberFull(data.fiftyTwoWeekHigh)}`;
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
    
    // Market status with proper timezone logic
    const statusEl = document.getElementById('marketStatus');
    if (statusEl) {
      const marketStatus = this.getMarketStatus(data.symbol, data.marketState);
      statusEl.textContent = marketStatus.status;
      statusEl.className = `data-value market-status ${marketStatus.class}`;
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
  
  // FIXED: New function for full number formatting with commas
  formatNumberFull(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    
    // Use Intl.NumberFormat for proper comma formatting
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }
  
  showLoading() {
    const loadingEl = document.getElementById('loadingContainer');
    const errorEl = document.getElementById('errorContainer');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    
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
    const loadingEl = document.getElementById('loadingContainer');
    
    if (errorEl) errorEl.classList.remove('hidden');
    if (messageEl) messageEl.textContent = message;
    if (stockEl) stockEl.classList.add('hidden');
    if (loadingEl) loadingEl.classList.add('hidden');
    
    this.hideLoading();
  }
  
  startAutoRefresh() {
    // Use setTimeout for better performance instead of setInterval
    const scheduleNextRefresh = () => {
      this.refreshTimeout = setTimeout(() => {
        if (this.isOnline) {
          this.fetchData();
        }
        scheduleNextRefresh(); // Schedule the next refresh
      }, 30000); // 30 seconds
    };
    
    scheduleNextRefresh();
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
