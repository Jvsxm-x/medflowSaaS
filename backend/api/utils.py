from datetime import datetime
from bson import ObjectId

def normalize_mongo_doc(doc):
    """Convert ObjectId + datetime → str pour JSON serialization"""
    if not doc:
        return doc

    clean = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            clean[k] = str(v)
        elif isinstance(v, datetime):
            clean[k] = v.isoformat()
        else:
            clean[k] = v
    return clean
import json
from rest_framework.renderers import JSONRenderer
from datetime import datetime
from bson import ObjectId

class CustomJSONRenderer(JSONRenderer):
    """Renderer global : convertit ObjectId et datetime en JSON-compatible"""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        data = self.clean(data)
        return super().render(data, accepted_media_type, renderer_context)

    def clean(self, obj):
        if isinstance(obj, list):
            return [self.clean(item) for item in obj]
        if isinstance(obj, dict):
            new_obj = {}
            for k, v in obj.items():
                new_obj[k] = self.clean(v)
            return new_obj
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return obj
from bson import ObjectId

def convert_objectid(document):
    if not document:
        return document
    doc = document.copy()
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
    return doc
# api/utils.py
from bson import ObjectId

def mongo_to_dict(obj):
    """Convertit un document MongoDB en dict sérialisable JSON"""
    if not obj:
        return None
    return {
        **{k: str(v) if isinstance(v, ObjectId) else v for k, v in obj.items()},
        "_id": str(obj["_id"])
    }