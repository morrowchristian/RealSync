import requests
from io import BytesIO

BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"
PASSWORD = "adminpass"

# Step 1: Authenticate
auth_response = requests.post(f"{BASE_URL}/api/token/", json={
    "username": USERNAME,
    "password": PASSWORD
})
access_token = auth_response.json()["access"]
headers = {"Authorization": f"Bearer {access_token}"}

# Step 2: Get the first available lead ID
lead_response = requests.get(f"{BASE_URL}/api/leads/", headers=headers)
if not lead_response.ok or not lead_response.json():
    print("❌ No leads found. Please create a lead first.")
    exit()

lead_id = lead_response.json()[0]["id"]

# Step 3: Create dummy PDF and contract data
dummy_pdf = BytesIO(b"%PDF-1.4 Dummy PDF file for testing contract upload")
files = {
    "document": ("dummy_contract.pdf", dummy_pdf, "application/pdf")
}
data = {
    "lead": str(lead_id),
    "status": "signed"
}

# Step 4: Submit contract
response = requests.post(f"{BASE_URL}/api/contracts/", data=data, files=files, headers=headers)
if response.status_code == 201:
    print("✅ Signed contract created successfully.")
else:
    print(f"❌ Failed to create contract: {response.status_code}", response.json())
