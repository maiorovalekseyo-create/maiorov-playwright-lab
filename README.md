# maiorov-playwright-lab

Отдельная лаборатория автоматического тестирования сайта через Playwright Test и GitHub Actions.

## Что проверяется

- загрузка `https://demo.playwright.dev/todomvc`;
- создание новой задачи;
- переключение задачи в выполненное состояние;
- desktop viewport `1440 × 900`;
- mobile viewport `390 × 844` с touch/mobile context;
- необработанные JavaScript-ошибки и ошибки browser console;
- неудачные запросы ресурсов и ответы ресурсов с HTTP-статусом `400+`.

Каждый успешный проект сохраняет полноразмерный скриншот. GitHub Actions всегда загружает HTML-отчёт Playwright и `test-results` единым артефактом.

## Локальный запуск

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

Основной подтверждаемый результат — запуск workflow **Playwright tests** на `ubuntu-latest`.

