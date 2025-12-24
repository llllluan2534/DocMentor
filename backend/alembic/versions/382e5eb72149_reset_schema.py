"""Initial migration with document indexes, OAuth support and Folders

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
    existing_tables = inspector.get_table_names()

    # =========================================================
    # 1. USERS TABLE
    # =========================================================
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('hashed_password', sa.String(), nullable=True), 
            sa.Column('full_name', sa.String(), nullable=True),
            sa.Column('avatar_url', sa.String(), nullable=True),
            sa.Column('role', sa.Enum('STUDENT', 'LECTURER', 'ADMIN', name='userrole'), nullable=False),
            sa.Column('auth_provider', sa.String(), nullable=False, server_default='email'),
            sa.Column('google_id', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True)
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)
    else:
        # Update existing users table if needed
        columns = {c['name']: c for c in inspector.get_columns('users')}
        if 'hashed_password' in columns and not columns['hashed_password']['nullable']:
            with op.batch_alter_table('users') as batch_op:
                batch_op.alter_column('hashed_password', nullable=True)
        
        if 'avatar_url' not in columns:
            op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))
        if 'auth_provider' not in columns:
            op.add_column('users', sa.Column('auth_provider', sa.String(), nullable=False, server_default='email'))
        if 'google_id' not in columns:
            op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
            existing_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
            if 'ix_users_google_id' not in existing_indexes:
                op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)

    # =========================================================
    # 2. FOLDERS TABLE (NEW)
    # =========================================================
    if 'folders' not in existing_tables:
        op.create_table(
            'folders',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
        )
        op.create_index(op.f('ix_folders_id'), 'folders', ['id'], unique=False)
        op.create_index('idx_folders_user_id', 'folders', ['user_id'])

    # =========================================================
    # 3. DOCUMENTS TABLE (Updated with folder_id)
    # =========================================================
    if 'documents' not in existing_tables:
        op.create_table(
            'documents',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('folder_id', sa.Integer(), nullable=True), # ✨ NEW: Link to folder
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('file_path', sa.String(), nullable=False),
            sa.Column('file_type', sa.String(), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('doc_metadata', sa.JSON(), nullable=True),
            sa.Column('processed', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['folder_id'], ['folders.id'], ondelete='SET NULL') # ✨ NEW: Set NULL on delete
        )
        op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
        op.create_index(op.f('ix_documents_title'), 'documents', ['title'], unique=False)
        op.create_index('idx_documents_user_id', 'documents', ['user_id'])
        op.create_index('idx_documents_folder_id', 'documents', ['folder_id']) # ✨ NEW Index
    else:
        # Add folder_id to existing documents table
        columns = [c['name'] for c in inspector.get_columns('documents')]
        if 'folder_id' not in columns:
            op.add_column('documents', sa.Column('folder_id', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_documents_folder_id', 'documents', 'folders', ['folder_id'], ['id'], ondelete='SET NULL')
            op.create_index('idx_documents_folder_id', 'documents', ['folder_id'])

    # =========================================================
    # 4. CONVERSATIONS
    # =========================================================
    if 'conversations' not in existing_tables:
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

    # =========================================================
    # 5. QUERIES
    # =========================================================
    if 'queries' not in existing_tables:
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

    # =========================================================
    # 6. FEEDBACKS
    # =========================================================
    if 'feedbacks' not in existing_tables:
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

    # =========================================================
    # 7. MANY-TO-MANY TABLES
    # =========================================================
    if 'conversation_documents' not in existing_tables:
        op.create_table(
            'conversation_documents',
            sa.Column('conversation_id', sa.Integer(), nullable=False),
            sa.Column('document_id', sa.Integer(), nullable=False),
            sa.Column('added_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('conversation_id', 'document_id')
        )

    if 'conversation_queries' not in existing_tables:
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
    # Logic downgrade (Keep existing logic or simplified)
    op.drop_table('conversation_queries')
    op.drop_table('conversation_documents')
    op.drop_table('feedbacks')
    op.drop_table('queries')
    op.drop_table('conversations')
    op.drop_table('documents')
    op.drop_table('folders') # Drop folders
    op.drop_table('users')