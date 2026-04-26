from fastapi import APIRouter, Request, Form, Depends, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
from app.database import get_db
from app.models import User
from app.utils import hash_password, generate_token, verify_password

router = APIRouter(tags=["auth"])

# Хранилище сессий
sessions_db = {}

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("session_token")
    if token and token in sessions_db:
        user_id = sessions_db[token]
        user = db.query(User).filter(User.id == user_id).first()
        return user
    return None

# HTML страницы
@router.get("/", response_class=HTMLResponse)
async def login_page():
    with open("static/authorization.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@router.get("/register", response_class=HTMLResponse)
async def register_page():
    with open("static/register.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@router.get("/wall", response_class=HTMLResponse)
async def wall_page(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return RedirectResponse(url="/", status_code=303)
    with open("static/wall.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@router.get("/logout")
async def logout():
    return RedirectResponse(url="/")

# API эндпоинты
@router.post("/api/register")
async def register(
    first_name: str = Form(...),
    last_name: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db)
):
    if password != confirm_password:
        return {"success": False, "message": "Пароли не совпадают"}
    
    if len(password) < 6:
        return {"success": False, "message": "Пароль должен быть не менее 6 символов"}
    
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        return {"success": False, "message": "Логин уже существует"}
    
    new_user = User(
        username=username,
        first_name=first_name,
        last_name=last_name,
        password_hash=hash_password(password)
    )
    db.add(new_user)
    db.commit()
    
    return {"success": True, "message": "Регистрация успешна"}

@router.post("/api/login")
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not verify_password(password, user.password_hash):
        return {"success": False, "message": "Неверный логин или пароль"}
    
    token = generate_token()
    sessions_db[token] = user.id
    
    return {"success": True, "token": token}

@router.post("/api/logout")
async def api_logout(request: Request):
    token = request.cookies.get("session_token")
    if token and token in sessions_db:
        del sessions_db[token]
    return {"success": True}

@router.get("/api/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    # Определяем путь к аватару
    avatar_url = user.avatar
    if not avatar_url or avatar_url == "":
        avatar_url = "/static/default-avatar.svg"
    
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": f"{user.first_name} {user.last_name}",
            "status": user.status or "",
            "avatar": avatar_url,
            "created_at": user.created_at.isoformat()
        }
    }

@router.put("/api/me/status")
async def update_status(
    request: Request,
    status: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    # Сохраняем статус в базу
    user.status = status
    db.commit()
    db.refresh(user)
    
    print(f"Статус пользователя {user.username} обновлен на: {status}")
    
    return {"success": True, "message": "Статус обновлен", "status": user.status}

@router.post("/api/me/avatar")
async def upload_avatar(
    request: Request,
    avatar: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if avatar.content_type not in allowed_types:
        return {"success": False, "message": "Разрешены только изображения (JPEG, PNG, GIF, WEBP)"}
    
    contents = await avatar.read()
    if len(contents) > 5 * 1024 * 1024:
        return {"success": False, "message": "Файл не должен превышать 5MB"}
    
    os.makedirs("static/uploads/avatars", exist_ok=True)
    
    file_extension = os.path.splitext(avatar.filename)[1]
    filename = f"user_{user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    filepath = os.path.join("static/uploads/avatars", filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(contents)
    
    if user.avatar and user.avatar != "/static/default-avatar.svg" and not user.avatar.startswith("/static/default-avatar"):
        old_filepath = os.path.join(".", user.avatar.lstrip('/'))
        if os.path.exists(old_filepath):
            os.remove(old_filepath)
    
    avatar_url = f"/static/uploads/avatars/{filename}"
    user.avatar = avatar_url
    db.commit()
    
    return {"success": True, "message": "Аватар обновлен", "avatar_url": avatar_url}

@router.get("/api/me/avatar")
async def get_avatar(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    avatar_url = user.avatar
    if not avatar_url or avatar_url == "":
        avatar_url = "/static/default-avatar.svg"
    
    return {"success": True, "avatar_url": avatar_url}