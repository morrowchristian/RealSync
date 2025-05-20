# backend/tests/test_api.py
import requests
import time

BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"
PASSWORD = "adminpass"

# Step 1: Authenticate
auth_response = requests.post(f"{BASE_URL}/api/token/", json={
    "username": USERNAME,
    "password": PASSWORD
})

if auth_response.status_code != 200:
    print("❌ Authentication failed:", auth_response.json())
    exit()

access_token = auth_response.json()["access"]
refresh_token = auth_response.json()["refresh"]
headers = {"Authorization": f"Bearer {access_token}"}
print("✅ Access token retrieved.")

# Step 2: Access a protected endpoint
response = requests.get(f"{BASE_URL}/api/leads/", headers=headers)
print("✅ Valid access token response:", response.status_code)

# Step 3: Wait for token to expire (token lifetime is short for testing)
print("⏳ Waiting 70 seconds for token to expire...")
time.sleep(70)
expired_response = requests.get(f"{BASE_URL}/api/leads/", headers=headers)
print("⚠️ Expired access token response:", expired_response.status_code, expired_response.json())

# Step 4: Refresh token
refresh_response = requests.post(f"{BASE_URL}/api/token/refresh/", json={"refresh": refresh_token})
print("✅ Refresh token response:", refresh_response.status_code)

if refresh_response.status_code == 200:
    new_access_token = refresh_response.json()["access"]
    new_headers = {"Authorization": f"Bearer {new_access_token}"}
    follow_up = requests.get(f"{BASE_URL}/api/leads/", headers=new_headers)
    print("✅ New access token response:", follow_up.status_code)

    # Try deleting a signed contract
    signed_contracts = requests.get(f"{BASE_URL}/api/contracts/", headers=new_headers).json()
    signed = next((c for c in signed_contracts if c["status"].lower() == "signed"), None)

    if signed:
        del_response = requests.delete(f"{BASE_URL}/api/contracts/{signed['id']}/", headers=new_headers)
        print(f"🛑 Attempt to delete signed contract #{signed['id']} →", del_response.status_code, del_response.json())
    else:
        print("ℹ️ No signed contracts found to test deletion.")
