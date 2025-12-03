import requests
import os

BASE_URL = "http://localhost:8000"

print("="*60)
print("🧪 TESTING EXPORT FEATURES")
print("="*60)

# 1. Login
print("\n1️⃣ Login...")
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "ngochanpt2018@gmail.com",
        "password": "ngochan1801"
    }
)

token = login_response.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Logged in")

# 2. Get document
print("\n2️⃣ Getting document...")
docs_response = requests.get(f"{BASE_URL}/documents/", headers=headers)
documents = [doc for doc in docs_response.json()['documents'] if doc['processed']]

if not documents:
    print("❌ No documents!")
    exit()

doc = documents[0]
print(f"✅ Using: {doc['title']} (ID: {doc['id']})")

# 3. Export Summary to PDF
print(f"\n{'='*60}")
print("3️⃣ EXPORTING SUMMARY TO PDF")
print('='*60)

response = requests.post(
    f"{BASE_URL}/analysis/summary/export/pdf",
    headers=headers,
    json={
        "document_id": doc['id'],
        "length": "medium"
    },
    stream=True
)

if response.status_code == 200:
    filename = "test_summary.pdf"
    with open(filename, 'wb') as f:
        f.write(response.content)
    print(f"✅ PDF saved: {filename} ({len(response.content)} bytes)")
    print(f"📂 File size: {len(response.content) / 1024:.2f} KB")
else:
    print(f"❌ Error: {response.text}")

# 4. Export Summary to DOCX
print(f"\n{'='*60}")
print("4️⃣ EXPORTING SUMMARY TO DOCX")
print('='*60)

response = requests.post(
    f"{BASE_URL}/analysis/summary/export/docx",
    headers=headers,
    json={
        "document_id": doc['id'],
        "length": "short"
    },
    stream=True
)

if response.status_code == 200:
    filename = "test_summary.docx"
    with open(filename, 'wb') as f:
        f.write(response.content)
    print(f"✅ DOCX saved: {filename} ({len(response.content)} bytes)")
    print(f"📂 File size: {len(response.content) / 1024:.2f} KB")
else:
    print(f"❌ Error: {response.text}")

# 5. Export Quiz to PDF (with answers)
print(f"\n{'='*60}")
print("5️⃣ EXPORTING QUIZ TO PDF")
print('='*60)

response = requests.post(
    f"{BASE_URL}/analysis/quiz/export/pdf?include_answers=true",
    headers=headers,
    json={
        "document_id": doc['id'],
        "num_questions": 5,
        "difficulty": "medium"
    },
    stream=True
)

if response.status_code == 200:
    filename = "test_quiz.pdf"
    with open(filename, 'wb') as f:
        f.write(response.content)
    print(f"✅ Quiz PDF saved: {filename} ({len(response.content)} bytes)")
    print(f"📂 File size: {len(response.content) / 1024:.2f} KB")
else:
    print(f"❌ Error: {response.text}")

print("\n" + "="*60)
print("✅ EXPORT TESTS COMPLETED!")
print("📂 Check your files: test_summary.pdf, test_summary.docx, test_quiz.pdf")
print("="*60)