"""add document indexes

Revision ID: add_document_indexes
Revises: <PUT_LAST_REVISION_ID_HERE>
Create Date: 2025-11-20
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_document_indexes'
down_revision = '<PUT_LAST_REVISION_ID_HERE>'
branch_labels = None
depends_on = None

def upgrade():
    op.create_index('idx_documents_user_id', 'documents', ['user_id'])
    op.create_index('idx_documents_file_type', 'documents', ['file_type'])
    op.create_index('idx_documents_processed', 'documents', ['processed'])
    op.create_index('idx_documents_created_at', 'documents', ['created_at'])
    op.create_index('idx_documents_file_size', 'documents', ['file_size'])
    # composite index helpful for user-scoped queries
    op.create_index('idx_documents_user_created_at', 'documents', ['user_id', 'created_at'])


def downgrade():
    op.drop_index('idx_documents_user_created_at', table_name='documents')
    op.drop_index('idx_documents_file_size', table_name='documents')
    op.drop_index('idx_documents_created_at', table_name='documents')
    op.drop_index('idx_documents_processed', table_name='documents')
    op.drop_index('idx_documents_file_type', table_name='documents')
    op.drop_index('idx_documents_user_id', table_name='documents')
