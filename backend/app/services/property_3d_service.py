import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.property import Property
from app.models.property_3d_config import Property3DConfig, PropertyRoom
from app.services.property_3d_generator import generate_3d_tour_for_property

logger = logging.getLogger(__name__)

def get_property_3d_tour(db: Session, property_id: int, force: bool = False) -> Dict[str, Any]:
    """
    Retrieves or generates the 3D property tour scene for property_id.
    Uses caching in property_3d_configs. Strictly obeys property structure.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} was not found."
        )

    # Check cache
    cached = db.query(Property3DConfig).filter(Property3DConfig.property_id == property_id).first()
    if cached and not force:
        if cached.updated_at and prop.updated_at and cached.updated_at >= prop.updated_at:
            scene_data = cached.scene_json
            if isinstance(scene_data, str):
                try:
                    scene_data = json.loads(scene_data)
                except Exception:
                    pass
            if isinstance(scene_data, dict) and scene_data.get("rooms"):
                if not scene_data.get("camera_path") or not scene_data.get("doors") or not scene_data.get("building"):
                    full_tour = generate_3d_tour_for_property(prop)
                    if not scene_data.get("camera_path"):
                        scene_data["camera_path"] = cached.camera_path_json if (cached.camera_path_json and len(cached.camera_path_json) > 0) else full_tour.get("camera_path", [])
                    if not scene_data.get("doors"):
                        scene_data["doors"] = full_tour.get("doors", [])
                    if not scene_data.get("building"):
                        scene_data["building"] = full_tour.get("building")
                return scene_data

    # Check for custom rooms in property_rooms
    custom_rooms = db.query(PropertyRoom).filter(PropertyRoom.property_id == property_id).order_by(PropertyRoom.order_index.asc()).all()
    custom_rooms_data = None
    if custom_rooms and len(custom_rooms) > 0:
        custom_rooms_data = []
        for cr in custom_rooms:
            custom_rooms_data.append({
                "id": str(cr.id),
                "name": cr.name,
                "type": cr.room_type,
                "position": {"x": cr.position_x, "y": cr.position_y, "z": cr.position_z},
                "dimensions": {"width": cr.width, "length": cr.length, "height": cr.height},
                "order": cr.order_index,
                "metadata": cr.metadata_json or {}
            })

    # Generate 3D tour
    tour_data = generate_3d_tour_for_property(prop, custom_rooms=custom_rooms_data)

    # Cache in DB
    try:
        now_utc = datetime.now(timezone.utc)
        if cached:
            cached.scene_json = tour_data
            cached.camera_path_json = tour_data.get("camera_path", [])
            cached.version = (cached.version or 1) + 1
            cached.updated_at = now_utc
        else:
            new_cached = Property3DConfig(
                property_id=property_id,
                version=1,
                scene_json=tour_data,
                camera_path_json=tour_data.get("camera_path", []),
                created_at=now_utc,
                updated_at=now_utc
            )
            db.add(new_cached)
        db.commit()
    except Exception as ex:
        db.rollback()
        logger.warning(f"Failed to cache 3D config for property {property_id}: {ex}")

    return tour_data


def save_property_3d_tour(db: Session, property_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves or overrides 3D configuration/room mapping for a property (Section 7, 40).
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} was not found."
        )

    # Update or insert into Property3DConfig
    cached = db.query(Property3DConfig).filter(Property3DConfig.property_id == property_id).first()
    now_utc = datetime.now(timezone.utc)

    # If payload contains custom rooms, sync to property_rooms table
    rooms_list = payload.get("rooms", [])
    if isinstance(rooms_list, list) and len(rooms_list) > 0:
        db.query(PropertyRoom).filter(PropertyRoom.property_id == property_id).delete()
        for idx, r in enumerate(rooms_list):
            pos = r.get("position", {})
            dims = r.get("dimensions", {})
            room_obj = PropertyRoom(
                property_id=property_id,
                name=r.get("name", f"Room {idx+1}"),
                room_type=r.get("type", "bedroom"),
                position_x=float(pos.get("x", 0.0)) if isinstance(pos, dict) else 0.0,
                position_y=float(pos.get("y", 0.0)) if isinstance(pos, dict) else 0.0,
                position_z=float(pos.get("z", 0.0)) if isinstance(pos, dict) else 0.0,
                width=float(dims.get("width", 4.0)) if isinstance(dims, dict) else 4.0,
                length=float(dims.get("length", 4.0)) if isinstance(dims, dict) else 4.0,
                height=float(dims.get("height", 2.85)) if isinstance(dims, dict) else 2.85,
                order_index=r.get("order", idx + 1),
                metadata_json=r.get("metadata", {}) or {}
            )
            db.add(room_obj)

    # Ensure property_id is set
    payload["property_id"] = property_id

    if cached:
        cached.scene_json = payload
        cached.camera_path_json = payload.get("camera_path", [])
        cached.version = (cached.version or 1) + 1
        cached.updated_at = now_utc
    else:
        new_cached = Property3DConfig(
            property_id=property_id,
            version=1,
            scene_json=payload,
            camera_path_json=payload.get("camera_path", []),
            created_at=now_utc,
            updated_at=now_utc
        )
        db.add(new_cached)

    db.commit()
    return payload
