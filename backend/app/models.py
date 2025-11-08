from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Subscription relationship
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    api_keys = relationship("APIKey", back_populates="user")
    usage_logs = relationship("UsageLog", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    tier = Column(String, default="free")  # free, basic, pro, enterprise
    stripe_customer_id = Column(String, unique=True, nullable=True)
    stripe_subscription_id = Column(String, unique=True, nullable=True)
    status = Column(String, default="active")  # active, cancelled, expired
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="subscription")


class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    key = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="api_keys")


class UsageLog(Base):
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=True)
    endpoint = Column(String)
    request_count = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="usage_logs")
    
    __table_args__ = (
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
    )


class ICD10Code(Base):
    __tablename__ = "icd10_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)
    
    # Relationships to ICD9
    icd9_mappings = relationship("ICD10ToICD9Mapping", back_populates="icd10_code")


class ICD9Code(Base):
    __tablename__ = "icd9_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    
    # Relationships to ICD10
    icd10_mappings = relationship("ICD9ToICD10Mapping", back_populates="icd9_code")


class ICD10ToICD9Mapping(Base):
    __tablename__ = "icd10_to_icd9_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    icd10_code_id = Column(Integer, ForeignKey("icd10_codes.id"), index=True)
    icd9_code_id = Column(Integer, ForeignKey("icd9_codes.id"), index=True)
    icd10_code_str = Column(String, index=True)
    icd9_code_str = Column(String, index=True)
    flags = Column(String)
    approximate = Column(Boolean, default=False)
    no_map = Column(Boolean, default=False)
    combination = Column(Boolean, default=False)
    scenario = Column(Integer)
    choice_list = Column(Integer)
    
    icd10_code = relationship("ICD10Code", back_populates="icd9_mappings")


class ICD9ToICD10Mapping(Base):
    __tablename__ = "icd9_to_icd10_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    icd9_code_id = Column(Integer, ForeignKey("icd9_codes.id"), index=True)
    icd10_code_id = Column(Integer, ForeignKey("icd10_codes.id"), index=True)
    icd9_code_str = Column(String, index=True)
    icd10_code_str = Column(String, index=True)
    flags = Column(String)
    approximate = Column(Boolean, default=False)
    no_map = Column(Boolean, default=False)
    combination = Column(Boolean, default=False)
    scenario = Column(Integer)
    choice_list = Column(Integer)
    
    icd9_code = relationship("ICD9Code", back_populates="icd10_mappings")
