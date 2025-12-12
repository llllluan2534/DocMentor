"""Initial migration with document indexes

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

    # --- USERS ---
    if 'users' not in inspector.get_table_names():
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.Column('full_name', sa.String(), nullable=True),
            sa.Column('role', sa.Enum('STUDENT', 'LECTURER', 'ADMIN', name='userrole'), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True)
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # --- DOCUMENTS ---
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
            sa.Column('processed', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
        )
        op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
        op.create_index(op.f('ix_documents_title'), 'documents', ['title'], unique=False)
        op.create_index('idx_documents_user_id', 'documents', ['user_id'])
        op.create_index('idx_documents_file_type', 'documents', ['file_type'])
        op.create_index('idx_documents_processed', 'documents', ['processed'])
        op.create_index('idx_documents_created_at', 'documents', ['created_at'])
        op.create_index('idx_documents_file_size', 'documents', ['file_size'])
        # composite index helpful for user-scoped queries
        op.create_index('idx_documents_user_created_at', 'documents', ['user_id', 'created_at'])
    else:
        # Nếu bảng documents đã tồn tại, kiểm tra và thêm các index nếu chưa có
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('documents')]
        
        if 'idx_documents_user_id' not in existing_indexes:
            op.create_index('idx_documents_user_id', 'documents', ['user_id'])
        if 'idx_documents_file_type' not in existing_indexes:
            op.create_index('idx_documents_file_type', 'documents', ['file_type'])
        if 'idx_documents_processed' not in existing_indexes:
            op.create_index('idx_documents_processed', 'documents', ['processed'])
        if 'idx_documents_created_at' not in existing_indexes:
            op.create_index('idx_documents_created_at', 'documents', ['created_at'])
        if 'idx_documents_file_size' not in existing_indexes:
            op.create_index('idx_documents_file_size', 'documents', ['file_size'])
        if 'idx_documents_user_created_at' not in existing_indexes:
            op.create_index('idx_documents_user_created_at', 'documents', ['user_id', 'created_at'])
        
    # --- CONVERSATIONS ---
    if 'conversations' not in inspector.get_table_names():
        op.create_table(
            'conversations',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
        )
        op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)
        op.create_index('idx_conversations_user_pinned', 'conversations', ['user_id', 'is_pinned'])
    else:
        # Nếu bảng conversations đã tồn tại, thêm cột is_pinned nếu chưa có
        columns = [c['name'] for c in inspector.get_columns('conversations')]
        
        if 'is_pinned' not in columns:
            op.add_column(
                'conversations',
                sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.false())
            )
            op.create_index('idx_conversations_user_pinned', 'conversations', ['user_id', 'is_pinned'])


    # --- QUERIES ---
    if 'queries' not in inspector.get_table_names():
        # Tạo mới bảng queries với conversation_id
        op.create_table(
            'queries',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('conversation_id', sa.Integer(), nullable=True),  
            sa.Column('query_text', sa.Text(), nullable=False),
            sa.Column('response_text', sa.Text(), nullable=True),
            sa.Column('normalized_query', sa.String(), nullable=True),
            sa.Column('sources', sa.JSON(), nullable=True),
            sa.Column('execution_time', sa.Integer(), nullable=True),
            sa.Column('rating', sa.Float(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='SET NULL')  
        )
        op.create_index(op.f('ix_queries_id'), 'queries', ['id'], unique=False)
        op.create_index(op.f('ix_queries_normalized_query'), 'queries', ['normalized_query'], unique=False)
        op.create_index(op.f('ix_queries_conversation_id'), 'queries', ['conversation_id'], unique=False)  
    else:
        # Nếu bảng queries đã tồn tại, thêm cột conversation_id
        columns = [c['name'] for c in inspector.get_columns('queries')]
        
        # Thêm conversation_id nếu chưa có
        if 'conversation_id' not in columns:
            op.add_column('queries', sa.Column('conversation_id', sa.Integer(), nullable=True))
            op.create_index(op.f('ix_queries_conversation_id'), 'queries', ['conversation_id'], unique=False)
            # Thêm foreign key constraint
            op.create_foreign_key(
                'fk_queries_conversation_id',
                'queries',
                'conversations',
                ['conversation_id'],
                ['id'],
                ondelete='SET NULL'
            )
        
        if 'normalized_query' not in columns:
            op.add_column('queries', sa.Column('normalized_query', sa.String(), nullable=True))
            op.create_index(op.f('ix_queries_normalized_query'), 'queries', ['normalized_query'], unique=False)
        if 'rating' not in columns:
            op.add_column('queries', sa.Column('rating', sa.Float(), nullable=True))
        if 'user_id' not in columns:
            op.add_column('queries', sa.Column('user_id', sa.Integer(), nullable=False))
            op.create_foreign_key(
                'fk_queries_user_id',
                'queries',
                'users',
                ['user_id'],
                ['id'],
                ondelete='CASCADE'
            )

    # --- FEEDBACKS ---
    if 'feedbacks' not in inspector.get_table_names():
        op.create_table(
            'feedbacks',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('query_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('rating', sa.Integer(), nullable=False),
            sa.Column('feedback_text', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['query_id'], ['queries.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.UniqueConstraint('query_id')
        )
        op.create_index(op.f('ix_feedbacks_id'), 'feedbacks', ['id'], unique=False)

    # --- MANY-TO-MANY TABLES (THÊM MỚI) ---
    # conversation_documents
    if 'conversation_documents' not in inspector.get_table_names():
        op.create_table(
            'conversation_documents',
            sa.Column('conversation_id', sa.Integer(), nullable=False),
            sa.Column('document_id', sa.Integer(), nullable=False),
            sa.Column('added_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('conversation_id', 'document_id')
        )

    # conversation_queries
    if 'conversation_queries' not in inspector.get_table_names():
        op.create_table(
            'conversation_queries',
            sa.Column('conversation_id', sa.Integer(), nullable=False),
            sa.Column('query_id', sa.Integer(), nullable=False),
            sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('added_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['query_id'], ['queries.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('conversation_id', 'query_id')
        )


def downgrade() -> None:
    # Xóa many-to-many tables trước
    op.drop_table('conversation_queries')
    op.drop_table('conversation_documents')
    
    # Xóa feedbacks
    op.drop_table('feedbacks')
    
    # Xóa queries (giữ nguyên các thay đổi cũ)
    op.drop_constraint(None, 'queries', type_='foreignkey')
    op.drop_index(op.f('ix_queries_conversation_id'), table_name='queries')
    op.drop_index(op.f('ix_queries_normalized_query'), table_name='queries')
    op.drop_column('queries', 'rating')
    op.drop_column('queries', 'normalized_query')
    op.drop_column('queries', 'conversation_id')
    
    op.drop_index('idx_documents_user_created_at', table_name='documents')
    op.drop_index('idx_documents_file_size', table_name='documents')
    op.drop_index('idx_documents_created_at', table_name='documents')
    op.drop_index('idx_documents_processed', table_name='documents')
    op.drop_index('idx_documents_file_type', table_name='documents')
    op.drop_index('idx_documents_user_id', table_name='documents')
    
    # Xóa documents
    op.drop_index(op.f('ix_documents_title'), table_name='documents')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
    
    op.drop_index('idx_conversations_user_pinned', table_name='conversations')
    
    # Xóa conversations
    op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
    op.drop_table('conversations')
    
    # Xóa users
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')