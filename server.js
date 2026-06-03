const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Access Token (1 year valid) ──────────────────────────────────────────────
const ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN;

// ─── NSE Symbol to Instrument Key mapping ────────────────────────────────────
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
  'BAJAJFINSV': 'NSE_EQ|INE918I01026',
  'EICHERMOT': 'NSE_EQ|INE066A01021',
  'HEROMOTOCO': 'NSE_EQ|INE158A01026',
  'APOLLOHOSP': 'NSE_EQ|INE437A01024',
  'TATACONSUM': 'NSE_EQ|INE192A01025',
  'INDUSINDBK': 'NSE_EQ|INE095A01012',
  'NESTLEIND': 'NSE_EQ|INE239A01016',
  'ULTRACEMCO': 'NSE_EQ|INE481G01011',
  'DIVISLAB': 'NSE_EQ|INE361B01024',
  'PIDILITIND': 'NSE_EQ|INE318A01026',
  'SIEMENS': 'NSE_EQ|INE003A01024',
  'HAVELLS': 'NSE_EQ|INE176B01034',
  'DMART': 'NSE_EQ|INE192R01011',
  'BAJAJ-AUTO': 'NSE_EQ|INE917I01010',
  'M&M': 'NSE_EQ|INE101A01026',
  'ASIANPAINT': 'NSE_EQ|INE021A01026',
  'VEDL': 'NSE_EQ|INE205A01025',
  'GRASIM': 'NSE_EQ|INE047A01021',
  'TATAPOWER': 'NSE_EQ|INE245A01021',
  'ADANIPORTS': 'NSE_EQ|INE742F01042',
};

const headers = () => ({
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Accept': 'application/json'
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: '✅ SHREEM Backend Live',
    token: ACCESS_TOKEN ? '✅ Token Set' : '❌ Token Missing',
    endpoints: {
      candles: '/candles/:symbol/:interval',
      quote: '/quote/:symbol',
      quotes: 'POST /quotes { symbols: [] }',
      instruments: '/instruments'
    },
    intervals: ['1minute', '5minute', '15minute', '30minute', '1day', '1week', '1month']
  });
});

// ─── Get historical candles ───────────────────────────────────────────────────
app.get('/candles/:symbol/:interval', async (req, res) => {
  if (!ACCESS_TOKEN) return res.status(401).json({ error: 'UPSTOX_ACCESS_TOKEN not set in environment' });

  const symbol = req.params.symbol.toUpperCase();
  const interval = req.params.interval;
  const instrumentKey = NSE_INSTRUMENTS[symbol];

  if (!instrumentKey) {
    return res.status(404).json({ error: `Symbol ${symbol} not found. Add to NSE_INSTRUMENTS map.` });
  }

  const validIntervals = ['1minute', '5minute', '15minute', '30minute', '1day', '1week', '1month'];
  if (!validIntervals.includes(interval)) {
    return res.status(400).json({ error: `Invalid interval. Use: ${validIntervals.join(', ')}` });
  }

  try {
    let url, candles;

    if (['1minute', '5minute', '15minute', '30minute'].includes(interval)) {
      // Intraday — today's data
      url = `https://api.upstox.com/v2/historical-candle/intraday/${encodeURIComponent(instrumentKey)}/${interval}`;
      const response = await axios.get(url, { headers: headers() });
      candles = response.data.data?.candles || [];
    } else {
      // Historical — last 200 days/weeks/months
      const toDate = new Date().toISOString().split('T')[0];
      let fromDate;
      if (interval === '1day') fromDate = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      else if (interval === '1week') fromDate = new Date(Date.now() - 800 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      else fromDate = new Date(Date.now() - 3500 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      url = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toDate}/${fromDate}`;
      const response = await axios.get(url, { headers: headers() });
      candles = response.data.data?.candles || [];
    }

    // Format: oldest first
    const formatted = candles.map(c => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseInt(c[5])
    })).reverse();

    res.json({
      symbol,
      interval,
      candles: formatted,
      count: formatted.length
    });

  } catch (e) {
    console.error('Candles error:', e.response?.data || e.message);
    res.status(500).json({
      error: 'Failed to fetch candles',
      details: e.response?.data || e.message
    });
  }
});

// ─── Live quote single symbol ─────────────────────────────────────────────────
app.get('/quote/:symbol', async (req, res) => {
  if (!ACCESS_TOKEN) return res.status(401).json({ error: 'Token not set' });

  const symbol = req.params.symbol.toUpperCase();
  const instrumentKey = NSE_INSTRUMENTS[symbol];
  if (!instrumentKey) return res.status(404).json({ error: `${symbol} not found` });

  try {
    const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`;
    const response = await axios.get(url, { headers: headers() });

    const key = Object.keys(response.data.data || {})[0];
    const data = response.data.data?.[key];
    if (!data) return res.status(404).json({ error: 'No quote data' });

    res.json({
      symbol,
      ltp: data.last_price,
      open: data.ohlc?.open,
      high: data.ohlc?.high,
      low: data.ohlc?.low,
      close: data.ohlc?.close,
      change: data.net_change,
      changePct: ((data.last_price - data.ohlc?.close) / data.ohlc?.close * 100).toFixed(2),
      volume: data.volume,
      avgPrice: data.average_price,
      upperCircuit: data.upper_circuit_limit,
      lowerCircuit: data.lower_circuit_limit
    });

  } catch (e) {
    res.status(500).json({ error: 'Quote failed', details: e.response?.data || e.message });
  }
});

// ─── Multiple quotes ──────────────────────────────────────────────────────────
app.post('/quotes', async (req, res) => {
  if (!ACCESS_TOKEN) return res.status(401).json({ error: 'Token not set' });

  const { symbols } = req.body;
  if (!symbols || !Array.isArray(symbols)) return res.status(400).json({ error: 'symbols array required' });

  const validSymbols = symbols.filter(s => NSE_INSTRUMENTS[s.toUpperCase()]);
  if (validSymbols.length === 0) return res.status(404).json({ error: 'No valid symbols' });

  const keys = validSymbols.map(s => NSE_INSTRUMENTS[s.toUpperCase()]);

  try {
    const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(keys.join(','))}`;
    const response = await axios.get(url, { headers: headers() });

    const result = {};
    Object.entries(response.data.data || {}).forEach(([key, data]) => {
      // Find symbol from instrument key
      const sym = Object.entries(NSE_INSTRUMENTS).find(([s, k]) => k === key.replace(':', '|'))?.[0];
      if (sym) {
        result[sym] = {
          ltp: data.last_price,
          open: data.ohlc?.open,
          high: data.ohlc?.high,
          low: data.ohlc?.low,
          close: data.ohlc?.close,
          change: data.net_change,
          changePct: ((data.last_price - data.ohlc?.close) / data.ohlc?.close * 100).toFixed(2),
          volume: data.volume
        };
      }
    });

    res.json(result);

  } catch (e) {
    res.status(500).json({ error: 'Quotes failed', details: e.response?.data || e.message });
  }
});

// ─── List all supported instruments ──────────────────────────────────────────
app.get('/instruments', (req, res) => {
  res.json({
    count: Object.keys(NSE_INSTRUMENTS).length,
    symbols: Object.keys(NSE_INSTRUMENTS).sort()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SHREEM Backend running on port ${PORT}`);
  console.log(`✅ Token: ${ACCESS_TOKEN ? 'SET' : 'MISSING'}`);
  console.log(`📊 Supported symbols: ${Object.keys(NSE_INSTRUMENTS).length}`);
});
