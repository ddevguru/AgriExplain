"""
Script to create admin user
Run this script to create an admin account
"""

from database import SessionLocal
from models import User
from auth import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@agrixplain.com").first()
        if admin:
            print("Admin user already exists!")
            print(f"Email: {admin.email}")
            print(f"Name: {admin.name}")
            print(f"Role: {admin.role}")
            return
        
        # Create admin user
        admin = User(
            email="admin@agrixplain.com",
            name="Admin User",
            hashed_password=get_password_hash("admin123456"),
            role="admin",
            phone="+919876543210"
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("Admin user created successfully!")
        print(f"Email: {admin.email}")
        print(f"Password: admin123456")
        print(f"Role: {admin.role}")
        print("\nYou can now login with these credentials.")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()

