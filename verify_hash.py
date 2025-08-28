#!/usr/bin/env python3
"""
Manual verification of Fiserv hash generation with special characters
Based on the exact parameters from the API logs
"""

import hmac
import hashlib
import base64

# Exact values from API logs
secret = "j}2W3P)Lwv"  # Contains special characters } and )
concatenated_string = "100.00|classic|985|HMACSHA256|DON-1756334028-18166|http://localhost:3000/donation/fail|http://localhost:3000/donation/success|760995999|Europe/Warsaw|2025:08:28-00:33:48|sale"
expected_hash = "Hh5GCF6AjpUBeFBquEwcKo0omqOE+LYEh+HsvGPzrqA="

print("=== Fiserv Hash Verification with Special Characters ===")
print(f"Secret: '{secret}'")
print(f"Special characters present: {[c for c in secret if c in '{}()[]<>@#$%^&*+=|\\:;\"\'?/.,']}")
print(f"Secret length: {len(secret)}")
print(f"Concatenated string: '{concatenated_string}'")
print(f"Concatenated length: {len(concatenated_string)}")

# Generate hash using HMAC-SHA256
signature = hmac.new(
    secret.encode('utf-8'),  # Secret as HMAC key
    concatenated_string.encode('utf-8'),  # Data to sign
    hashlib.sha256
).digest()

# Base64 encode the result
computed_hash = base64.b64encode(signature).decode('utf-8')

print(f"\nExpected hash: {expected_hash}")
print(f"Computed hash: {computed_hash}")
print(f"Hashes match: {computed_hash == expected_hash}")

# Additional checks
print(f"\nSecret bytes: {secret.encode('utf-8')}")
print(f"Secret hex: {secret.encode('utf-8').hex()}")

# Test with different encodings
print(f"\nTesting different encodings:")
encodings = ['utf-8', 'latin-1', 'ascii']
for encoding in encodings:
    try:
        test_signature = hmac.new(
            secret.encode(encoding),
            concatenated_string.encode(encoding),
            hashlib.sha256
        ).digest()
        test_hash = base64.b64encode(test_signature).decode('utf-8')
        print(f"{encoding}: {test_hash} {'✓' if test_hash == expected_hash else '✗'}")
    except Exception as e:
        print(f"{encoding}: ERROR - {e}")

