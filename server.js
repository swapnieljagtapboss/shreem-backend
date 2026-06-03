const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN;

// ─── Nifty 200 Instrument Keys ────────────────────────────────────────────────
const NSE_INSTRUMENTS = {
  // Nifty 50
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
  'LT': 'NSE_EQ|INE018A01030',
  'AXISBANK': 'NSE_EQ|INE238A01034',
  'BAJFINANCE': 'NSE_EQ|INE296A01024',
  'ASIANPAINT': 'NSE_EQ|INE021A01026',
  'MARUTI': 'NSE_EQ|INE585B01010',
  'HCLTECH': 'NSE_EQ|INE860A01027',
  'SUNPHARMA': 'NSE_EQ|INE044A01036',
  'TITAN': 'NSE_EQ|INE280A01028',
  'WIPRO': 'NSE_EQ|INE075A01022',
  'ULTRACEMCO': 'NSE_EQ|INE481G01011',
  'NESTLEIND': 'NSE_EQ|INE239A01016',
  'BAJAJFINSV': 'NSE_EQ|INE918I01026',
  'TATAMOTORS': 'NSE_EQ|INE155A01022',
  'ADANIENT': 'NSE_EQ|INE423A01024',
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
  'EICHERMOT': 'NSE_EQ|INE066A01021',
  'HEROMOTOCO': 'NSE_EQ|INE158A01026',
  'APOLLOHOSP': 'NSE_EQ|INE437A01024',
  'TATACONSUM': 'NSE_EQ|INE192A01025',
  'INDUSINDBK': 'NSE_EQ|INE095A01012',
  'ADANIPORTS': 'NSE_EQ|INE742F01042',
  'GRASIM': 'NSE_EQ|INE047A01021',
  'TATAPOWER': 'NSE_EQ|INE245A01021',
  'VEDL': 'NSE_EQ|INE205A01025',
  'BAJAJ-AUTO': 'NSE_EQ|INE917I01010',
  'M&M': 'NSE_EQ|INE101A01026',
  'PIDILITIND': 'NSE_EQ|INE318A01026',
  'SIEMENS': 'NSE_EQ|INE003A01024',
  'HAVELLS': 'NSE_EQ|INE176B01034',
  'DMART': 'NSE_EQ|INE192R01011',
  // Nifty Next 50
  'ZOMATO': 'NSE_EQ|INE758T01015',
  'ADANIGREEN': 'NSE_EQ|INE364U01010',
  'ADANITRANS': 'NSE_EQ|INE931S01010',
  'ADANIPOWER': 'NSE_EQ|INE814H01011',
  'AMBUJACEM': 'NSE_EQ|INE079A01024',
  'AUROPHARMA': 'NSE_EQ|INE406A01037',
  'BANDHANBNK': 'NSE_EQ|INE545U01014',
  'BERGEPAINT': 'NSE_EQ|INE463A01038',
  'BOSCHLTD': 'NSE_EQ|INE323A01026',
  'BRITANNIA': 'NSE_EQ|INE216A01030',
  'CHOLAFIN': 'NSE_EQ|INE121A01024',
  'COLPAL': 'NSE_EQ|INE259A01022',
  'DABUR': 'NSE_EQ|INE016A01026',
  'DLF': 'NSE_EQ|INE271C01023',
  'GAIL': 'NSE_EQ|INE129A01019',
  'GODREJCP': 'NSE_EQ|INE102D01028',
  'GODREJPROP': 'NSE_EQ|INE484J01027',
  'HAL': 'NSE_EQ|INE066F01020',
  'ICICIPRULI': 'NSE_EQ|INE726G01019',
  'ICICIGI': 'NSE_EQ|INE765G01017',
  'INDUSTOWER': 'NSE_EQ|INE121J01017',
  'IOC': 'NSE_EQ|INE242A01010',
  'IRCTC': 'NSE_EQ|INE335Y01020',
  'LUPIN': 'NSE_EQ|INE326A01037',
  'MARICO': 'NSE_EQ|INE196A01026',
  'MCDOWELL-N': 'NSE_EQ|INE854D01024',
  'NAUKRI': 'NSE_EQ|INE663F01024',
  'NHPC': 'NSE_EQ|INE848E01016',
  'NMDC': 'NSE_EQ|INE584A01023',
  'OFSS': 'NSE_EQ|INE881D01027',
  'PAGEIND': 'NSE_EQ|INE761H01022',
  'PEL': 'NSE_EQ|INE140A01024',
  'PETRONET': 'NSE_EQ|INE347G01014',
  'PFC': 'NSE_EQ|INE134E01011',
  'RECLTD': 'NSE_EQ|INE020B01018',
  'SAIL': 'NSE_EQ|INE114A01011',
  'SHREECEM': 'NSE_EQ|INE070A01015',
  'SRF': 'NSE_EQ|INE647A01010',
  'TORNTPHARM': 'NSE_EQ|INE685A01028',
  'TRENT': 'NSE_EQ|INE849A01020',
  'UBL': 'NSE_EQ|INE686F01025',
  'UNITDSPR': 'NSE_EQ|INE176B01034',
  'UPL': 'NSE_EQ|INE628A01036',
  'VOLTAS': 'NSE_EQ|INE226A01021',
  'ZEEL': 'NSE_EQ|INE256A01028',
  // Nifty Midcap / Others
  'ABCAPITAL': 'NSE_EQ|INE674K01013',
  'ABFRL': 'NSE_EQ|INE647O01011',
  'ALKEM': 'NSE_EQ|INE540L01014',
  'ANGELONE': 'NSE_EQ|INE732I01013',
  'APLAPOLLO': 'NSE_EQ|INE702C01027',
  'ATUL': 'NSE_EQ|INE100A01010',
  'AUBANK': 'NSE_EQ|INE949L01017',
  'BALKRISIND': 'NSE_EQ|INE787D01026',
  'BATAINDIA': 'NSE_EQ|INE176A01028',
  'BEL': 'NSE_EQ|INE263A01024',
  'BHARATFORG': 'NSE_EQ|INE465A01025',
  'BHEL': 'NSE_EQ|INE257A01026',
  'BIOCON': 'NSE_EQ|INE376G01013',
  'CANBK': 'NSE_EQ|INE476A01022',
  'CANFINHOME': 'NSE_EQ|INE477A01020',
  'CASTROLIND': 'NSE_EQ|INE172A01027',
  'CEATLTD': 'NSE_EQ|INE482A01020',
  'CENTRALBK': 'NSE_EQ|INE483A01010',
  'COFORGE': 'NSE_EQ|INE591G01017',
  'CONCOR': 'NSE_EQ|INE111A01025',
  'CROMPTON': 'NSE_EQ|INE299U01018',
  'CUMMINSIND': 'NSE_EQ|INE298A01020',
  'DEEPAKNTR': 'NSE_EQ|INE288B01029',
  'DELTACORP': 'NSE_EQ|INE124G01033',
  'DIXON': 'NSE_EQ|INE935N01020',
  'ESCORTS': 'NSE_EQ|INE042A01014',
  'EXIDEIND': 'NSE_EQ|INE302A01020',
  'FEDERALBNK': 'NSE_EQ|INE171A01029',
  'GLENMARK': 'NSE_EQ|INE935A01035',
  'GMRINFRA': 'NSE_EQ|INE776C01039',
  'GNFC': 'NSE_EQ|INE113A01013',
  'GRANULES': 'NSE_EQ|INE101D01020',
  'GSPL': 'NSE_EQ|INE246F01010',
  'HDFC': 'NSE_EQ|INE001A01036',
  'HDFCAMC': 'NSE_EQ|INE127D01025',
  'HDFCLIFE': 'NSE_EQ|INE795G01014',
  'IDFCFIRSTB': 'NSE_EQ|INE092T01019',
  'IEX': 'NSE_EQ|INE022Q01020',
  'IGL': 'NSE_EQ|INE203G01027',
  'INDIANB': 'NSE_EQ|INE562A01011',
  'INDIGO': 'NSE_EQ|INE646L01027',
  'IRB': 'NSE_EQ|INE821I01022',
  'IRFC': 'NSE_EQ|INE053F01010',
  'JINDALSTEL': 'NSE_EQ|INE749A01030',
  'JUBLFOOD': 'NSE_EQ|INE797F01020',
  'KANSAINER': 'NSE_EQ|INE613A01020',
  'KARURVYSYA': 'NSE_EQ|INE649A01019',
  'KOTAKMAHIN': 'NSE_EQ|INE237A01028',
  'LALPATHLAB': 'NSE_EQ|INE600L01024',
  'LAURUSLABS': 'NSE_EQ|INE947Q01028',
  'LICHSGFIN': 'NSE_EQ|INE115A01026',
  'LTIM': 'NSE_EQ|INE214T01019',
  'LTTS': 'NSE_EQ|INE010V01017',
  'M&MFIN': 'NSE_EQ|INE774D01024',
  'MANAPPURAM': 'NSE_EQ|INE522D01027',
  'MAZDOCK': 'NSE_EQ|INE101Q01018',
  'MCX': 'NSE_EQ|INE745G01035',
  'METROPOLIS': 'NSE_EQ|INE112L01020',
  'MFSL': 'NSE_EQ|INE549C01026',
  'MOTHERSON': 'NSE_EQ|INE775A01035',
  'MPHASIS': 'NSE_EQ|INE356A01018',
  'MRF': 'NSE_EQ|INE883A01011',
  'MUTHOOTFIN': 'NSE_EQ|INE414G01012',
  'NAM-INDIA': 'NSE_EQ|INE018E01016',
  'NATIONALUM': 'NSE_EQ|INE139A01034',
  'NIACL': 'NSE_EQ|INE269O01029',
  'NIPPONLIFE': 'NSE_EQ|INE298J01013',
  'OBEROIRLTY': 'NSE_EQ|INE093I01010',
  'OIL': 'NSE_EQ|INE274J01014',
  'PERSISTENT': 'NSE_EQ|INE262H01021',
  'PETRONET': 'NSE_EQ|INE347G01014',
  'PIIND': 'NSE_EQ|INE603J01030',
  'PNB': 'NSE_EQ|INE160A01022',
  'PNBHOUSING': 'NSE_EQ|INE572E01012',
  'POLYCAB': 'NSE_EQ|INE455K01017',
  'PVRINOX': 'NSE_EQ|INE191H01014',
  'RAMCOCEM': 'NSE_EQ|INE331A01037',
  'RBLBANK': 'NSE_EQ|INE976G01028',
  'ROUTE': 'NSE_EQ|INE433W01fourteen',
  'SBICARD': 'NSE_EQ|INE018E01016',
  'SBILIFE': 'NSE_EQ|INE123W01016',
  'SHRIRAMFIN': 'NSE_EQ|INE721A01013',
  'SONACOMS': 'NSE_EQ|INE073K01018',
  'STARHEALTH': 'NSE_EQ|INE701N01023',
  'SUMICHEM': 'NSE_EQ|INE793A01012',
  'SUNTV': 'NSE_EQ|INE424H01027',
  'SUPREMEIND': 'NSE_EQ|INE196A01026',
  'TATACHEM': 'NSE_EQ|INE092A01019',
  'TATACOMM': 'NSE_EQ|INE151A01013',
  'TATAELXSI': 'NSE_EQ|INE670A01012',
  'TIINDIA': 'NSE_EQ|INE289B01019',
  'TORNTPOWER': 'NSE_EQ|INE813H01021',
  'TVSMOTOR': 'NSE_EQ|INE494B01023',
  'UNIONBANK': 'NSE_EQ|INE692A01016',
  'VBL': 'NSE_EQ|INE200M01013',
  'WHIRLPOOL': 'NSE_EQ|INE716A01013',
  'YESBANK': 'NSE_EQ|INE528G01035',
  'ZYDUSLIFE': 'NSE_EQ|INE010B01027',
};

