# Задача 3 — Сервис прогноза погоды по городам
![Part_1](/images/weather.png)

## Описание
Сервис получает текущий прогноз погоды для указанного города, используя открытые API (Open-Meteo).
Данные кэшируются в Redis (или in-memory) на 15 минут.

## Технологии
- Node.js (TypeScript)
- Express.js
- Axios
- Redis
- Chart.js / HTML / CSS

## API
```
GET /weather?city={city}
```

## Установка и запуск
```bash
cd dev-test/task3_weather_service

# Install dependencies
npm install

# Build and run
npm run build
npm start
```




## Реализованные функции:
✅ Интеграция с API погоды

API геокодирования Open-Meteo

API прогноза погоды Open-Meteo

Данные о температуре за 24 часа

✅ Система кэширования

Кэш в памяти (TTL 15 минут)

Конечная точка состояния кэша

Автоматическая аннуляция кэша

✅ Создание диаграмм

Температурные диаграммы с использованием Chart.js

Визуализация прогноза за 24 часа

Создание изображений в формате PNG

✅ Интерфейс пользователя

Поиск городов с примерами

Отображение текущей погоды

Визуализация температурного графика

Индикатор состояния кэша

✅ Конечные точки API

GET /weather?city={city} - Данные о погоде

GET /weather/chart?city={city} - График температуры

GET /cache/status - Информация о кэше
## Пример
```
GET /weather?city=Berlin
```
Пример ответа:
```json
{
  "city": "Berlin",
  "hourly": {
    "time": ["10:00", "11:00", "12:00"],
    "temperature_2m": [13.4, 14.1, 15.0]
  }
}
```


