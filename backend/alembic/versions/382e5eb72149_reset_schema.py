"""reset schema

Revision ID: 382e5eb72149
Revises: 
Create Date: 2025-11-19 09:38:41.039820

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '382e5eb72149'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    # ==========================================================
    # 1. TẠO ENUM TYPES TRƯỚC
    # ==========================================================
    op.execute("CREATE TYPE IF NOT EXISTS userrole AS ENUM ('STUDENT', 'LECTURER', 'ADMIN')")

    # ==========================================================
    # 2. TẠO BẢNG USERS
    # ==========================================================
    if 'users' not in inspector.get_table_names():
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.Column('full_name', sa.String(), nullable=True),
            sa.Column('role', sa.Enum('STUDENT', 'LECTURER', 'ADMIN', name='userrole'), nullable=False, server_default='STUDENT'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=True)
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # ==========================================================
    # 3. TẠO BẢNG CONVERSATIONS (PHẢI TẠO TRƯỚC QUERIES)
    # ==========================================================
    if 'conversations' not in inspector.get_table_names():
        op.create_table(
            'conversations',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
        )
        op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)

    # ==========================================================
    # 4. TẠO BẢNG DOCUMENTS
    # ==========================================================
    if 'documents' not in inspector.get_table_names():
        op.create_table(
            'documents',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('file_path', sa.String(), nullable=False),
            sa.Column('file_type', sa.String(), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('doc_metadata', sa.JSON(), nullable=True),
            sa.Column('processed', sa.Boolean(), nullable=True, server_default='false'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
        )
        op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
        op.create_index(op.f('ix_documents_title'), 'documents', ['title'], unique=False)

    # ==========================================================
    # 5. TẠO BẢNG QUERIES (CÓ conversation_id)
    # ==========================================================
    if 'queries' not in inspector.get_table_names():
        op.create_table(
            'queries',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('conversation_id', sa.Integer(), nullable=True),  # ✅ THÊM conversation_id
            sa.Column('query_text', sa.Text(), nullable=False),
            sa.Column('response_text', sa.Text(), nullable=True),
            sa.Column('normalized_query', sa.String(), nullable=True),
            sa.Column('sources', sa.JSON(), nullable=True),
            sa.Column('execution_time', sa.Integer(), nullable=True),
            sa.Column('rating', sa.Float(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='SET NULL')  # ✅ THÊM FK
        )
        op.create_index(op.f('ix_queries_id'), 'queries', ['id'], unique=False)
        op.create_index(op.f('ix_queries_normalized_query'), 'queries', ['normalized_query'], unique=False)
        op.create_index(op.f('ix_queries_conversation_id'), 'queries', ['conversation_id'], unique=False)

    # ==========================================================
    # 6. TẠO BẢNG FEEDBACKS (SAU QUERIES)
    # ==========================================================
    if 'feedbacks' not in inspector.get_table_names():
        op.create_table(
            'feedbacks',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('query_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('rating', sa.Integer(), nullable=False),
            sa.Column('feedback_text', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['query_id'], ['queries.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.UniqueConstraint('query_id')
        )
        op.create_index(op.f('ix_feedbacks_id'), 'feedbacks', ['id'], unique=False)

    # ==========================================================
    # 7. TẠO BẢNG LIÊN KẾT MANY-TO-MANY (CONVERSATION_DOCUMENTS)
    # ==========================================================
    if 'conversation_documents' not in inspector.get_table_names():
        op.create_table(
            'conversation_documents',
            sa.Column('conversation_id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('document_id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE')
        )

    # ==========================================================
    # 8. TẠO BẢNG LIÊN KẾT MANY-TO-MANY (CONVERSATION_QUERIES)
    # ==========================================================
    if 'conversation_queries' not in inspector.get_table_names():
        op.create_table(
            'conversation_queries',
            sa.Column('conversation_id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('query_id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['query_id'], ['queries.id'], ondelete='CASCADE')
        )


def downgrade() -> None:
    # ==========================================================
    # XÓA BẢNG THEO THỨ TỰ NGƯỢC LẠI
    # ==========================================================
    
    # 1. Xóa bảng liên kết many-to-many trước
    op.drop_table('conversation_queries')
    op.drop_table('conversation_documents')
    
    # 2. Xóa bảng feedbacks
    op.drop_table('feedbacks')
    
    # 3. Xóa bảng queries
    op.drop_index(op.f('ix_queries_conversation_id'), table_name='queries')
    op.drop_index(op.f('ix_queries_normalized_query'), table_name='queries')
    op.drop_index(op.f('ix_queries_id'), table_name='queries')
    op.drop_table('queries')
    
    # 4. Xóa bảng documents
    op.drop_index(op.f('ix_documents_title'), table_name='documents')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
    
    # 5. Xóa bảng conversations
    op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
    op.drop_table('conversations')
    
    # 6. Xóa bảng users
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # 7. Xóa enum type
    op.execute("DROP TYPE IF EXISTS userrole")