const headers = () => ({
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Accept': 'application/json'
});

// ─── Dynamic instrument lookup ────────────────────────────────────────────────
let instrumentCache = {};
let cacheLoaded = false;

async function loadInstruments() {
  try {
    const res = await axios.get('https://api.upstox.com/v2/instruments/NSE', {
      headers: headers()
    });
    if (res.data && Array.isArray(res.data)) {
      res.data.forEach(inst => {
        if (inst.segment === 'NSE_EQ') {
          instrumentCache[inst.trading_symbol] = `NSE_EQ|${inst.isin}`;
        }
      });
      cacheLoaded = true;
      console.log(`✅ Loaded ${Object.keys(instrumentCache).length} NSE instruments`);
    }
  } catch(e) {
    console.log('Instrument cache load skipped:', e.message);
  }
}

function getInstrumentKey(symbol) {
  const sym = symbol.toUpperCase();
  return NSE_INSTRUMENTS[sym] || instrumentCache[sym] || null;
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: '✅ SHREEM Backend Live',
    token: ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
    staticSymbols: Object.keys(NSE_INSTRUMENTS).length,
    cachedSymbols: Object.keys(instrumentCache).length,
    endpoints: {
      candles: 'GET /candles/:symbol/:interval',
      quote: 'GET /quote/:symbol',
      quotes: 'POST /quotes',
      instruments: 'GET /instruments'
    }
  });
});

