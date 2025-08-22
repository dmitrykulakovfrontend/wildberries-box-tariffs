Для полной работоспособности необходим json ключ от гугл таблиц(см. google_sheets_key.example.json), и добавить в доступ к редактированию таблицы емейл из сервисного аккаунта от проекта гугл таблиц и добавить в .env API ключ от wildberries

для добавления таблиц достаточно изменить src\postgres\seeds\spreadsheets.js

## Команды:

Запуск базы данных:

```bash
docker compose up -d --build postgres
```

Для выполнения миграций и сидов не из контейнера:

```bash
npm run knex:dev migrate latest
```

```bash
npm run knex:dev seed run
```

Также можно использовать и остальные команды (`migrate make <name>`,`migrate up`, `migrate down` и т.д.)

Для запуска приложения в режиме разработки:

```bash
npm run dev
```

Запуск проверки самого приложения:

```bash
docker compose up -d --build app
```

Для финальной проверки рекомендую:

```bash
docker compose down --rmi local --volumes
docker compose up --build
```

PS: С наилучшими пожеланиями!
