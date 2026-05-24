# Программный модуль оценки производственных рисков

Программный модуль оценки производственных рисков ЗАО «Солигорский институт проблем ресурсосбережения с опытным производством» на основе статистических моделей.

## Технологии

- **Backend:** Python 3.13, FastAPI, SQLAlchemy, pandas, SciPy
- **Frontend:** React 19, TypeScript, shadcn/ui, recharts
- **База данных:** SQLite

## Запуск

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Приложение будет доступно на http://localhost:5173

## Функциональность

- Загрузка данных (CSV/Excel)
- Описательная статистика
- Тренд-анализ с прогнозом
- Анализ Пуассона
- FMEA-анализ (автоматический расчёт RPN)
- Экспорт отчётов в PDF (ГОСТ) и Excel