// ─── Historical + Intraday candles ────────────────────────────────────────────
app.get('/candles/:symbol/:interval', async (req, res) => {
  if (!ACCESS_TOKEN) return res.status(401).json({ error: 'Token not set' });

  const symbol = req.params.symbol.toUpperCase();
  const interval = req.params.interval;
  const instrumentKey = getInstrumentKey(symbol);

  if (!instrumentKey) {
    return res.status(404).json({
      error: `Symbol ${symbol} not found`,
      tip: 'Check /instruments for supported symbols'
    });
  }

  try {
    let candles = [];

    if (['1minute', '30minute'].includes(interval)) {
      // Intraday candles
      const url = `https://api.upstox.com/v2/historical-candle/intraday/${encodeURIComponent(instrumentKey)}/${interval}`;
      const r = await axios.get(url, { headers: headers() });
      candles = r.data.data?.candles || [];
    } else {
      // Historical candles — Upstox accepts: day, week, month
      const toDate = new Date().toISOString().split('T')[0];
      const days = interval === 'day' ? 300 : interval === 'week' ? 800 : 3500;
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const url = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toDate}/${fromDate}`;
      const r = await axios.get(url, { headers: headers() });
      candles = r.data.data?.candles || [];
    }

    const formatted = candles.map(c => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseInt(c[5])
    })).reverse();

    res.json({ symbol, interval, candles: formatted, count: formatted.length });

  } catch (e) {
    res.status(500).json({ error: 'Failed', details: e.response?.data || e.message });
  }
});

// ─── Live quote ───────────────────────────────────────────────────────────────
app.get('/quote/:symbol', async (req, res) => {
  if (!ACCESS_TOKEN) return res.status(401).json({ error: 'Token not set' });

  const symbol = req.params.symbol.toUpperCase();
  const instrumentKey = getInstrumentKey(symbol);
  if (!instrumentKey) return res.status(404).json({ error: `${symbol} not found` });

  try {
    const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`;
    const r = await axios.get(url, { headers: headers() });
    const key = Object.keys(r.data.data || {})[0];
    const data = r.data.data?.[key];
    if (!data) return res.status(404).json({ error: 'No data' });

    res.json({
      symbol,
      ltp: data.last_price,
      open: data.ohlc?.open,
      high: data.ohlc?.high,
      low: data.ohlc?.low,
      prevClose: data.ohlc?.close,
      change: data.net_change,
      changePct: ((data.last_price - data.ohlc?.close) / data.ohlc?.close * 100).toFixed(2),
      volume: data.volume,
      avgPrice: data.average_price
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

  const pairs = symbols.map(s => ({ sym: s.toUpperCase(), key: getInstrumentKey(s) })).filter(p => p.key);
  if (!pairs.length) return res.status(404).json({ error: 'No valid symbols' });

  const keys = pairs.map(p => p.key);
  try {
    const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(keys.join(','))}`;
    const r = await axios.get(url, { headers: headers() });

    const result = {};
    pairs.forEach(({ sym, key }) => {
      const dataKey = Object.keys(r.data.data || {}).find(k => k.replace(':', '|') === key);
      const data = dataKey ? r.data.data[dataKey] : null;
      if (data) {
        result[sym] = {
          ltp: data.last_price,
          open: data.ohlc?.open,
          high: data.ohlc?.high,
          low: data.ohlc?.low,
          prevClose: data.ohlc?.close,
          change: data.net_change,
          changePct: ((data.last_price - data.ohlc?.close) / data.ohlc?.close * 100).toFixed(2),
          volume: data.volume
        };
      }
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed', details: e.response?.data || e.message });
  }
});

// ─── List instruments ─────────────────────────────────────────────────────────
app.get('/instruments', (req, res) => {
  const allSymbols = [...new Set([...Object.keys(NSE_INSTRUMENTS), ...Object.keys(instrumentCache)])].sort();
  res.json({ count: allSymbols.length, symbols: allSymbols });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 SHREEM Backend on port ${PORT}`);
  console.log(`✅ Token: ${ACCESS_TOKEN ? 'SET' : 'MISSING'}`);
  console.log(`📊 Static symbols: ${Object.keys(NSE_INSTRUMENTS).length}`);
  if (ACCESS_TOKEN) await loadInstruments();
});
