"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
const weatherCache = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
// Routes
app.get('/weather', async (req, res) => {
    try {
        const city = req.query.city;
        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }
        // Check cache
        const cached = weatherCache[city.toLowerCase()];
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            console.log(`Serving from cache: ${city}`);
            return res.json({
                ...cached.data,
                cached: true,
                cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
            });
        }
        console.log(`Fetching fresh data for: ${city}`);
        // Step 1: Geocoding
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            return res.status(404).json({ error: 'City not found' });
        }
        const location = geoData.results[0];
        const { latitude, longitude } = location;
        // Step 2: Weather data
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current_weather=true&timezone=auto`);
        const weatherData = await weatherResponse.json();
        // Process data
        const processedData = {
            city: location.name,
            latitude,
            longitude,
            hourly: {
                time: weatherData.hourly.time.slice(0, 24), // Next 24 hours
                temperature: weatherData.hourly.temperature_2m.slice(0, 24)
            },
            current: {
                temperature: weatherData.current_weather.temperature,
                weatherCode: weatherData.current_weather.weathercode
            }
        };
        // Update cache
        weatherCache[city.toLowerCase()] = {
            data: processedData,
            timestamp: Date.now()
        };
        res.json({
            ...processedData,
            cached: false
        });
    }
    catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});
// NEW: Chart data endpoint for frontend chart generation
app.get('/weather/chart-data', async (req, res) => {
    try {
        const city = req.query.city;
        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }
        // Get weather data (will use cache if available)
        const weatherResponse = await fetch(`http://localhost:${PORT}/weather?city=${encodeURIComponent(city)}`);
        const weatherData = await weatherResponse.json();
        if (!weatherData.hourly) {
            return res.status(404).json({ error: 'Weather data not found' });
        }
        // Prepare chart data
        const chartData = {
            labels: weatherData.hourly.time.map((time) => {
                const date = new Date(time);
                return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    hour12: false
                });
            }),
            temperatures: weatherData.hourly.temperature,
            city: weatherData.city
        };
        res.json(chartData);
    }
    catch (error) {
        console.error('Chart data error:', error);
        res.status(500).json({ error: 'Failed to generate chart data' });
    }
});
app.get('/cache/status', (req, res) => {
    const cacheStatus = Object.keys(weatherCache).map(city => ({
        city,
        age: Math.round((Date.now() - weatherCache[city].timestamp) / 1000),
        cached: (Date.now() - weatherCache[city].timestamp) < CACHE_TTL
    }));
    res.json({
        totalCached: cacheStatus.length,
        cacheTTL: CACHE_TTL / 1000,
        cities: cacheStatus
    });
});
// Frontend serving
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.listen(PORT, () => {
    console.log(`Weather service running on http://localhost:${PORT}`);
    console.log(`Endpoints:`);
    console.log(`  GET /weather?city={city} - Get weather data`);
    console.log(`  GET /weather/chart-data?city={city} - Get chart data`);
    console.log(`  GET /cache/status - Check cache status`);
});
