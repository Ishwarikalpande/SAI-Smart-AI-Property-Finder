"""Add email OTP verification fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-08 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    if 'email_otps' not in tables:
        op.create_table(
            'email_otps',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', name='fk_email_otps_user_id', ondelete='SET NULL'), nullable=True, index=True),
            sa.Column('email', sa.String(length=255), nullable=False, index=True),
            sa.Column('otp_hash', sa.String(length=255), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('verified', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('used', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        )
    else:
        existing_cols = [col['name'] for col in inspector.get_columns('email_otps')]
        with op.batch_alter_table('email_otps') as batch_op:
            if 'user_id' not in existing_cols:
                batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
            if 'verified' not in existing_cols:
                batch_op.add_column(sa.Column('verified', sa.Boolean(), server_default='0', nullable=False))
            if 'used_at' not in existing_cols:
                batch_op.add_column(sa.Column('used_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()
    if 'email_otps' in tables:
        existing_cols = [col['name'] for col in inspector.get_columns('email_otps')]
        with op.batch_alter_table('email_otps') as batch_op:
            if 'used_at' in existing_cols:
                batch_op.drop_column('used_at')
            if 'verified' in existing_cols:
                batch_op.drop_column('verified')
            if 'user_id' in existing_cols:
                batch_op.drop_column('user_id')
