const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { WebsocketClient } = require('upstox-js-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// ─── CONFIG — Render.com pe Environment Variables set karna ───────────────────
const UPSTOX_API_KEY = process.env.UPSTOX_API_KEY;
const UPSTOX_SECRET = process.env.UPSTOX_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://swapniljagtap.in/upstox-callback';

let accessToken = null;
let tokenExpiry = null;

// ─── Candle store — live candles banate hain ticks se ────────────────────────
const candleStore = {}; // { 'NSE_EQ|INE002A01018': { '1min': [...], '5min': [...] } }
const subscribers = new Set(); // SSE clients

// ─── Step 1: Login URL generate karo ─────────────────────────────────────────
app.get('/auth/login', (req, res) => {
  const url = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(url);
});

// ─── Step 2: Callback — code ko token mein convert karo ──────────────────────
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code received');

  try {
    const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', {
      code,
      client_id: UPSTOX_API_KEY,
      client_secret: UPSTOX_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    console.log('✅ Upstox token received');
    
    // WebSocket connect karo
    connectWebSocket();
    
    res.send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#0a0c10;color:#00d4aa;">
        <h2>✅ SHREEM Backend Connected!</h2>
        <p>Upstox login successful. Live data ab aa raha hai.</p>
        <p style="color:#7a8799;">Token valid hai. WebSocket connected.</p>
      </body></html>
    `);
  } catch (e) {
    console.error('Token error:', e.response?.data || e.message);
    res.status(500).send('Token exchange failed: ' + JSON.stringify(e.response?.data));
  }
});

// ─── Token status check ───────────────────────────────────────────────────────
app.get('/auth/status', (req, res) => {
  res.json({
    connected: !!accessToken,
    expiry: tokenExpiry ? new Date(tokenExpiry).toISOString() : null,
    valid: tokenExpiry ? Date.now() < tokenExpiry : false
  });
});

// ─── Instrument search — NSE symbol to Upstox key ────────────────────────────
const NSE_INSTRUMENTS = {
  'RELIANCE': 'NSE_EQ|INE002A01018',
  'TCS': 'NSE_EQ|INE467B01029',
  'HDFCBANK': 'NSE_EQ|INE040A01034',
  'INFY': 'NSE_EQ|INE009A01021',
  'ICICIBANK': 'NSE_EQ|INE090A01021',
  'HINDUNILVR': 'NSE_EQ|INE030A01027',
  'SBIN': 'NSE_EQ|INE062A01020',
  'BHARTIARTL': 'NSE_EQ|INE397D01024',
  'ITC': 'NSE_EQ|INE154A01025',
  'KOTAKBANK': 'NSE_EQ|INE237A01028',
  'WIPRO': 'NSE_EQ|INE075A01022',
  'AXISBANK': 'NSE_EQ|INE238A01034',
  'BAJFINANCE': 'NSE_EQ|INE296A01024',
  'TATAMOTORS': 'NSE_EQ|INE155A01022',
  'ADANIENT': 'NSE_EQ|INE423A01024',
  'SUNPHARMA': 'NSE_EQ|INE044A01036',
  'TITAN': 'NSE_EQ|INE280A01028',
  'ULTRACEMCO': 'NSE_EQ|INE481G01011',
  'NESTLEIND': 'NSE_EQ|INE239A01016',
  'MARUTI': 'NSE_EQ|INE585B01010',
  'LT': 'NSE_EQ|INE018A01030',
  'HCLTECH': 'NSE_EQ|INE860A01027',
  'POWERGRID': 'NSE_EQ|INE752E01010',
  'NTPC': 'NSE_EQ|INE733E01010',
  'ONGC': 'NSE_EQ|INE213A01029',
  'JSWSTEEL': 'NSE_EQ|INE019A01038',
  'TATASTEEL': 'NSE_EQ|INE081A01012',
  'HINDALCO': 'NSE_EQ|INE038A01020',
  'BPCL': 'NSE_EQ|INE029A01011',
  'COALINDIA': 'NSE_EQ|INE522F01014',
  'TECHM': 'NSE_EQ|INE669C01036',
  'DRREDDY': 'NSE_EQ|INE089A01023',
  'CIPLA': 'NSE_EQ|INE059A01026',
  'DIVISLAB': 'NSE_EQ|INE361B01024',
  'BAJAJFINSV': 'NSE_EQ|INE918I01026',
  'EICHERMOT': 'NSE_EQ|INE066A01021',
  'HEROMOTOCO': 'NSE_EQ|INE158A01026',
  'APOLLOHOSP': 'NSE_EQ|INE437A01024',
  'TATACONSUM': 'NSE_EQ|INE192A01025',
  'INDUSINDBK': 'NSE_EQ|INE095A01012',
};

// ─── Get instrument key from symbol ───────────────────────────────────────────
app.get('/instrument/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  
  // Check static map first
  if (NSE_INSTRUMENTS[symbol]) {
    return res.json({ key: NSE_INSTRUMENTS[symbol], symbol });
  }
  
  // Search via Upstox API
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const response = await axios.get(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ|${symbol}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    res.json({ key: `NSE_EQ|${symbol}`, symbol });
  } catch(e) {
    res.status(404).json({ error: 'Symbol not found' });
  }
});

// ─── Historical candles ───────────────────────────────────────────────────────
app.get('/candles/:symbol/:interval', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated. Login first: /auth/login' });
  
  const symbol = req.params.symbol.toUpperCase();
  const interval = req.params.interval; // 1minute, 5minute, 15minute, 30minute, 1day, 1week, 1month
  const instrumentKey = NSE_INSTRUMENTS[symbol] || `NSE_EQ|${symbol}`;
  
  // Date range
  const today = new Date();
  const toDate = today.toISOString().split('T')[0];
  const fromDate = new Date(today - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days
  
  try {
    let url;
    if (['1minute', '5minute', '15minute', '30minute'].includes(interval)) {
      url = `https://api.upstox.com/v2/historical-candle/intraday/${encodeURIComponent(instrumentKey)}/${interval}`;
    } else {
      url = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toDate}/${fromDate}`;
    }
    
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const candles = response.data.data?.candles || [];
    
    // Format: [timestamp, open, high, low, close, volume]
    const formatted = candles.map(c => ({
      time: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5]
    })).reverse(); // oldest first
    
    res.json({ symbol, interval, candles: formatted, count: formatted.length });
    
  } catch(e) {
    console.error('Candles error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Fetch failed', details: e.response?.data });
  }
});

// ─── Live quote (current price) ───────────────────────────────────────────────
app.get('/quote/:symbol', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });
  
  const symbol = req.params.symbol.toUpperCase();
  const instrumentKey = NSE_INSTRUMENTS[symbol] || `NSE_EQ|${symbol}`;
  
  try {
    const response = await axios.get(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const data = response.data.data?.[instrumentKey.replace('|', ':')];
    if (!data) return res.status(404).json({ error: 'No data' });
    
    res.json({
      symbol,
      price: data.last_price,
      open: data.ohlc?.open,
      high: data.ohlc?.high,
      low: data.ohlc?.low,
      close: data.ohlc?.close,
      change: data.net_change,
      changePct: data.net_change_percentage,
      volume: data.volume,
      ltp: data.last_price
    });
    
  } catch(e) {
    res.status(500).json({ error: 'Quote failed', details: e.response?.data });
  }
});

// ─── Multiple quotes ──────────────────────────────────────────────────────────
app.post('/quotes', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });
  
  const { symbols } = req.body;
  if (!symbols || !Array.isArray(symbols)) return res.status(400).json({ error: 'symbols array required' });
  
  const keys = symbols.map(s => NSE_INSTRUMENTS[s.toUpperCase()] || `NSE_EQ|${s.toUpperCase()}`);
  
  try {
    const response = await axios.get(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(keys.join(','))}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const result = {};
    symbols.forEach(sym => {
      const key = (NSE_INSTRUMENTS[sym.toUpperCase()] || `NSE_EQ|${sym.toUpperCase()}`).replace('|', ':');
      const data = response.data.data?.[key];
      if (data) {
        result[sym.toUpperCase()] = {
          price: data.last_price,
          change: data.net_change,
          changePct: data.net_change_percentage,
          volume: data.volume,
          open: data.ohlc?.open,
          high: data.ohlc?.high,
          low: data.ohlc?.low,
          close: data.ohlc?.close
        };
      }
    });
    
    res.json(result);
    
  } catch(e) {
    res.status(500).json({ error: 'Quotes failed' });
  }
});

// ─── SSE — Server Sent Events for live updates ────────────────────────────────
app.get('/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.write('data: {"type":"connected"}\n\n');
  
  subscribers.add(res);
  
  req.on('close', () => {
    subscribers.delete(res);
  });
});

// Broadcast to all SSE clients
function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  subscribers.forEach(client => {
    try { client.write(msg); } catch(e) { subscribers.delete(client); }
  });
}

// ─── WebSocket — Upstox live feed ─────────────────────────────────────────────
let wsClient = null;
let subscribedSymbols = new Set();

function connectWebSocket() {
  if (!accessToken) return;
  
  try {
    const { UpstoxClient } = require('upstox-js-sdk');
    const defaultClient = UpstoxClient.ApiClient.instance;
    defaultClient.authentications['OAUTH2'].accessToken = accessToken;
    
    const streamer = new UpstoxClient.WebsocketPortfolioStreamFeeder();
    // Use market streamer instead
    const marketStreamer = new UpstoxClient.WebsocketMarketDataStreamer();
    
    marketStreamer.connect().then(() => {
      console.log('✅ WebSocket connected');
      
      marketStreamer.on('message', (data) => {
        // Broadcast live tick to all SSE subscribers
        broadcast({ type: 'tick', data });
      });
      
      marketStreamer.on('error', (err) => {
        console.error('WS error:', err);
      });
      
      wsClient = marketStreamer;
    }).catch(err => {
      console.log('WS connect failed - will retry:', err.message);
    });
    
  } catch(e) {
    console.log('WebSocket setup note:', e.message);
  }
}

// Subscribe to symbols for live data
app.post('/subscribe', (req, res) => {
  const { symbols } = req.body;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });
  
  symbols.forEach(s => subscribedSymbols.add(s.toUpperCase()));
  
  if (wsClient) {
    const keys = [...subscribedSymbols].map(s => NSE_INSTRUMENTS[s] || `NSE_EQ|${s}`);
    wsClient.subscribe(keys, 'full');
  }
  
  res.json({ subscribed: [...subscribedSymbols] });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'SHREEM Backend Running ✅',
    authenticated: !!accessToken,
    tokenValid: tokenExpiry ? Date.now() < tokenExpiry : false,
    subscribers: subscribers.size,
    endpoints: {
      login: '/auth/login',
      status: '/auth/status',
      candles: '/candles/:symbol/:interval',
      quote: '/quote/:symbol',
      quotes: 'POST /quotes',
      live: '/live (SSE)',
      subscribe: 'POST /subscribe'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SHREEM Backend running on port ${PORT}`);
  console.log(`📡 Login: /auth/login`);
});
