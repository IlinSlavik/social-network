from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Friend
from app.auth import get_current_user

router = APIRouter(tags=["friends"])

@router.get("/api/friends/suggestions")
async def get_friend_suggestions(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    friends_ids = db.query(Friend.friend_id).filter(
        Friend.user_id == user.id,
        Friend.status == "accepted"
    ).all()
    friends_ids = [f[0] for f in friends_ids]
    
    pending_ids = db.query(Friend.friend_id).filter(
        Friend.user_id == user.id,
        Friend.status == "pending"
    ).all()
    pending_ids = [p[0] for p in pending_ids]
    
    excluded_ids = [user.id] + friends_ids + pending_ids
    
    suggestions = db.query(User).filter(~User.id.in_(excluded_ids)).all()
    
    return {
        "success": True,
        "users": [{
            "id": u.id,
            "full_name": f"{u.first_name} {u.last_name}",
            "username": u.username,
            "status": u.status
        } for u in suggestions]
    }

@router.post("/api/friends/request/{friend_id}")
async def send_friend_request(friend_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    if user.id == friend_id:
        return {"success": False, "message": "Нельзя добавить себя в друзья"}
    
    existing = db.query(Friend).filter(
        ((Friend.user_id == user.id) & (Friend.friend_id == friend_id)) |
        ((Friend.user_id == friend_id) & (Friend.friend_id == user.id))
    ).first()
    
    if existing:
        return {"success": False, "message": "Заявка уже существует"}
    
    new_request = Friend(
        user_id=user.id,
        friend_id=friend_id,
        status="pending"
    )
    db.add(new_request)
    db.commit()
    
    return {"success": True, "message": "Заявка отправлена"}

@router.post("/api/friends/accept/{request_id}")
async def accept_friend_request(request_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    friend_request = db.query(Friend).filter(
        Friend.id == request_id,
        Friend.friend_id == user.id,
        Friend.status == "pending"
    ).first()
    
    if not friend_request:
        return {"success": False, "message": "Заявка не найдена"}
    
    friend_request.status = "accepted"
    db.commit()
    
    return {"success": True, "message": "Заявка принята"}

@router.post("/api/friends/reject/{request_id}")
async def reject_friend_request(request_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    friend_request = db.query(Friend).filter(
        Friend.id == request_id,
        Friend.friend_id == user.id,
        Friend.status == "pending"
    ).first()
    
    if not friend_request:
        return {"success": False, "message": "Заявка не найдена"}
    
    db.delete(friend_request)
    db.commit()
    
    return {"success": True, "message": "Заявка отклонена"}

@router.get("/api/friends")
async def get_friends(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    friends = db.query(Friend).filter(
        ((Friend.user_id == user.id) | (Friend.friend_id == user.id)),
        Friend.status == "accepted"
    ).all()
    
    friends_list = []
    for f in friends:
        friend_id = f.friend_id if f.user_id == user.id else f.user_id
        friend = db.query(User).filter(User.id == friend_id).first()
        if friend:
            friends_list.append({
                "id": friend.id,
                "full_name": f"{friend.first_name} {friend.last_name}",
                "username": friend.username,
                "status": friend.status
            })
    
    return {"success": True, "friends": friends_list}

@router.get("/api/friends/requests/incoming")
async def get_incoming_requests(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    requests = db.query(Friend).filter(
        Friend.friend_id == user.id,
        Friend.status == "pending"
    ).all()
    
    requests_list = []
    for req in requests:
        sender = db.query(User).filter(User.id == req.user_id).first()
        if sender:
            requests_list.append({
                "id": req.id,
                "user_id": sender.id,
                "full_name": f"{sender.first_name} {sender.last_name}",
                "username": sender.username,
                "created_at": req.created_at.isoformat()
            })
    
    return {"success": True, "requests": requests_list}

@router.delete("/api/friends/{friend_id}")
async def remove_friend(friend_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return {"success": False, "message": "Не авторизован"}
    
    friendship = db.query(Friend).filter(
        ((Friend.user_id == user.id) & (Friend.friend_id == friend_id)) |
        ((Friend.user_id == friend_id) & (Friend.friend_id == user.id)),
        Friend.status == "accepted"
    ).first()
    
    if not friendship:
        return {"success": False, "message": "Друг не найден"}
    
    db.delete(friendship)
    db.commit()
    
    return {"success": True, "message": "Друг удален"}