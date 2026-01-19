from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# The hash from the dump
h_hod = "$2b$04$v9Q4fCjBk6lC8n/oF0GKOu8PqYisre8J9z5yC0n9f5X5X/0z2z2z."

# Test if 'secret' works
print(f"Verifying 'secret': {verify_password('secret', h_hod)}")
