from fastapi import FastAPI, APIRouter, HTTPException, Depends, Form, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import base64
import httpx
import json
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'seniorcare-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_EXPIRATION_HOURS = 24
JWT_REFRESH_EXPIRATION_DAYS = 30

# Emergent LLM Key for AI features
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-17792Cd772a8bDa732')

# Background check expiration (6 months)
BACKGROUND_CHECK_VALIDITY_DAYS = 180

app = FastAPI(title="SeniorCare+ API", version="2.0.0", description="Premium caregiver marketplace")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: Literal['client', 'caregiver', 'admin'] = 'client'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CaregiverProfileCreate(BaseModel):
    bio: str
    price_hour: float
    price_night: Optional[float] = None
    certifications: List[str] = []
    city: str
    neighborhood: str
    experience_years: int = 0
    specializations: List[str] = []
    available: bool = True
    # New fields for Smart Match
    languages: List[str] = ["Português"]
    has_car: bool = False
    accepts_pets: bool = True
    hobbies: List[str] = []
    personality_traits: List[str] = []
    video_intro_url: Optional[str] = None

class CaregiverProfileResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    user_phone: str
    bio: str
    price_hour: float
    price_night: Optional[float] = None
    certifications: List[str] = []
    city: str
    neighborhood: str
    experience_years: int = 0
    specializations: List[str] = []
    available: bool = True
    verified: bool = False
    background_check_status: str = 'pending'
    background_check_expiry: Optional[datetime] = None
    biometric_verified: bool = False
    last_biometric_check: Optional[datetime] = None
    rating: float = 0.0
    total_reviews: int = 0
    photo: Optional[str] = None
    languages: List[str] = []
    has_car: bool = False
    accepts_pets: bool = True
    hobbies: List[str] = []
    personality_traits: List[str] = []
    video_intro_url: Optional[str] = None
    match_score: Optional[float] = None
    created_at: datetime

class ClientProfileCreate(BaseModel):
    elder_name: str
    elder_age: int
    elder_address: str
    elder_city: str
    elder_needs: List[str] = []
    preferences: dict = {}
    # Smart Match fields
    care_level: Literal['companionship', 'mobility', 'medical', 'alzheimer', 'post_surgery'] = 'companionship'
    preferred_languages: List[str] = ["Português"]
    has_pets: bool = False
    elder_hobbies: List[str] = []
    preferred_gender: Optional[str] = None
    needs_driver: bool = False

class ClientProfileResponse(BaseModel):
    id: str
    user_id: str
    elder_name: str
    elder_age: int
    elder_address: str
    elder_city: str
    elder_needs: List[str] = []
    preferences: dict = {}
    care_level: str = 'companionship'
    preferred_languages: List[str] = []
    has_pets: bool = False
    elder_hobbies: List[str] = []
    preferred_gender: Optional[str] = None
    needs_driver: bool = False
    created_at: datetime

class BookingCreate(BaseModel):
    caregiver_id: str
    start_datetime: datetime
    end_datetime: datetime
    notes: Optional[str] = None
    service_type: Literal['hourly', 'night_shift', 'recurring'] = 'hourly'
    recurring_days: Optional[List[str]] = None

class BookingResponse(BaseModel):
    id: str
    caregiver_id: str
    caregiver_name: str
    caregiver_photo: Optional[str] = None
    client_id: str
    client_name: str
    elder_name: str
    start_datetime: datetime
    end_datetime: datetime
    status: str
    service_type: str
    price_cents: int
    platform_fee_cents: int
    total_cents: int
    notes: Optional[str] = None
    paid: bool = False
    escrow_status: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    created_at: datetime

class CareLogEntry(BaseModel):
    booking_id: str
    entry_type: Literal['check_in', 'check_out', 'activity', 'medication', 'meal', 'vital_signs', 'note', 'emergency']
    description: str
    vital_signs: Optional[Dict[str, Any]] = None
    photo_base64: Optional[str] = None

class CareLogResponse(BaseModel):
    id: str
    booking_id: str
    caregiver_id: str
    entry_type: str
    description: str
    vital_signs: Optional[Dict[str, Any]] = None
    photo_base64: Optional[str] = None
    created_at: datetime

class EmergencyAlert(BaseModel):
    booking_id: str
    emergency_type: Literal['medical', 'fall', 'unresponsive', 'other']
    description: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    read: bool = False
    data: Optional[Dict[str, Any]] = None
    created_at: datetime

class ChatMessage(BaseModel):
    recipient_id: str
    booking_id: Optional[str] = None
    message: str
    message_type: Literal['text', 'image', 'care_update'] = 'text'

class ChatMessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    recipient_id: str
    booking_id: Optional[str] = None
    message: str
    message_type: str
    read: bool = False
    created_at: datetime

