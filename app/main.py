from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.auth import router as auth_router
from app.posts import router as posts_router
from app.friends import router as friends_router 

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

# Создаем приложение
app = FastAPI(title="Социальная сеть", version="1.0.0")

# Подключаем статические файлы
app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем роутеры
app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(friends_router) 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)