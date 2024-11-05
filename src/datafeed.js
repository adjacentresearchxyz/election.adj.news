import {
	requestSymbols,
	requestBars,
	generateSymbol,
	parseFullSymbol,
} from './helpers.js';
import {
	subscribeOnStream,
	unsubscribeFromStream,
} from './streaming.js';

const lastBarsCache = new Map();
// Declare symbols at module level so it's accessible everywhere
let symbols = [];

// DatafeedConfiguration implementation
const configurationData = {
	// Represents the resolutions for bars supported by your datafeed
	supported_resolutions: ['1', '30', '1D', '3D', '1W', '1M'],

	// The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
	exchanges: [
		{
			value: 'Polymarket',
			name: 'Polymarket',
			desc: 'Polymarket',
		},
		// {
		// 	value: "Kalshi",
		// 	name: "Kalshi",
		// 	desc: "Kalshi"
		// },
		// {
		// 	value: "Kalshi Election",
		// 	name: "Kalshi Election",
		// 	desc: "Kalshi Election"
		// }
	],
	// The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
	symbols_types: [{
		name: 'events',
		value: 'events',
	},
	],
};

// Obtains all symbols for all exchanges supported by CryptoCompare API
async function getAllSymbols() {
	// const privateKey = process.env.KALSHI_PRIVATE_KEY;
	// console.log(privateKey)
	const allSymbols = []
	// const data = await requestSymbols(`markets?active=true&archived=false&closed=false&liquidity_min=1000.0&volume_min=1000.0&limit=100&order=id&offset=${offset}&end_date_min=${minEndDate}`);
	// Fetch Polymarket tickers via historical raw data
	const polymarketResponse = await fetch('https://raw.api.data.adj.news/polymarket', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
	}})
	const polymarketData = (await polymarketResponse.json()).filter(market => market.active == true && market.archived == false);

	// // fetch kalshi tickers 
	// const kalshiResponse = await fetch('https://raw.api.data.adj.news/kalshi', {
	// 	method: 'GET',
	// 	headers: {
	// 		'Content-Type': 'application/json',
	// }})
	// const kalshiData = await kalshiResponse.json();

	// // fetch kalshi election tickers
	// const kalshiElectionResponse = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=1000&status=active', {
	// 	method: 'GET',
	// 	headers: {
	// 		'Content-Type': 'application/json',
	// }})
	// const kalshiElectionData = await kalshiElectionResponse.json();

	// polymarket data
	polymarketData.forEach(market => {
		allSymbols.push({
			symbol: `${market.market_slug}`,
			full_name: `${market.market_slug}`,
			description: market.question.replace('[Single Market] ', ''),
			// liquidity: market.liquidity,
			ids: market.tokens[0].token_id,
			exchange: 'Polymarket',
			type: 'event',
		});
	});
	// Shuffle the allSymbols array
	allSymbols.sort(() => Math.random() < 0.5 ? -1 : 1);

	// kalshi data 
	// kalshiData.forEach(market => {
	// 	allSymbols.push({
	// 		symbol: `${market.ticker}`,
	// 		full_name: `${market.title}`,
	// 		description: market.rules_primary,
	// 		// liquidity: market.liquidity,
	// 		ids: market.event_ticker,
	// 		exchange: 'Kalshi',
	// 		type: 'event',
	// 	});
	// });

	return allSymbols;
}

export default {
	onReady: async (callback) => {
		console.log('[onReady]: Method call');
		symbols = await getAllSymbols();
		setTimeout(() => callback(configurationData));
	},

	searchSymbols: async (
		userInput,
		exchange,
		symbolType,
		onResultReadyCallback,
	) => {
		console.log('[searchSymbols]: Method call');
		const searchTerms = userInput ? userInput.toLowerCase().split(/\s+/) : [];
		const newSymbols = symbols.filter(symbol => {
			const isExchangeValid = exchange === '' || symbol.exchange === exchange;
			const isFullSymbolContainsInput = searchTerms.every(term => symbol.full_name.toLowerCase().includes(term));
			return isExchangeValid && isFullSymbolContainsInput;
		}).slice(0, 15); // Limit to a maximum of 50 markets
		onResultReadyCallback(newSymbols);
	},

	resolveSymbol: async (
		symbolName,
		onSymbolResolvedCallback,
		onResolveErrorCallback,
		extension
	) => {
		console.log('[resolveSymbol]: Method call', symbolName);
		const symbols = await getAllSymbols();
		const symbolItem = symbols.find(({
			full_name,
		}) => full_name === symbolName);
		if (!symbolItem) {
			console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
			onResolveErrorCallback('cannot resolve symbol');
			return;
		}
		// Symbol information object
		const symbolInfo = {
			ticker: symbolItem.symbol,
			ids: symbolItem.ids,
			name: symbolItem.symbol,
			description: symbolItem.symbol,
			type: symbolItem.type,
			session: '24x7',
			timezone: 'Etc/UTC',
			exchange: symbolItem.exchange,
			minmov: 1,
			pricescale: 100,
			has_intraday: true,
			has_no_volume: true,
			has_weekly_and_monthly: true,
			supported_resolutions: configurationData.supported_resolutions,
			volume_precision: 2,
			data_status: 'streaming',
		};

		// console.log('[resolveSymbol]: Symbol resolved', symbolName);
		onSymbolResolvedCallback(symbolInfo);
	},

	getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
		const { from, to, firstDataRequest } = periodParams;
		// console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
		// const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
		// const parsedSymbol = 
		// const urlParameters = {
		// 	e: symbolInfo.exchange,
		// 	ticker: symbolInfo.ticker,
		// 	toTs: to,
		// 	limit: 2000,
		// };
		// const query = Object.keys(urlParameters)
		// 	.map(name => `${name}=${encodeURIComponent(urlParameters[name])}`)
		// 	.join('&');
		try {
			const marketId = symbolInfo.ids
			const data = await requestBars(`prices-history?market=${marketId}&interval=max`);

			if (data.history.length === 0) {
				// "noData" should be set if there is no data in the requested period
				onHistoryCallback([], {
					noData: true,
				});
				return;
			}
			let bars = [];
			data.history.forEach(bar => {
				if (bar.t >= from && bar.t < to) {
					bars = [...bars, {
						time: bar.t * 1000,
						low: bar.p * 100,
						high: bar.p * 100,
						open: bar.p * 100,
						close: bar.p * 100,
					}];
				}
			});

			if (firstDataRequest) {
				lastBarsCache.set(symbolInfo.full_name, {
					...bars[bars.length - 1],
				});
			}
			// console.log(`[getBars]: returned ${bars.length} bar(s)`);
			onHistoryCallback(bars, {
				noData: false,
			});
		} catch (error) {
			console.log('[getBars]: Get error', error);
			onErrorCallback(error);
		}
	},

	subscribeBars: (
		symbolInfo,
		resolution,
		onRealtimeCallback,
		subscriberUID,
		onResetCacheNeededCallback,
	) => {
		console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
		subscribeOnStream(
			symbolInfo,
			resolution,
			onRealtimeCallback,
			subscriberUID,
			onResetCacheNeededCallback,
			lastBarsCache.get(symbolInfo.full_name),
		);
	},

	unsubscribeBars: (subscriberUID) => {
		console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
		unsubscribeFromStream(subscriberUID);
	},
};
