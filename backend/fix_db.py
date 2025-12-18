# File: backend/fix_db.py
from app.database import engine, Base
# Import model Document để SQLAlchemy nhìn thấy cái bảng trung gian mới
from app.models.document import Document, query_document_association

print("🛠️ Đang kiểm tra database...")

# Lệnh này sẽ tạo bảng 'query_document_association' vì nó chưa tồn tại
Base.metadata.create_all(bind=engine)

print("✅ Đã tạo xong các bảng còn thiếu! Bạn có thể chạy lại Server.")