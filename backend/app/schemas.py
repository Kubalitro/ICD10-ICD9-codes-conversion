from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserWithSubscription(User):
    subscription: Optional['Subscription'] = None


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Subscription Schemas
class SubscriptionBase(BaseModel):
    tier: str
    status: str


class Subscription(SubscriptionBase):
    id: int
    user_id: int
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# API Key Schemas
class APIKeyCreate(BaseModel):
    name: str


class APIKey(BaseModel):
    id: int
    name: str
    key: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ICD Code Schemas
class ICD10CodeBase(BaseModel):
    code: str
    description: str


class ICD10Code(ICD10CodeBase):
    id: int
    
    class Config:
        from_attributes = True


class ICD9CodeBase(BaseModel):
    code: str


class ICD9Code(ICD9CodeBase):
    id: int
    
    class Config:
        from_attributes = True


# Mapping Schemas
class MappingBase(BaseModel):
    approximate: bool
    no_map: bool
    combination: bool
    flags: str


class ICD10ToICD9Result(BaseModel):
    icd10_code: str
    icd10_description: str
    icd9_mappings: List[dict]


class ICD9ToICD10Result(BaseModel):
    icd9_code: str
    icd10_mappings: List[dict]


# Conversion Request/Response
class ConversionRequest(BaseModel):
    code: str
    from_version: str  # "icd10" or "icd9"
    to_version: str    # "icd9" or "icd10"


class ConversionResponse(BaseModel):
    success: bool
    input_code: str
    input_description: Optional[str]
    results: List[dict]
    is_approximate: bool
    message: Optional[str]


# Batch Conversion
class BatchConversionRequest(BaseModel):
    codes: List[str]
    from_version: str
    to_version: str


class BatchConversionResponse(BaseModel):
    success: bool
    results: List[ConversionResponse]
    total_processed: int


# Usage Stats
class UsageStats(BaseModel):
    daily_usage: int
    daily_limit: int
    tier: str
    remaining: int
    reset_at: datetime


# Update forward references
UserWithSubscription.model_rebuild()
