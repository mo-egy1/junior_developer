# Задача 2 — Сервис обмена файлами

![Part_1](/images/File_Sharing.png)
# Complete File Structure
task2-file-service/
├── package.json
├── tsconfig.json
├── src/
│   └── server.ts
├── public/
│   └── index.html
├── uploads/
│   └── .gitkeep 
└── README.md 

## Описание
Сервис позволяет загружать файлы и получать временную ссылку для скачивания.
Файлы, не скачанные в течение определённого времени (например, 30 дней), автоматически удаляются.

## Технологии
- Node.js (TypeScript)
- Express.js
- Multer
- UUID
- fs/promises
- Без фреймворков (React, Vue и др.)

## Установка и запуск
```bash
cd dev-test/task2_file_share
npm install
npx tsc
node dist/server.js
```

Откройте в браузере:
```
http://localhost:3000
```

## Реализованные функции:
✅ Фронтенд (Vanilla JS/CSS/HTML)

Форма загрузки файлов с функцией перетаскивания

Индикатор хода загрузки

Отображение ссылки на скачивание

Панель статистики

✅ Бэкенд (Node.js/TypeScript)

Конечная точка загрузки файлов

Уникальные ссылки на скачивание

Автоматическая очистка файлов (30 дней)

Статистика файлов

Отсутствие зависимостей от фреймворка

✅ Дополнительные функции

Проверка размера файла (ограничение 100 МБ)

Подсчёт загрузок

Отслеживание метаданных файлов

Адаптивный дизайн

Сервис автоматически создаёт папку «Загрузки» и очищает файлы старше 30 дней каждый час.


## Примечание
File Service (Port 3000)
POST /api/upload - Upload file

GET /api/files/:id/download - Download file

GET /api/files/stats - Get statistics


