import requests
import time

# ----------------------------
# Configuration
# ----------------------------
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"
PASSWORD = "adminpass"

# ----------------------------
# Step 1: Authenticate and get tokens
# ----------------------------
auth_response = requests.post(f"{BASE_URL}/api/token/", json={
    "username": USERNAME,
    "password": PASSWORD
})

if auth_response.status_code != 200:
    print("❌ Failed to authenticate:", auth_response.json())
    exit()

tokens = auth_response.json()
access_token = tokens["access"]
refresh_token = tokens["refresh"]
print("✅ Access token retrieved.")

# ----------------------------
# Step 2: Validate access token
# ----------------------------
headers = {"Authorization": f"Bearer {access_token}"}
check_response = requests.get(f"{BASE_URL}/api/leads/", headers=headers)
print(f"✅ Valid access token response: {check_response.status_code}")

# ----------------------------
# Step 3: Wait for token to expire (simulate 70s delay)
# ----------------------------
print("⏳ Waiting 70 seconds for token to expire...")
time.sleep(70)

expired_response = requests.get(f"{BASE_URL}/api/leads/", headers=headers)
print("⚠️ Expired access token response:", expired_response.status_code, expired_response.json())

# ----------------------------
# Step 4: Refresh token
# ----------------------------
refresh_response = requests.post(f"{BASE_URL}/api/token/refresh/", json={"refresh": refresh_token})
if refresh_response.status_code == 200:
    new_access_token = refresh_response.json()["access"]
    headers = {"Authorization": f"Bearer {new_access_token}"}
    print("✅ Refresh token response:", refresh_response.status_code)
else:
    print("❌ Refresh failed:", refresh_response.json())
    exit()

# ----------------------------
# Step 5: Get contracts and test deleting a signed one
# ----------------------------
contracts = requests.get(f"{BASE_URL}/api/contracts/?all=true", headers=headers)
if contracts.status_code != 200:
    print("❌ Failed to fetch contracts:", contracts.json())
    exit()

signed_contracts = [c for c in contracts.json() if c["status"].lower() == "signed"]
if signed_contracts:
    contract_id = signed_contracts[0]["id"]
    delete_response = requests.delete(f"{BASE_URL}/api/contracts/{contract_id}/", headers=headers)
    print(f"🛑 Attempt to delete signed contract #{contract_id} → {delete_response.status_code} {delete_response.json()}")
else:
    print("ℹ️ No signed contracts found to test deletion.")
