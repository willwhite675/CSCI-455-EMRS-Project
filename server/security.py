from Crypto.Protocol.KDF import bcrypt, bcrypt_check
from Crypto.Random import get_random_bytes

BCRYPT_COST = 12


def hash_password(password: str) -> bytes:
    password_bytes = password.encode("utf-8")
    salt = get_random_bytes(16)
    return bcrypt(password_bytes, BCRYPT_COST, salt)


def verify_password(password: str, stored_hash: bytes) -> bool:
    try:
        bcrypt_check(password.encode("utf-8"), stored_hash)
        return True
    except ValueError:
        return False