class ReviewCreate(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    booking_id: str
    caregiver_id: str
    client_id: str
    client_name: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

class AcademyContent(BaseModel):
    id: str
    title: str
    description: str
    content_type: Literal['article', 'video', 'quiz']
    category: Literal['caregiver_training', 'family_support', 'health_tips', 'legal']
    thumbnail: Optional[str] = None
    duration_minutes: Optional[int] = None
    content_url: Optional[str] = None
    content_body: Optional[str] = None
    created_at: datetime

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'type': 'access',
        'exp': datetime.utcnow() + timedelta(hours=JWT_ACCESS_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'type': 'refresh',
        'exp': datetime.utcnow() + timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'access':
            raise HTTPException(status_code=401, detail='Invalid token type')
        user = await db.users.find_one({'id': payload['user_id']})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

# ============ SMART MATCH ALGORITHM ============

def calculate_match_score(caregiver: dict, client_profile: dict) -> float:
    """Calculate compatibility score between caregiver and client needs"""
    score = 0.0
    max_score = 100.0
    
    # Care level match (30 points)
    care_level = client_profile.get('care_level', 'companionship')
    specializations = caregiver.get('specializations', [])
    
    care_level_mapping = {
        'companionship': ['Cuidados Gerais', 'Companhia'],
        'mobility': ['Mobilidade Reduzida', 'Fisioterapia'],
        'medical': ['Enfermagem', 'Cuidados Médicos'],
        'alzheimer': ['Alzheimer/Demência'],
        'post_surgery': ['Pós-Operatório', 'Enfermagem']
    }
    
    required_specs = care_level_mapping.get(care_level, [])
    if any(spec in specializations for spec in required_specs):
        score += 30
    elif specializations:
        score += 15
    
    # Language match (15 points)
    client_langs = client_profile.get('preferred_languages', ['Português'])
    caregiver_langs = caregiver.get('languages', ['Português'])
    if any(lang in caregiver_langs for lang in client_langs):
        score += 15
    
    # Location match (15 points)
    if caregiver.get('city', '').lower() == client_profile.get('elder_city', '').lower():
        score += 15
    
    # Pet compatibility (10 points)
    if client_profile.get('has_pets') and caregiver.get('accepts_pets'):
        score += 10
    elif not client_profile.get('has_pets'):
        score += 10
    
    # Driver requirement (10 points)
    if client_profile.get('needs_driver') and caregiver.get('has_car'):
        score += 10
    elif not client_profile.get('needs_driver'):
        score += 10
    
    # Experience bonus (10 points)
    exp = caregiver.get('experience_years', 0)
    if exp >= 5:
        score += 10
    elif exp >= 2:
        score += 5
    
    # Hobbies match (10 points)
    client_hobbies = set(client_profile.get('elder_hobbies', []))
    caregiver_hobbies = set(caregiver.get('hobbies', []))
    if client_hobbies and caregiver_hobbies:
        overlap = len(client_hobbies.intersection(caregiver_hobbies))
        score += min(overlap * 3, 10)
    
    return min(round(score, 1), max_score)

# ============ AI HELPERS ============

async def generate_care_summary(care_logs: List[dict]) -> str:
    """Use AI to generate a summary of the care day"""
    if not care_logs:
        return "Sem registros de cuidado ainda."
    
    logs_text = "\n".join([
        f"- {log['entry_type']}: {log['description']}" 
        for log in care_logs
    ])
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {EMERGENT_LLM_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "Você é um assistente que resume registros de cuidados com idosos para familiares. Seja breve, carinhoso e informativo. Responda em português brasileiro."
                        },
                        {
                            "role": "user",
                            "content": f"Resuma os seguintes registros de cuidado do dia para enviar à família:\n\n{logs_text}"
                        }
                    ],
                    "max_tokens": 300
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
    except Exception as e:
        logger.error(f"AI summary error: {e}")
    
    return f"Resumo do dia: {len(care_logs)} atividades registradas."

# ============ NOTIFICATION HELPERS ============

async def create_notification(user_id: str, title: str, message: str, notification_type: str, data: dict = None):
    """Create a notification for a user"""
    notification = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'title': title,
        'message': message,
        'notification_type': notification_type,
        'read': False,
        'data': data or {},
        'created_at': datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    return notification

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'name': user_data.name,
        'email': user_data.email,
        'phone': user_data.phone,
        'password_hash': hash_password(user_data.password),
        'role': user_data.role,
        'verified': False,
        'senior_mode': False,
        'created_at': datetime.utcnow()
    }
    await db.users.insert_one(user)
    
    access_token = create_access_token(user_id, user_data.role)
    refresh_token = create_refresh_token(user_id)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'user': {
            'id': user_id,
            'name': user_data.name,
            'email': user_data.email,
            'phone': user_data.phone,
            'role': user_data.role,
            'verified': False,
            'senior_mode': False
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    access_token = create_access_token(user['id'], user['role'])
    refresh_token = create_refresh_token(user['id'])
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role'],
            'verified': user['verified'],
            'senior_mode': user.get('senior_mode', False)
        }
    }

@api_router.post("/auth/refresh")
async def refresh_token(refresh_token: str = Form(...)):
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'refresh':
            raise HTTPException(status_code=401, detail='Invalid token type')
        
        user = await db.users.find_one({'id': payload['user_id']})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        
        new_access_token = create_access_token(user['id'], user['role'])
        return {'access_token': new_access_token, 'token_type': 'bearer'}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Refresh token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid refresh token')

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    profile = None
    if user['role'] == 'caregiver':
        profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    elif user['role'] == 'client':
        profile = await db.client_profiles.find_one({'user_id': user['id']})
    
    # Remove MongoDB _id field
    if profile and '_id' in profile:
        del profile['_id']
    
    # Check for pending notifications
    unread_count = await db.notifications.count_documents({'user_id': user['id'], 'read': False})
    
    return {
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role'],
            'verified': user['verified'],
            'senior_mode': user.get('senior_mode', False)
        },
        'profile': profile,
        'unread_notifications': unread_count
    }

@api_router.put("/auth/senior-mode")
async def toggle_senior_mode(enabled: bool, user = Depends(get_current_user)):
    """Toggle Senior Mode for accessibility"""
    await db.users.update_one({'id': user['id']}, {'$set': {'senior_mode': enabled}})
    return {'senior_mode': enabled}

# ============ CAREGIVER ENDPOINTS ============

