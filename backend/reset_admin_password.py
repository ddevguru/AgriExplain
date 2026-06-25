"""
Reset admin password to default
Run this to reset admin password to: admin123456
"""

from database import SessionLocal
from models import User
from auth import get_password_hash

def reset_admin_password():
    db = SessionLocal()
    try:
        # Find admin user
        admin = db.query(User).filter(User.email == "admin@agrixplain.com").first()
        if not admin:
            print("Admin user not found. Creating new admin user...")
            admin = User(
                email="admin@agrixplain.com",
                name="Admin User",
                hashed_password=get_password_hash("admin123456"),
                role="admin",
                phone="+919876543210"
            )
            db.add(admin)
        else:
            # Reset password
            admin.hashed_password = get_password_hash("admin123456")
            print("Resetting admin password...")
        
        db.commit()
        db.refresh(admin)
        
        print("\n" + "="*50)
        print("ADMIN CREDENTIALS")
        print("="*50)
        print(f"Email: {admin.email}")
        print(f"Password: admin123456")
        print(f"Role: {admin.role}")
        print("="*50)
        print("\nYou can now login with these credentials at:")
        print("http://localhost:3000/login")
        print("\nAfter login, you will be redirected to admin dashboard.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()

