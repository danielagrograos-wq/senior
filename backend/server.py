from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'seniorcare-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="SeniorCare+ API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    verified: bool
    created_at: datetime

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
    biometric_verified: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    photo: Optional[str] = None
    created_at: datetime

class ClientProfileCreate(BaseModel):
    elder_name: str
    elder_age: int
    elder_address: str
    elder_city: str
    elder_needs: List[str] = []
    preferences: dict = {}

class ClientProfileResponse(BaseModel):
    id: str
    user_id: str
    elder_name: str
    elder_age: int
    elder_address: str
    elder_city: str
    elder_needs: List[str] = []
    preferences: dict = {}
    created_at: datetime

class BookingCreate(BaseModel):
    caregiver_id: str
    start_datetime: datetime
    end_datetime: datetime
    notes: Optional[str] = None
    service_type: Literal['hourly', 'night_shift'] = 'hourly'

class BookingResponse(BaseModel):
    id: str
    caregiver_id: str
    caregiver_name: str
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
    created_at: datetime

class MediaUpload(BaseModel):
    booking_id: str
    media_base64: str
    media_type: Literal['photo', 'video'] = 'photo'
    caption: Optional[str] = None

class MediaResponse(BaseModel):
    id: str
    booking_id: str
    caregiver_id: str
    media_base64: str
    media_type: str
    caption: Optional[str] = None
    created_at: datetime

class DocumentUpload(BaseModel):
    doc_type: Literal['background_check', 'certification', 'id_document']
    doc_base64: str
    expiry_date: Optional[datetime] = None

class VerificationResponse(BaseModel):
    id: str
    caregiver_id: str
    doc_type: str
    status: str
    expiry_date: Optional[datetime] = None
    review_notes: Optional[str] = None
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

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if email already exists
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
        'created_at': datetime.utcnow()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id, user_data.role)
    return {
        'token': token,
        'user': {
            'id': user_id,
            'name': user_data.name,
            'email': user_data.email,
            'phone': user_data.phone,
            'role': user_data.role,
            'verified': False
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(user['id'], user['role'])
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role'],
            'verified': user['verified']
        }
    }

@api_router.get("/auth/me", response_model=dict)
async def get_me(user = Depends(get_current_user)):
    # Get profile based on role
    profile = None
    if user['role'] == 'caregiver':
        profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    elif user['role'] == 'client':
        profile = await db.client_profiles.find_one({'user_id': user['id']})
    
    return {
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role'],
            'verified': user['verified']
        },
        'profile': profile
    }

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
        'biometric_verified': False,
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
    skip: int = 0,
    limit: int = 20
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
    return [CaregiverProfileResponse(**c) for c in caregivers]

@api_router.get("/caregivers/{caregiver_id}", response_model=CaregiverProfileResponse)
async def get_caregiver(caregiver_id: str):
    caregiver = await db.caregiver_profiles.find_one({'id': caregiver_id})
    if not caregiver:
        raise HTTPException(status_code=404, detail='Caregiver not found')
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

PLATFORM_FEE_PERCENT = 15  # 15% platform fee

@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking_data: BookingCreate, user = Depends(get_current_user)):
    if user['role'] != 'client':
        raise HTTPException(status_code=403, detail='Only clients can create bookings')
    
    # Get caregiver
    caregiver = await db.caregiver_profiles.find_one({'id': booking_data.caregiver_id})
    if not caregiver:
        raise HTTPException(status_code=404, detail='Caregiver not found')
    
    # Get client profile
    client_profile = await db.client_profiles.find_one({'user_id': user['id']})
    if not client_profile:
        raise HTTPException(status_code=400, detail='Please create a client profile first')
    
    # Calculate price
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
        'created_at': datetime.utcnow()
    }
    await db.bookings.insert_one(booking)
    return BookingResponse(**booking)

@api_router.get("/bookings", response_model=List[BookingResponse])
async def list_bookings(
    status: Optional[str] = None,
    user = Depends(get_current_user)
):
    query = {}
    if user['role'] == 'client':
        query['client_id'] = user['id']
    elif user['role'] == 'caregiver':
        query['caregiver_id'] = user['id']
        # Get caregiver profile to find ID
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
    
    # Check access
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
    
    # Check access
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    caregiver_profile_id = profile['id'] if profile else None
    
    if user['role'] == 'caregiver' and booking['caregiver_id'] != caregiver_profile_id:
        raise HTTPException(status_code=403, detail='Access denied')
    if user['role'] == 'client' and booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    await db.bookings.update_one({'id': booking_id}, {'$set': {'status': status}})
    return {'message': f'Booking status updated to {status}'}

# ============ MEDIA ENDPOINTS ============

