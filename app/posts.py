from fastapi import APIRouter, Request, Form, Depends, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models import Post, Comment, User, Friend, Like
from app.auth import get_current_user
import os
from datetime import datetime, timedelta
from collections import defaultdict


router = APIRouter(tags=["posts"])

@router.post("/api/posts")
async def create_post(
    request: Request,
    content: str = Form(...),
    image: UploadFile = File(None),  # Добавлено поле для изображения
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    image_url = None
    
    if image and image.filename:
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return {"success": False, "message": "Разрешены только изображения (JPEG, PNG, GIF, WEBP)"}
        
        contents = await image.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            return {"success": False, "message": "Файл не должен превышать 10MB"}
        
        os.makedirs("static/uploads/posts", exist_ok=True)
        
        file_extension = os.path.splitext(image.filename)[1]
        filename = f"post_{datetime.now().strftime('%Y%m%d_%H%M%S%f')}{file_extension}"
        filepath = os.path.join("static/uploads/posts", filename)
        
        with open(filepath, "wb") as buffer:
            buffer.write(contents)
        
        image_url = f"/static/uploads/posts/{filename}"
    
    new_post = Post(
        content=content,
        image_url=image_url,
        author_id=user.id,
        author_name=f"{user.first_name} {user.last_name}"
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {"success": True, "message": "Пост опубликован", "post_id": new_post.id}

@router.get("/api/posts")
async def get_posts(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    posts = db.query(Post).filter(Post.author_id == user.id).order_by(Post.created_at.desc()).all()
    
    posts_data = []
    for post in posts:
        comments_count = db.query(Comment).filter(Comment.post_id == post.id).count()
        user_liked = db.query(Like).filter(
            and_(Like.user_id == user.id, Like.post_id == post.id)
        ).first() is not None
        
        posts_data.append({
            "id": post.id,
            "content": post.content,
            "image_url": post.image_url,  # Добавлено
            "author_id": post.author_id,
            "author_name": post.author_name,
            "likes_count": post.likes_count,
            "user_liked": user_liked,
            "comments_count": comments_count,
            "created_at": post.created_at.isoformat()
        })
    
    return {"success": True, "posts": posts_data}

@router.post("/api/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return {"success": False, "message": "Пост не найден"}
    
    existing_like = db.query(Like).filter(
        and_(Like.user_id == user.id, Like.post_id == post_id)
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        post.likes_count -= 1
        db.commit()
        return {"success": True, "liked": False, "likes_count": post.likes_count}
    else:
        new_like = Like(user_id=user.id, post_id=post_id)
        db.add(new_like)
        post.likes_count += 1
        db.commit()
        return {"success": True, "liked": True, "likes_count": post.likes_count}

@router.delete("/api/posts/{post_id}")
async def delete_post(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return {"success": False, "message": "Пост не найден"}
    
    if post.author_id != user.id:
        return {"success": False, "message": "Вы не можете удалить этот пост"}
    
    db.query(Like).filter(Like.post_id == post_id).delete()
    db.query(Comment).filter(Comment.post_id == post_id).delete()
    db.delete(post)
    db.commit()
    
    return {"success": True, "message": "Пост удален"}

@router.post("/api/comments")
async def create_comment(
    request: Request,
    post_id: int = Form(...),
    content: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return {"success": False, "message": "Пост не найден"}
    
    new_comment = Comment(
        content=content,
        post_id=post_id,
        author_id=user.id,
        author_name=f"{user.first_name} {user.last_name}"
    )
    db.add(new_comment)
    db.commit()
    
    return {"success": True, "message": "Комментарий добавлен"}

@router.get("/api/posts/{post_id}/comments")
async def get_comments(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.desc()).all()
    
    return {
        "success": True,
        "comments": [{
            "id": c.id,
            "content": c.content,
            "author_id": c.author_id,
            "author_name": c.author_name,
            "created_at": c.created_at.isoformat()
        } for c in comments]
    }

@router.get("/api/news")
async def get_news(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    friends = db.query(Friend).filter(
        ((Friend.user_id == user.id) | (Friend.friend_id == user.id)),
        Friend.status == "accepted"
    ).all()
    
    friends_ids = []
    for f in friends:
        friend_id = f.friend_id if f.user_id == user.id else f.user_id
        friends_ids.append(friend_id)
    
    if not friends_ids:
        return {"success": True, "posts": []}
    
    posts = db.query(Post).filter(Post.author_id.in_(friends_ids)).order_by(Post.created_at.desc()).all()
    
    posts_data = []
    for post in posts:
        comments_count = db.query(Comment).filter(Comment.post_id == post.id).count()
        user_liked = db.query(Like).filter(
            and_(Like.user_id == user.id, Like.post_id == post.id)
        ).first() is not None
        
        posts_data.append({
            "id": post.id,
            "content": post.content,
            "image_url": post.image_url,  # Добавлено
            "author_id": post.author_id,
            "author_name": post.author_name,
            "likes_count": post.likes_count,
            "user_liked": user_liked,
            "comments_count": comments_count,
            "created_at": post.created_at.isoformat()
        })
    
    return {"success": True, "posts": posts_data}

@router.get("/api/stats/posts")
async def get_posts_stats(request: Request, db: Session = Depends(get_db)):
    """Получить статистику постов за последние 7 дней"""
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    # Получаем дату 7 дней назад
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    # Получаем все посты пользователя за последние 7 дней
    posts = db.query(Post).filter(
        Post.author_id == user.id,
        Post.created_at >= seven_days_ago
    ).all()
    
    # Группируем по дням
    stats = defaultdict(int)
    for post in posts:
        day_key = post.created_at.strftime('%Y-%m-%d')
        stats[day_key] += 1
    
    # Заполняем все дни последней недели
    result = []
    for i in range(6, -1, -1):
        date = datetime.now() - timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        day_name = date.strftime('%a')  # Пн, Вт, Ср, Чт, Пт, Сб, Вс
        result.append({
            "date": date_str,
            "day": day_name,
            "count": stats.get(date_str, 0)
        })
    
    return {"success": True, "stats": result}