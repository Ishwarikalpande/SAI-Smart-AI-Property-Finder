"""Add tower unit enquiry view models

Revision ID: a1b2c3d4e5f6
Revises: 88bbb0a12783
Create Date: 2026-09-27 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '88bbb0a12783'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Buildings table additions
    with op.batch_alter_table('buildings') as batch_op:
        batch_op.add_column(sa.Column('code', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('floors_count', sa.Integer(), nullable=True, server_default='10'))
        batch_op.add_column(sa.Column('units_per_floor', sa.Integer(), nullable=True, server_default='4'))
        batch_op.add_column(sa.Column('total_units', sa.Integer(), nullable=True, server_default='40'))
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('status', sa.String(length=50), nullable=True, server_default='Under Construction'))

    # Units table additions
    with op.batch_alter_table('units') as batch_op:
        batch_op.add_column(sa.Column('tower_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('floor_number', sa.Integer(), nullable=True, server_default='1'))

    # Enquiries table additions
    with op.batch_alter_table('enquiries') as batch_op:
        batch_op.add_column(sa.Column('project_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('tower_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('unit_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('budget', sa.String(length=100), nullable=True))

    # Property Views table
    op.create_table(
        'property_views',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('viewer_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('viewed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True)
    )

def downgrade() -> None:
    op.drop_table('property_views')
    with op.batch_alter_table('enquiries') as batch_op:
        batch_op.drop_column('budget')
        batch_op.drop_column('unit_id')
        batch_op.drop_column('tower_id')
        batch_op.drop_column('project_id')
    with op.batch_alter_table('units') as batch_op:
        batch_op.drop_column('floor_number')
        batch_op.drop_column('tower_id')
    with op.batch_alter_table('buildings') as batch_op:
        batch_op.drop_column('status')
        batch_op.drop_column('description')
        batch_op.drop_column('total_units')
        batch_op.drop_column('units_per_floor')
        batch_op.drop_column('floors_count')
        batch_op.drop_column('code')