@api_router.post("/media", response_model=MediaResponse)
async def upload_media(media_data: MediaUpload, user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can upload media')
    
    # Verify booking exists and belongs to caregiver
    booking = await db.bookings.find_one({'id': media_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile or booking['caregiver_id'] != profile['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    
    media_id = str(uuid.uuid4())
    media = {
        'id': media_id,
        'booking_id': media_data.booking_id,
        'caregiver_id': profile['id'],
        'media_base64': media_data.media_base64,
        'media_type': media_data.media_type,
        'caption': media_data.caption,
        'created_at': datetime.utcnow()
    }
    await db.media_updates.insert_one(media)
    return MediaResponse(**media)

@api_router.get("/media/{booking_id}", response_model=List[MediaResponse])
async def get_booking_media(booking_id: str, user = Depends(get_current_user)):
    booking = await db.bookings.find_one({'id': booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    
    # Check access
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    caregiver_profile_id = profile['id'] if profile else None
    
    if user['role'] == 'client' and booking['client_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Access denied')
    if user['role'] == 'caregiver' and booking['caregiver_id'] != caregiver_profile_id:
        raise HTTPException(status_code=403, detail='Access denied')
    
    media = await db.media_updates.find({'booking_id': booking_id}).sort('created_at', -1).to_list(100)
    return [MediaResponse(**m) for m in media]

# ============ DOCUMENT/VERIFICATION ENDPOINTS ============

@api_router.post("/caregivers/documents", response_model=VerificationResponse)
async def upload_document(doc_data: DocumentUpload, user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can upload documents')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Caregiver profile not found')
    
    doc_id = str(uuid.uuid4())
    document = {
        'id': doc_id,
        'caregiver_id': profile['id'],
        'doc_type': doc_data.doc_type,
        'doc_base64': doc_data.doc_base64,
        'status': 'pending',
        'expiry_date': doc_data.expiry_date,
        'review_notes': None,
        'created_at': datetime.utcnow()
    }
    await db.verifications.insert_one(document)
    
    # Update profile background check status
    if doc_data.doc_type == 'background_check':
        await db.caregiver_profiles.update_one(
            {'id': profile['id']},
            {'$set': {'background_check_status': 'pending_review'}}
        )
    
    return VerificationResponse(**document)

@api_router.get("/caregivers/documents", response_model=List[VerificationResponse])
async def get_my_documents(user = Depends(get_current_user)):
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can view their documents')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Caregiver profile not found')
    
    docs = await db.verifications.find({'caregiver_id': profile['id']}).to_list(100)
    return [VerificationResponse(**d) for d in docs]

# ============ BIOMETRIC ENDPOINTS (MOCK) ============

@api_router.post("/biometric/liveness")
async def verify_liveness(selfie_base64: str = Form(...), user = Depends(get_current_user)):
    """Mock liveness verification - always returns success in MVP"""
    if user['role'] != 'caregiver':
        raise HTTPException(status_code=403, detail='Only caregivers can verify biometrics')
    
    profile = await db.caregiver_profiles.find_one({'user_id': user['id']})
    if not profile:
        raise HTTPException(status_code=404, detail='Caregiver profile not found')
    
    # Mock verification - in production, integrate with Azure Face/TrueFace
    await db.caregiver_profiles.update_one(
        {'id': profile['id']},
        {'$set': {'biometric_verified': True, 'last_biometric_check': datetime.utcnow()}}
    )
    
    # Log the verification
    await db.biometric_logs.insert_one({
        'id': str(uuid.uuid4()),
        'caregiver_id': profile['id'],
        'status': 'success',
        'timestamp': datetime.utcnow()
    })
    
    return {'success': True, 'message': 'Liveness verification successful (mock)'}

# ============ REVIEW ENDPOINTS ============

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
    
    # Check if already reviewed
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
    
    return ReviewResponse(**review)

@api_router.get("/reviews/{caregiver_id}", response_model=List[ReviewResponse])
async def get_caregiver_reviews(caregiver_id: str):
    reviews = await db.reviews.find({'caregiver_id': caregiver_id}).sort('created_at', -1).to_list(100)
    return [ReviewResponse(**r) for r in reviews]

# ============ ADMIN ENDPOINTS ============

@api_router.get("/admin/verification-queue", response_model=List[VerificationResponse])
async def get_verification_queue(user = Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    docs = await db.verifications.find({'status': 'pending'}).to_list(100)
    return [VerificationResponse(**d) for d in docs]

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
    
    # Update caregiver verification status if background check
    if doc['doc_type'] == 'background_check':
        new_status = 'approved' if status == 'approved' else 'rejected'
        update_data = {'background_check_status': new_status}
        if status == 'approved':
            update_data['verified'] = True
        await db.caregiver_profiles.update_one(
            {'id': doc['caregiver_id']},
            {'$set': update_data}
        )
    
    return {'message': f'Document {status}'}

@api_router.get("/admin/caregivers", response_model=List[CaregiverProfileResponse])
async def admin_list_caregivers(user = Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    caregivers = await db.caregiver_profiles.find().to_list(1000)
    return [CaregiverProfileResponse(**c) for c in caregivers]

@api_router.get("/admin/stats")
async def get_admin_stats(user = Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    total_caregivers = await db.caregiver_profiles.count_documents({})
    verified_caregivers = await db.caregiver_profiles.count_documents({'verified': True})
    total_clients = await db.client_profiles.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    completed_bookings = await db.bookings.count_documents({'status': 'completed'})
    pending_verifications = await db.verifications.count_documents({'status': 'pending'})
    
    return {
        'total_caregivers': total_caregivers,
        'verified_caregivers': verified_caregivers,
        'total_clients': total_clients,
        'total_bookings': total_bookings,
        'completed_bookings': completed_bookings,
        'pending_verifications': pending_verifications
    }

# ============ CITIES/SPECIALIZATIONS ============

@api_router.get("/cities")
async def get_cities():
    """Get list of supported cities"""
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
    """Get list of caregiver specializations"""
    return {
        'specializations': [
            'Cuidados Gerais',
            'Alzheimer/Demência',
            'Pós-Operatório',
            'Fisioterapia',
            'Enfermagem',
            'Acompanhamento Hospitalar',
            'Cuidados Noturnos',
            'Mobilidade Reduzida',
            'Diabetes',
            'Hipertensão'
        ]
    }

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "SeniorCare+ API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

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