@api_router.post("/caregivers/profile", response_model=CaregiverProfileResponse)
async def create_caregiver_profile(profile_data: CaregiverProfileCreate, user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can create caregiver profiles')
    
    existing = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if existing:
        raise HTTPException(status_code=400, detail='Profile already exists')
    
    profile_id = str(uuid.uuid4())
    profile = {
        'id': profile_id,
        'user_id': user['id'],
        'user_name': user['name'],
        'user_email': user['email'],
        'user_phone': user['phone'],
        **profile_data.dict(),
        'verified': False,
        'background_check_status': 'pending',
        'background_check_expiry': None,
        'biometric_verified': False,
        'last_biometric_check': None,
        'rating': 0.0,
        'total_reviews': 0,
        'photo': None,
        'created_at': datetime.utcnow()
    }
    await db.caregiver_profiles.insert_one(profile)
    return CaregiverProfileResponse(**profile)

@api_router.put("/caregivers/profile", response_model=CaregiverProfileResponse)
async def update_caregiver_profile(profile_data: CaregiverProfileCreate, user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can update caregiver profiles')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    
    update_data = {
        **profile_data.dict(),
        'user_name': user['name'],
        'user_email': user['email'],
        'user_phone': user['phone']
    }
    await db.caregiver_profiles.update_one({'user_id': user['id']}, {'$set': update_data})
    
    updated = await db.caregiver_profiles.find_one({'user_id': user['id']})
    return CaregiverProfileResponse(**updated)

@api_router.post("/caregivers/photo")
async def upload_caregiver_photo(photo_base64: str = Form(...), user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can upload photos')
    
    await db.caregiver_profiles.update_one(
        {'user_id': user['id']},
        {'$set': {'photo': photo_base64}}
    )
    return {'message': 'Photo uploaded successfully'}

@api_router.get("/caregivers", response_model=List[CaregiverProfileResponse])
async def list_caregivers(
    city: Optional[str] = None,
    neighborhood: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    verified_only: bool = False,
    available_only: bool = True,
    specialization: Optional[str] = None,
    min_rating: Optional[float] = None,
    care_level: Optional[str] = None,
    smart_match: bool = False,
    skip: int = 0,
    limit: int = 20,
    user = Depends(get_current_user)
):
    query = {}
    if city:
        query['city'] = {'$regex': city, '$options': 'i'}
    if neighborhood:
        query['neighborhood'] = {'$regex': neighborhood, '$options': 'i'}
    if min_price is not None:
        query['price_hour'] = {'$gte': min_price}
    if max_price is not None:
        query.setdefault('price_hour', {})['$lte'] = max_price
    if verified_only:
        query['verified'] = True
    if available_only:
        query['available'] = True
    if specialization:
        query['specializations'] = {'$in': [specialization]}
    if min_rating is not None:
        query['rating'] = {'$gte': min_rating}
    
    caregivers = await db.caregiver_profiles.find(query).skip(skip).limit(limit).to_list(limit)
    
    # Apply Smart Match if client has profile
    if smart_match and user['role'] == 'client':
        client_profile = await db.client_profiles.find_one({'user_id': user['id']})
        if client_profile:
            for cg in caregivers:
                cg['match_score'] = calculate_match_score(cg, client_profile)
            # Sort by match score
            caregivers.sort(key=lambda x: x.get('match_score', 0), reverse=True)
    
    return [CaregiverProfileResponse(**c) for c in caregivers]

@api_router.get("/caregivers/{caregiver_id}", response_model=CaregiverProfileResponse)
async def get_caregiver(caregiver_id: str, user = Depends(get_current_user)):
    caregiver = await db.caregiver_profiles.find_one({'id': caregiver_id})
    if not caregiver:
        raise HTTPException(status_code=404, detail='Caregiver not found')
    
    # Calculate match score if client
    if user['role'] == 'client':
        client_profile = await db.client_profiles.find_one({'user_id': user['id']})
        if client_profile:
            caregiver['match_score'] = calculate_match_score(caregiver, client_profile)
    
    return CaregiverProfileResponse(**caregiver)

# ============ CLIENT ENDPOINTS ============

@api_router.post("/clients/profile", response_model=ClientProfileResponse)
async def create_client_profile(profile_data: ClientProfileCreate, user = Depends(get_current_user)):
    if user['role'] != 'client':
        raise HTTPException(status_code=403, detail='Only clients can create client profiles')
    
    existing = await db.client_profiles.find_one({'user_id': user['id']})
    if existing:
        raise HTTPException(status_code=400, detail='Profile already exists')
    
    profile_id = str(uuid.uuid4())
    profile = {
        'id': profile_id,
        'user_id': user['id'],
        **profile_data.dict(),
        'created_at': datetime.utcnow()
    }
    await db.client_profiles.insert_one(profile)
    return ClientProfileResponse(**profile)

@api_router.put("/clients/profile", response_model=ClientProfileResponse)
async def update_client_profile(profile_data: ClientProfileCreate, user = Depends(get_current_user)):
    if user['role'] != 'client':
        raise HTTPException(status_code=403, detail='Only clients can update client profiles')
    
    profile = await db.client_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    
    await db.client_profiles.update_one({'user_id': user['id']}, {'$set': profile_data.dict()})
    updated = await db.client_profiles.find_one({'user_id': user['id']})
    return ClientProfileResponse(**updated)

@api_router.get("/clients/profile", response_model=ClientProfileResponse)
async def get_client_profile(user = Depends(get_current_user)):
    profile = await db.client_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    return ClientProfileResponse(**profile)

# ============ BOOKING ENDPOINTS ============

PLATFORM_FEE_PERCENT = 15

@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking_data: BookingCreate, user = Depends(get_current_user)):
    if user['role'] != 'client':
        raise HTTPException(status_code=403, detail='Only clients can create bookings')
    
    caregiver = await db.caregiver_profiles.find_one({'id': booking_data.caregiver_id})
    if not caregiver:
        raise HTTPException(status_code=404, detail='Caregiver not found')
    
    # Check if caregiver is blocked (expired background check or biometric)
    if caregiver.get('background_check_expiry'):
        if datetime.utcnow() > caregiver['background_check_expiry']:
            raise HTTPException(status_code=400, detail='Caregiver verification has expired')
    
    client_profile = await db.client_profiles.find_one({'user_id': user['id']})
    if not client_profile:
        raise HTTPException(status_code=400, detail='Please create a client profile first')
    
    hours = (booking_data.end_datetime - booking_data.start_datetime).total_seconds() / 3600
    if booking_data.service_type == 'night_shift' and caregiver.get('price_night'):
        price_cents = int(caregiver['price_night'] * 100)
    else:
        price_cents = int(hours * caregiver['price_hour'] * 100)
    
    platform_fee_cents = int(price_cents * PLATFORM_FEE_PERCENT / 100)
    total_cents = price_cents + platform_fee_cents
    
    booking_id = str(uuid.uuid4())
    booking = {
        'id': booking_id,
        'caregiver_id': booking_data.caregiver_id,
        'caregiver_name': caregiver['user_name'],
        'caregiver_photo': caregiver.get('photo'),
        'caregiver_user_id': caregiver['user_id'],
        'client_id': user['id'],
        'client_name': user['name'],
        'elder_name': client_profile['elder_name'],
        'start_datetime': booking_data.start_datetime,
        'end_datetime': booking_data.end_datetime,
        'status': 'pending',
        'service_type': booking_data.service_type,
        'price_cents': price_cents,
        'platform_fee_cents': platform_fee_cents,
        'total_cents': total_cents,
        'notes': booking_data.notes,
        'paid': False,
        'escrow_status': 'pending',
        'check_in_time': None,
        'check_out_time': None,
        'created_at': datetime.utcnow()
    }
    await db.bookings.insert_one(booking)
    
    # Notify caregiver
    await create_notification(
        caregiver['user_id'],
        'Nova solicitação de cuidado',
        f'{user["name"]} solicitou seus serviços para {client_profile["elder_name"]}',
        'booking_request',
        {'booking_id': booking_id}
    )
    
    return BookingResponse(**booking)

@api_router.get("/bookings", response_model=List[BookingResponse])
async def list_bookings(status: Optional[str] = None, user = Depends(get_current_user)):
    query = {}
    if user['role'] == 'client':
        query['client_id'] = user['id']
    elif user['role'] == 'caregiver':
        profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
        if profile:
            query['caregiver_id'] = profile['id']
    
    if status:
        query['status'] = status
    
    bookings = await db.bookings.find(query).sort('created_at', -1).to_list(100)
    return [BookingResponse(**b) for b in bookings]

@api_router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user = Depends(get_current_user)):
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    caregiver_profile_id = profile['id'] if profile else None
    
    if user['role'] == 'client' and booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    if user['role'] == 'caregiver' and booking['caregiver_id'] != caregiver_profile_id:
        raise HTTPException(status_code=403, detail='Access denied')
    
    return BookingResponse(**booking)

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status: Literal['confirmed', 'in_progress', 'completed', 'cancelled'],
    user = Depends(get_current_user)
):
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    caregiver_profile_id = profile['id'] if profile else None
    
    if user['role'] == 'caregiver' and booking['caregiver_id'] != caregiver_profile_id:
        raise HTTPException(status_code=403, detail='Access denied')
    if user['role'] == 'client' and booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    update_data = {'status': status}
    
    # Handle escrow status
    if status == 'confirmed':
        update_data['escrow_status'] = 'held'
    elif status == 'completed':
        update_data['escrow_status'] = 'released'
    elif status == 'cancelled':
        update_data['escrow_status'] = 'refunded'
    
    await db.bookings.update_one({'id': booking_id}, {'$set': update_data})
    
    # Send notifications
    if status == 'confirmed':
        await create_notification(
            booking['client_id'],
            'Agendamento confirmado!',
            f'{booking["caregiver_name"]} aceitou cuidar de {booking["elder_name"]}',
            'booking_confirmed',
            {'booking_id': booking_id}
        )
    elif status == 'completed':
        await create_notification(
            booking['client_id'],
            'Cuidado finalizado',
            f'O atendimento de {booking["elder_name"]} foi concluído',
            'booking_completed',
            {'booking_id': booking_id}
        )
    
    return {'message': f'Booking status updated to {status}'}

