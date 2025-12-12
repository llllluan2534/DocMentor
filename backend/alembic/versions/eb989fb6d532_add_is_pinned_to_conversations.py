"""add is_pinned to conversations

Revision ID: eb989fb6d532
Revises: 382e5eb72149
Create Date: 2025-12-12 20:33:58.902471

"""
from alembic import op
import sqlalchemy as sa

revision = "add_pinned"
down_revision = "382e5eb72149"  # đặt đúng revision của bạn

def upgrade():
    op.add_column(
        "conversations",
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.create_index(
        "idx_conversations_user_pinned",
        "conversations",
        ["user_id", "is_pinned"]
    )

def downgrade():
    op.drop_index("idx_conversations_user_pinned")
    op.drop_column("conversations", "is_pinned")
