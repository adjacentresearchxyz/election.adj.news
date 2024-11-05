// Datafeed implementation
import Datafeed from './datafeed.js';
const urlParams = new URLSearchParams(window.location.search);
const symbol = urlParams.get('symbol') || 'will-donald-trump-win-the-2024-us-presidential-election'; // Default symbol

const markets = [
	'will-a-republican-win-pennsylvania-presidential-election',
	'will-a-republican-win-michigan-presidential-election',
	'will-a-republican-win-wisconsin-presidential-election',
	'will-a-republican-win-arizona-presidential-election',
	'will-a-republican-win-georgia-presidential-election',
	'will-a-republican-win-north-carolina-presidential-election',
	'will-a-republican-win-nevada-presidential-election',
	'will-a-republican-win-florida-in-the-2024-us-presidential-election',
	'will-a-republican-win-ohio-in-the-2024-us-presidential-election-2024',
];

const data = Datafeed;

// Load TradingView widgets after prefetching data
for (let i = 1; i <= 9; i++) {
	window[`tvWidget_${i}`] = new TradingView.widget({
		symbol: markets[i - 1].toLowerCase(),
		interval: '15',
		fullscreen: false,
		container: `tv_chart_container_${i}`,
		datafeed: data,
		library_path: '../charting_library_cloned_data/charting_library/',
		autosize: true,
		disabled_features: ["header_widget", "left_toolbar"],
		timezone: "America/New_York",
		overrides: {
			"mainSeriesProperties.style": 3
		}
	});
}