# ============ CARE LOG ENDPOINTS ============

@api_router.post("/care-log", response_model=CareLogResponse)
async def create_care_log_entry(entry: CareLogEntry, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can create care logs')
    
    booking = await db.bookings.find_one({'id': entry.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile or booking['caregiver_id'] != profile['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    # Handle check-in/check-out
    if entry.entry_type == 'check_in':
        await db.bookings.update_one(
            {'id': entry.booking_id},
            {'$set': {'check_in_time': datetime.utcnow(), 'status': 'in_progress'}}
        )
    elif entry.entry_type == 'check_out':
        await db.bookings.update_one(
            {'id': entry.booking_id},
            {'$set': {'check_out_time': datetime.utcnow()}}
        )
    
    log_id = str(uuid.uuid4())
    log_entry = {
        'id': log_id,
        'booking_id': entry.booking_id,
        'caregiver_id': profile['id'],
        'entry_type': entry.entry_type,
        'description': entry.description,
        'vital_signs': entry.vital_signs,
        'photo_base64': entry.photo_base64,
        'created_at': datetime.utcnow()
    }
    await db.care_logs.insert_one(log_entry)
    
    # Notify family
    notification_titles = {
        'check_in': 'Cuidador chegou!',
        'check_out': 'Cuidado finalizado',
        'medication': 'Medicação administrada',
        'meal': 'Refeição registrada',
        'vital_signs': 'Sinais vitais medidos',
        'activity': 'Atividade realizada',
        'emergency': '⚠️ EMERGÊNCIA'
    }
    
    await create_notification(
        booking['client_id'],
        notification_titles.get(entry.entry_type, 'Atualização de cuidado'),
        entry.description[:100],
        f'care_log_{entry.entry_type}',
        {'booking_id': entry.booking_id, 'log_id': log_id}
    )
    
    return CareLogResponse(**log_entry)

@api_router.get("/care-log/{booking_id}", response_model=List[CareLogResponse])
async def get_care_logs(booking_id: str, user = Depends(get_current_user)):
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    caregiver_profile_id = profile['id'] if profile else None
    
    if user['role'] == 'client' and booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    if user['role'] == 'caregiver' and booking['caregiver_id'] != caregiver_profile_id:
        raise HTTPException(status_code=403, detail='Access denied')
    
    logs = await db.care_logs.find({'booking_id': booking_id}).sort('created_at', -1).to_list(100)
    return [CareLogResponse(**log) for log in logs]

@api_router.get("/care-log/{booking_id}/summary")
async def get_care_summary(booking_id: str, user = Depends(get_current_user)):
    """Get AI-generated summary of care logs"""
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    if user['role'] == 'client' and booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    logs = await db.care_logs.find({'booking_id': booking_id}).sort('created_at', 1).to_list(100)
    summary = await generate_care_summary(logs)
    
    return {'summary': summary, 'total_entries': len(logs)}

# ============ EMERGENCY ENDPOINT ============

@api_router.post("/emergency")
async def trigger_emergency(alert: EmergencyAlert, user = Depends(get_current_user)):
    """Emergency panic button - notifies all family members and logs the emergency"""
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can trigger emergency')
    
    booking = await db.bookings.find_one({'id': alert.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    # Create emergency log
    emergency_id = str(uuid.uuid4())
    emergency_record = {
        'id': emergency_id,
        'booking_id': alert.booking_id,
        'caregiver_id': user['id'],
        'emergency_type': alert.emergency_type,
        'description': alert.description,
        'location': {'lat': alert.location_lat, 'lng': alert.location_lng},
        'status': 'active',
        'created_at': datetime.utcnow()
    }
    await db.emergencies.insert_one(emergency_record)
    
    # Create care log entry
    await db.care_logs.insert_one({
        'id': str(uuid.uuid4()),
        'booking_id': alert.booking_id,
        'caregiver_id': user['id'],
        'entry_type': 'emergency',
        'description': f'EMERGÊNCIA: {alert.emergency_type} - {alert.description}',
        'created_at': datetime.utcnow()
    })
    
    # Notify client with high priority
    await create_notification(
        booking['client_id'],
        '🚨 EMERGÊNCIA MÉDICA',
        f'{alert.emergency_type.upper()}: {alert.description}. Cuidador: {booking["caregiver_name"]}',
        'emergency',
        {
            'emergency_id': emergency_id,
            'booking_id': alert.booking_id,
            'location': {'lat': alert.location_lat, 'lng': alert.location_lng}
        }
    )
    
    return {
        'emergency_id': emergency_id,
        'message': 'Emergency alert sent to all family members',
        'emergency_services_info': 'Ligue 192 (SAMU) ou 193 (Bombeiros)'
    }

# ============ CHAT ENDPOINTS ============

@api_router.post("/chat/send", response_model=ChatMessageResponse)
async def send_message(message: ChatMessage, user = Depends(get_current_user)):
    msg_id = str(uuid.uuid4())
    chat_msg = {
        'id': msg_id,
        'sender_id': user['id'],
        'sender_name': user['name'],
        'recipient_id': message.recipient_id,
        'booking_id': message.booking_id,
        'message': message.message,
        'message_type': message.message_type,
        'read': False,
        'created_at': datetime.utcnow()
    }
    await db.chat_messages.insert_one(chat_msg)
    
    # Notify recipient
    await create_notification(
        message.recipient_id,
        f'Nova mensagem de {user["name"]}',
        message.message[:50] + '...' if len(message.message) > 50 else message.message,
        'chat_message',
        {'message_id': msg_id, 'sender_id': user['id']}
    )
    
    return ChatMessageResponse(**chat_msg)

@api_router.get("/chat/legacy/{recipient_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(recipient_id: str, booking_id: Optional[str] = None, user = Depends(get_current_user)):
    query = {
        '$or': [
            {'sender_id': user['id'], 'recipient_id': recipient_id},
            {'sender_id': recipient_id, 'recipient_id': user['id']}
        ]
    }
    if booking_id:
        query['booking_id'] = booking_id
    
    messages = await db.chat_messages.find(query).sort('created_at', 1).to_list(200)
    
    # Mark as read
    await db.chat_messages.update_many(
        {'sender_id': recipient_id, 'recipient_id': user['id'], 'read': False},
        {'$set': {'read': True}}
    )
    
    return [ChatMessageResponse(**m) for m in messages]

# ============ NOTIFICATIONS ENDPOINTS ============

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(unread_only: bool = False, user = Depends(get_current_user)):
    query = {'user_id': user['id']}
    if unread_only:
        query['read'] = False
    
    notifications = await db.notifications.find(query).sort('created_at', -1).to_list(50)
    return [NotificationResponse(**n) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {'id': notification_id, 'user_id': user['id']},
        {'$set': {'read': True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail='Notification not found')
    return {'message': 'Notification marked as read'}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user = Depends(get_current_user)):
    await db.notifications.update_many(
        {'user_id': user['id'], 'read': False},
        {'$set': {'read': True}}
    )
    return {'message': 'All notifications marked as read'}

# ============ BIOMETRIC VERIFICATION ============

@api_router.post("/biometric/daily-check")
async def daily_biometric_check(selfie_base64: str = Form(...), user = Depends(get_current_user)):
    """Daily biometric verification for caregivers"""
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can verify biometrics')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Caregiver profile not found')
    
    # Mock verification - in production, integrate with Azure Face API
    # Simulate liveness challenge
    challenge_passed = random.random() > 0.1  # 90% success rate for demo
    
    if challenge_passed:
        await db.caregiver_profiles.update_one(
            {'id': profile['id']},
            {'$set': {
                'biometric_verified': True,
                'last_biometric_check': datetime.utcnow()
            }}
        )
        
        await db.biometric_logs.insert_one({
            'id': str(uuid.uuid4()),
            'caregiver_id': profile['id'],
            'status': 'success',
            'challenge_type': 'liveness',
            'timestamp': datetime.utcnow()
        })
        
        return {'success': True, 'message': 'Verificação biométrica concluída com sucesso'}
    else:
        return {'success': False, 'message': 'Verificação falhou. Por favor, tente novamente em um ambiente bem iluminado.'}

@api_router.get("/biometric/status")
async def get_biometric_status(user = Depends(get_current_user)):
    """Check if daily biometric verification is needed"""
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers have biometric requirements')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    
    last_check = profile.get('last_biometric_check')
    needs_verification = True
    
    if last_check:
        # Check if verification was done today
        today = datetime.utcnow().date()
        last_check_date = last_check.date() if isinstance(last_check, datetime) else last_check
        needs_verification = last_check_date < today
    
    return {
        'needs_verification': needs_verification,
        'last_check': last_check,
        'is_verified': profile.get('biometric_verified', False)
    }

# ============ DOCUMENTS/VERIFICATION ============

@api_router.post("/caregivers/documents")
async def upload_document(
    doc_type: Literal['background_check', 'certification', 'id_document'] = Form(...),
    doc_base64: str = Form(...),
    user = Depends(get_current_user)
):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can upload documents')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Caregiver profile not found')
    
    doc_id = str(uuid.uuid4())
    
    # Calculate expiry date for background check
    expiry_date = None
    if doc_type == 'background_check':
        expiry_date = datetime.utcnow() + timedelta(days=BACKGROUND_CHECK_VALIDITY_DAYS)
    
    document = {
        'id': doc_id,
        'caregiver_id': profile['id'],
        'doc_type': doc_type,
        'doc_base64': doc_base64,
        'status': 'pending',
        'expiry_date': expiry_date,
        'review_notes': None,
        'created_at': datetime.utcnow()
    }
    await db.verifications.insert_one(document)
    
    if doc_type == 'background_check':
        await db.caregiver_profiles.update_one(
            {'id': profile['id']},
            {'$set': {'background_check_status': 'pending_review'}}
        )
    
    return {
        'id': doc_id,
        'message': 'Documento enviado para análise',
        'expiry_date': expiry_date
    }

@api_router.get("/caregivers/documents")
async def get_my_documents(user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can view their documents')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Caregiver profile not found')
    
    docs = await db.verifications.find({'caregiver_id': profile['id']}).to_list(100)
    
    # Check for expiring documents
    for doc in docs:
        if doc.get('expiry_date'):
            days_until_expiry = (doc['expiry_date'] - datetime.utcnow()).days
            doc['days_until_expiry'] = days_until_expiry
            doc['is_expiring_soon'] = days_until_expiry <= 30
            doc['is_expired'] = days_until_expiry < 0
    
    return docs

# ============ REVIEWS ============

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review_data: ReviewCreate, user = Depends(get_current_user)):
    if user['role'] != 'client':
        raise HTTPException(status_code=403, detail='Only clients can create reviews')
    
    booking = await db.bookings.find_one({'id': review_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    if booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    if booking['status'] != 'completed':
        raise HTTPException(status_code=400, detail='Can only review completed bookings')
    
    existing = await db.reviews.find_one({'booking_id': review_data.booking_id})
    if existing:
        raise HTTPException(status_code=400, detail='Booking already reviewed')
    
    review_id = str(uuid.uuid4())
    review = {
        'id': review_id,
        'booking_id': review_data.booking_id,
        'caregiver_id': booking['caregiver_id'],
        'client_id': user['id'],
        'client_name': user['name'],
        'rating': review_data.rating,
        'comment': review_data.comment,
        'created_at': datetime.utcnow()
    }
    await db.reviews.insert_one(review)
    
    # Update caregiver rating
    all_reviews = await db.reviews.find({'caregiver_id': booking['caregiver_id']}).to_list(1000)
    avg_rating = sum(r['rating'] for r in all_reviews) / len(all_reviews)
    await db.caregiver_profiles.update_one(
        {'id': booking['caregiver_id']},
        {'$set': {'rating': round(avg_rating, 1), 'total_reviews': len(all_reviews)}}
    )
    
    # Notify caregiver
    await create_notification(
        booking['caregiver_user_id'],
        'Nova avaliação recebida',
        f'Você recebeu {review_data.rating} estrelas de {user["name"]}',
        'review',
        {'review_id': review_id}
    )
    
    return ReviewResponse(**review)

@api_router.get("/reviews/{caregiver_id}", response_model=List[ReviewResponse])
async def get_caregiver_reviews(caregiver_id: str):
    reviews = await db.reviews.find({'caregiver_id': caregiver_id}).sort('created_at', -1).to_list(100)
    return [ReviewResponse(**r) for r in reviews]

# ============ SENIORCARE ACADEMY ============

@api_router.get("/academy", response_model=List[AcademyContent])
async def get_academy_content(
    category: Optional[str] = None,
    content_type: Optional[str] = None
):
    query = {}
    if category:
        query['category'] = category
    if content_type:
        query['content_type'] = content_type
    
    content = await db.academy_content.find(query).sort('created_at', -1).to_list(50)
    
    # If empty, seed with default content
    if not content:
        default_content = [
            {
                'id': str(uuid.uuid4()),
                'title': 'Primeiros Socorros para Idosos',
                'description': 'Aprenda técnicas essenciais de primeiros socorros adaptadas para idosos',
                'content_type': 'video',
                'category': 'caregiver_training',
                'duration_minutes': 15,
                'content_url': 'https://example.com/video1',
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Como lidar com Alzheimer',
                'description': 'Guia completo para famílias que cuidam de idosos com Alzheimer',
                'content_type': 'article',
                'category': 'family_support',
                'content_body': 'O Alzheimer é uma doença que afeta milhões de famílias...',
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Exercícios de Mobilidade',
                'description': 'Exercícios seguros para manter a mobilidade do idoso',
                'content_type': 'video',
                'category': 'health_tips',
                'duration_minutes': 20,
                'created_at': datetime.utcnow()
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Direitos do Idoso - LGPD',
                'description': 'Conheça os direitos do idoso e proteção de dados',
                'content_type': 'article',
                'category': 'legal',
                'created_at': datetime.utcnow()
            }
        ]
        await db.academy_content.insert_many(default_content)
        content = default_content
    
    return [AcademyContent(**c) for c in content]

@api_router.get("/academy/{content_id}", response_model=AcademyContent)
async def get_academy_content_detail(content_id: str):
    content = await db.academy_content.find_one({'id': content_id})
    if not content:
        raise HTTPException(status_code=404, detail='Content not found')
    return AcademyContent(**content)

# ============ ADMIN ENDPOINTS ============

@api_router.get("/admin/stats")
async def get_admin_stats(user = Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    return {
        'total_caregivers': await db.caregiver_profiles.count_documents({}),
        'verified_caregivers': await db.caregiver_profiles.count_documents({'verified': True}),
        'total_clients': await db.client_profiles.count_documents({}),
        'total_bookings': await db.bookings.count_documents({}),
        'completed_bookings': await db.bookings.count_documents({'status': 'completed'}),
        'pending_verifications': await db.verifications.count_documents({'status': 'pending'}),
        'active_emergencies': await db.emergencies.count_documents({'status': 'active'})
    }

@api_router.get("/admin/verification-queue")
async def get_verification_queue(user = Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    docs = await db.verifications.find({'status': 'pending'}).to_list(100)
    return docs

@api_router.put("/admin/verify-document/{doc_id}")
async def verify_document(
    doc_id: str,
    status: Literal['approved', 'rejected'],
    review_notes: Optional[str] = None,
    user = Depends(get_current_user)
):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    doc = await db.verifications.find_one({'id': doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail='Document not found')
    
    await db.verifications.update_one(
        {'id': doc_id},
        {'$set': {'status': status, 'review_notes': review_notes}}
    )
    
    if doc['doc_type'] == 'background_check':
        update_data = {'background_check_status': 'approved' if status == 'approved' else 'rejected'}
        if status == 'approved':
            update_data['verified'] = True
            update_data['background_check_expiry'] = datetime.utcnow() + timedelta(days=BACKGROUND_CHECK_VALIDITY_DAYS)
        await db.caregiver_profiles.update_one(
            {'id': doc['caregiver_id']},
            {'$set': update_data}
        )
    
    return {'message': f'Document {status}'}

# ============ UTILITIES ============

@api_router.get("/cities")
async def get_cities():
    return {
        'cities': [
            {'id': 'campo-grande', 'name': 'Campo Grande', 'state': 'MS'},
            {'id': 'sao-paulo', 'name': 'São Paulo', 'state': 'SP'},
            {'id': 'curitiba', 'name': 'Curitiba', 'state': 'PR'},
            {'id': 'fortaleza', 'name': 'Fortaleza', 'state': 'CE'}
        ]
    }

@api_router.get("/specializations")
async def get_specializations():
    return {
        'specializations': [
            'Cuidados Gerais', 'Alzheimer/Demência', 'Pós-Operatório',
            'Fisioterapia', 'Enfermagem', 'Acompanhamento Hospitalar',
            'Cuidados Noturnos', 'Mobilidade Reduzida', 'Diabetes', 'Hipertensão'
        ]
    }

@api_router.get("/care-levels")
async def get_care_levels():
    return {
        'care_levels': [
            {'id': 'companionship', 'name': 'Companhia', 'description': 'Companhia e atividades básicas'},
            {'id': 'mobility', 'name': 'Mobilidade', 'description': 'Auxílio com mobilidade e locomoção'},
            {'id': 'medical', 'name': 'Cuidados Médicos', 'description': 'Medicamentos e procedimentos básicos'},
            {'id': 'alzheimer', 'name': 'Alzheimer/Demência', 'description': 'Cuidados especializados para demência'},
            {'id': 'post_surgery', 'name': 'Pós-Operatório', 'description': 'Recuperação após cirurgia'}
        ]
    }

# ============ STRIPE PAYMENT ENDPOINTS ============

# Stripe Test Mode Keys (replace with real keys for production)
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_mock_key')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', 'pk_test_mock_key')
PLATFORM_FEE_PERCENT = 15

class PaymentIntentCreate(BaseModel):
    booking_id: str
    payment_method_id: Optional[str] = None

class FamilyShareInvite(BaseModel):
    booking_id: str
    email: EmailStr
    share_percent: int = Field(ge=1, le=100)

class FamilyShareResponse(BaseModel):
    id: str
    booking_id: str
    inviter_id: str
    inviter_name: str
    invitee_email: str
    share_percent: int
    status: str
    amount_cents: int
    paid: bool
    created_at: datetime

@api_router.post("/payments/create-intent")
async def create_payment_intent(data: PaymentIntentCreate, user = Depends(get_current_user)):
    """Create a Stripe payment intent for a booking"""
    booking = await db.bookings.find_one({'id': data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    if booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    if booking.get('paid'):
        raise HTTPException(status_code=400, detail='Booking already paid')
    
    # Create mock payment intent (in production, use real Stripe API)
    payment_intent_id = f"pi_{uuid.uuid4().hex[:24]}"
    client_secret = f"{payment_intent_id}_secret_{uuid.uuid4().hex[:12]}"
    
    # Store payment record
    payment = {
        'id': str(uuid.uuid4()),
        'payment_intent_id': payment_intent_id,
        'booking_id': data.booking_id,
        'client_id': user['id'],
        'amount_cents': booking['total_cents'],
        'currency': 'brl',
        'status': 'requires_payment_method',
        'created_at': datetime.utcnow()
    }
    await db.payments.insert_one(payment)
    
    return {
        'payment_intent_id': payment_intent_id,
        'client_secret': client_secret,
        'amount_cents': booking['total_cents'],
        'publishable_key': STRIPE_PUBLISHABLE_KEY
    }

@api_router.post("/payments/confirm")
async def confirm_payment(booking_id: str, payment_intent_id: str, user = Depends(get_current_user)):
    """Confirm payment and update booking status"""
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    # Simulate successful payment (in production, verify with Stripe)
    await db.payments.update_one(
        {'payment_intent_id': payment_intent_id},
        {'$set': {'status': 'succeeded', 'confirmed_at': datetime.utcnow()}}
    )
    
    await db.bookings.update_one(
        {'id': booking_id},
        {'$set': {'paid': True, 'escrow_status': 'held', 'paid_at': datetime.utcnow()}}
    )
    
    # Notify caregiver
    await create_notification(
        booking['caregiver_user_id'],
        'Pagamento recebido!',
        f'O pagamento para o atendimento de {booking["elder_name"]} foi confirmado',
        'payment_received',
        {'booking_id': booking_id}
    )
    
    return {'success': True, 'message': 'Payment confirmed'}

@api_router.post("/payments/release-escrow")
async def release_escrow(booking_id: str, user = Depends(get_current_user)):
    """Release escrow payment to caregiver after service completion"""
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    if booking['status'] != 'completed':
        raise HTTPException(status_code=400, detail='Booking must be completed first')
    
    if booking.get('escrow_status') != 'held':
        raise HTTPException(status_code=400, detail='Escrow not available for release')
    
    # Calculate caregiver payout (total - platform fee)
    caregiver_payout = booking['price_cents']
    
    # Record payout
    payout = {
        'id': str(uuid.uuid4()),
        'booking_id': booking_id,
        'caregiver_id': booking['caregiver_id'],
        'amount_cents': caregiver_payout,
        'status': 'completed',
        'created_at': datetime.utcnow()
    }
    await db.payouts.insert_one(payout)
    
    await db.bookings.update_one(
        {'id': booking_id},
        {'$set': {'escrow_status': 'released', 'released_at': datetime.utcnow()}}
    )
    
    # Notify caregiver
    await create_notification(
        booking['caregiver_user_id'],
        'Pagamento liberado!',
        f'R$ {caregiver_payout/100:.2f} foi transferido para sua conta',
        'payout_completed',
        {'booking_id': booking_id, 'amount_cents': caregiver_payout}
    )
    
    return {'success': True, 'payout_cents': caregiver_payout}

@api_router.get("/payments/history")
async def get_payment_history(user = Depends(get_current_user)):
    """Get payment history for user"""
    if user['role'] == 'client':
        payments = await db.payments.find({'client_id': user['id']}).sort('created_at', -1).to_list(50)
    else:
        profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
        if not profile:
            return []
        payouts = await db.payouts.find({'caregiver_id': profile['id']}).sort('created_at', -1).to_list(50)
        return payouts
    
    # Remove _id for serialization
    for p in payments:
        if '_id' in p:
            del p['_id']
    
    return payments

# ============ FAMILY SHARE ENDPOINTS ============

@api_router.post("/family-share/invite", response_model=FamilyShareResponse)
async def invite_family_share(invite: FamilyShareInvite, user = Depends(get_current_user)):
    """Invite a family member to share the cost of a booking"""
    booking = await db.bookings.find_one({'id': invite.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    if booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Only booking owner can invite')
    
    # Check total shares don't exceed 100%
    existing_shares = await db.family_shares.find({'booking_id': invite.booking_id}).to_list(100)
    total_shared = sum(s['share_percent'] for s in existing_shares)
    if total_shared + invite.share_percent > 100:
        raise HTTPException(status_code=400, detail=f'Total share cannot exceed 100%. Current: {total_shared}%')
    
    share_amount = int(booking['total_cents'] * invite.share_percent / 100)
    
    share_id = str(uuid.uuid4())
    share = {
        'id': share_id,
        'booking_id': invite.booking_id,
        'inviter_id': user['id'],
        'inviter_name': user['name'],
        'invitee_email': invite.email,
        'invitee_id': None,  # Will be set when user accepts
        'share_percent': invite.share_percent,
        'amount_cents': share_amount,
        'status': 'pending',
        'paid': False,
        'created_at': datetime.utcnow()
    }
    await db.family_shares.insert_one(share)
    
    # Create notification for invitee if they're a user
    invitee = await db.users.find_one({'email': invite.email})
    if invitee:
        await create_notification(
            invitee['id'],
            'Convite Family Share',
            f'{user["name"]} convidou você para dividir os custos de um cuidado (R$ {share_amount/100:.2f})',
            'family_share_invite',
            {'share_id': share_id, 'booking_id': invite.booking_id}
        )
    
    return FamilyShareResponse(**share)

@api_router.get("/family-share/{booking_id}")
async def get_family_shares(booking_id: str, user = Depends(get_current_user)):
    """Get all family shares for a booking"""
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    shares = await db.family_shares.find({'booking_id': booking_id}).to_list(100)
    
    for s in shares:
        if '_id' in s:
            del s['_id']
    
    # Calculate owner's share
    total_shared = sum(s['share_percent'] for s in shares)
    owner_share = 100 - total_shared
    owner_amount = int(booking['total_cents'] * owner_share / 100)
    
    return {
        'shares': shares,
        'owner_share_percent': owner_share,
        'owner_amount_cents': owner_amount,
        'total_cents': booking['total_cents']
    }

@api_router.put("/family-share/{share_id}/accept")
async def accept_family_share(share_id: str, user = Depends(get_current_user)):
    """Accept a family share invitation"""
    share = await db.family_shares.find_one({'id': share_id})
    if not share:
        raise HTTPException(status_code=404, detail='Share not found')
    
    if share['invitee_email'] != user['email']:
        raise HTTPException(status_code=403, detail='This invitation is for a different email')
    
    await db.family_shares.update_one(
        {'id': share_id},
        {'$set': {'status': 'accepted', 'invitee_id': user['id'], 'accepted_at': datetime.utcnow()}}
    )
    
    # Notify inviter
    await create_notification(
        share['inviter_id'],
        'Convite aceito!',
        f'{user["name"]} aceitou dividir o custo do cuidado',
        'family_share_accepted',
        {'share_id': share_id}
    )
    
    return {'success': True, 'message': 'Share accepted'}

@api_router.post("/family-share/{share_id}/pay")
async def pay_family_share(share_id: str, user = Depends(get_current_user)):
    """Pay a family share"""
    share = await db.family_shares.find_one({'id': share_id})
    if not share:
        raise HTTPException(status_code=404, detail='Share not found')
    
    if share['invitee_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    if share.get('paid'):
        raise HTTPException(status_code=400, detail='Already paid')
    
    # Simulate payment
    await db.family_shares.update_one(
        {'id': share_id},
        {'$set': {'paid': True, 'paid_at': datetime.utcnow()}}
    )
    
    # Check if all shares are paid
    booking_shares = await db.family_shares.find({'booking_id': share['booking_id']}).to_list(100)
    all_paid = all(s.get('paid', False) for s in booking_shares)
    
    if all_paid:
        # Mark booking as fully paid
        await db.bookings.update_one(
            {'id': share['booking_id']},
            {'$set': {'paid': True, 'escrow_status': 'held'}}
        )
    
    return {'success': True, 'message': 'Payment completed'}

# ============ ENHANCED CHAT ENDPOINTS ============

class ChatRoomCreate(BaseModel):
    participant_id: str
    booking_id: Optional[str] = None

class ChatRoomResponse(BaseModel):
    id: str
    participants: List[str]
    participant_names: Dict[str, str]
    booking_id: Optional[str]
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int
    created_at: datetime

@api_router.post("/chat/rooms")
async def create_or_get_chat_room(data: ChatRoomCreate, user = Depends(get_current_user)):
    """Create or get existing chat room between two users"""
    participants = sorted([user['id'], data.participant_id])
    
    # Check if room already exists
    existing = await db.chat_rooms.find_one({
        'participants': participants,
        'booking_id': data.booking_id
    })
    
    if existing:
        if '_id' in existing:
            del existing['_id']
        return existing
    
    # Get participant info
    other_user = await db.users.find_one({'id': data.participant_id})
    if not other_user:
        raise HTTPException(status_code=404, detail='User not found')
    
    room_id = str(uuid.uuid4())
    room = {
        'id': room_id,
        'participants': participants,
        'participant_names': {
            user['id']: user['name'],
            data.participant_id: other_user['name']
        },
        'booking_id': data.booking_id,
        'last_message': None,
        'last_message_at': None,
        'created_at': datetime.utcnow()
    }
    await db.chat_rooms.insert_one(room)
    
    return room

@api_router.get("/chat/rooms")
async def get_chat_rooms(user = Depends(get_current_user)):
    """Get all chat rooms for user"""
    try:
        user_id = str(user['id'])  # Ensure string
        
        # Use the same logic as debug endpoint
        all_rooms = await db.chat_rooms.find().to_list(100)
        matching_rooms = []
        
        for room in all_rooms:
            participants = room.get('participants', [])
            if user_id in participants:
                if '_id' in room:
                    del room['_id']
                
                # Count unread messages
                unread = await db.chat_messages.count_documents({
                    'room_id': room['id'],
                    'sender_id': {'$ne': user_id},
                    'read': False
                })
                room['unread_count'] = unread
                matching_rooms.append(room)
        
        # Sort by last_message_at
        matching_rooms.sort(key=lambda x: x.get('last_message_at') or '', reverse=True)
        
        return matching_rooms
    except Exception as e:
        logger.error(f"Error in get_chat_rooms: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/rooms/{room_id}/messages")
async def get_room_messages(room_id: str, limit: int = 50, user = Depends(get_current_user)):
    """Get messages from a chat room"""
    room = await db.chat_rooms.find_one({'id': room_id})
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')
    
    if user['id'] not in room['participants']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    messages = await db.chat_messages.find({'room_id': room_id}).sort('created_at', -1).limit(limit).to_list(limit)
    
    # Mark as read
    await db.chat_messages.update_many(
        {'room_id': room_id, 'sender_id': {'$ne': user['id']}, 'read': False},
        {'$set': {'read': True, 'read_at': datetime.utcnow()}}
    )
    
    for m in messages:
        if '_id' in m:
            del m['_id']
    
    return list(reversed(messages))

class RoomMessage(BaseModel):
    message: str
    message_type: Literal['text', 'image', 'care_update', 'system'] = 'text'
    image_base64: Optional[str] = None

@api_router.post("/chat/rooms/{room_id}/messages")
async def send_room_message(room_id: str, data: RoomMessage, user = Depends(get_current_user)):
    """Send a message in a chat room"""
    room = await db.chat_rooms.find_one({'id': room_id})
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')
    
    if user['id'] not in room['participants']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    # Block external contact info if booking not confirmed
    if room.get('booking_id'):
        booking = await db.bookings.find_one({'id': room['booking_id']})
        if booking and booking['status'] == 'pending':
            # Check for phone/email patterns
            import re
            contact_patterns = [
                r'\d{2}[\s-]?\d{4,5}[\s-]?\d{4}',  # Phone
                r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',  # Email
                r'whatsapp',
                r'telegram',
                r'instagram',
            ]
            message_lower = data.message.lower()
            for pattern in contact_patterns:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    raise HTTPException(
                        status_code=400, 
                        detail='Informações de contato externas são bloqueadas até a confirmação do agendamento'
                    )
    
    msg_id = str(uuid.uuid4())
    message = {
        'id': msg_id,
        'room_id': room_id,
        'sender_id': user['id'],
        'sender_name': user['name'],
        'message': data.message,
        'message_type': data.message_type,
        'image_base64': data.image_base64,
        'read': False,
        'created_at': datetime.utcnow()
    }
    await db.chat_messages.insert_one(message)
    
    # Update room
    await db.chat_rooms.update_one(
        {'id': room_id},
        {'$set': {'last_message': data.message[:50], 'last_message_at': datetime.utcnow()}}
    )
    
    # Notify other participants
    for participant_id in room['participants']:
        if participant_id != user['id']:
            await create_notification(
                participant_id,
                f'Nova mensagem de {user["name"]}',
                data.message[:50] + ('...' if len(data.message) > 50 else ''),
                'chat_message',
                {'room_id': room_id, 'message_id': msg_id}
            )
    
    if '_id' in message:
        del message['_id']
    return message

# ============ PUSH NOTIFICATION REGISTRATION ============

class PushTokenRegister(BaseModel):
    push_token: str
    device_type: Literal['ios', 'android', 'web'] = 'android'

@api_router.post("/notifications/register-push")
async def register_push_token(data: PushTokenRegister, user = Depends(get_current_user)):
    """Register device push token for notifications"""
    # Store push token
    await db.push_tokens.update_one(
        {'user_id': user['id'], 'push_token': data.push_token},
        {'$set': {
            'user_id': user['id'],
            'push_token': data.push_token,
            'device_type': data.device_type,
            'active': True,
            'updated_at': datetime.utcnow()
        }},
        upsert=True
    )
    
    return {'success': True, 'message': 'Push token registered'}

@api_router.delete("/notifications/unregister-push")
async def unregister_push_token(push_token: str, user = Depends(get_current_user)):
    """Unregister device push token"""
    await db.push_tokens.update_one(
        {'user_id': user['id'], 'push_token': push_token},
        {'$set': {'active': False}}
    )
    return {'success': True, 'message': 'Push token unregistered'}

# Helper function to send push notification
async def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Send push notification via Expo Push API"""
    tokens = await db.push_tokens.find({'user_id': user_id, 'active': True}).to_list(10)
    
    if not tokens:
        return
    
    messages = []
    for token_doc in tokens:
        message = {
            'to': token_doc['push_token'],
            'sound': 'default',
            'title': title,
            'body': body,
            'data': data or {}
        }
        messages.append(message)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://exp.host/--/api/v2/push/send',
                json=messages,
                headers={'Content-Type': 'application/json'},
                timeout=10.0
            )
            logger.info(f"Push notification sent: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")

# Update create_notification to also send push
async def create_notification_with_push(user_id: str, title: str, message: str, notification_type: str, data: dict = None):
    """Create notification and send push"""
    notification = await create_notification(user_id, title, message, notification_type, data)
    await send_push_notification(user_id, title, message, data)
    return notification

@api_router.get("/")
async def root():
    return {"message": "SeniorCare+ API", "version": "2.1.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

@api_router.get("/debug/chat-rooms")
async def debug_chat_rooms():
    """Debug endpoint to check chat rooms"""
    rooms = await db.chat_rooms.find().to_list(100)
    for r in rooms:
        if '_id' in r:
            del r['_id']
    return {"count": len(rooms), "rooms": rooms}

@api_router.get("/debug/chat-test/{user_id}")
async def debug_chat_test(user_id: str):
    """Debug endpoint to test chat query"""
    all_rooms = await db.chat_rooms.find().to_list(100)
    matching = []
    for room in all_rooms:
        if user_id in room.get('participants', []):
            if '_id' in room:
                del room['_id']
            matching.append(room)
    return {"user_id": user_id, "total_rooms": len(all_rooms), "matching": len(matching), "rooms": matching}

@api_router.get("/debug/whoami")
async def debug_whoami(user = Depends(get_current_user)):
    """Debug endpoint to see current user"""
    return {
        "user_id": user.get('id'),
        "user_id_type": str(type(user.get('id'))),
        "email": user.get('email'),
        "role": user.get('role')
    }

# Include router and configure CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
