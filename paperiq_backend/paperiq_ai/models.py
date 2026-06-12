from mongoengine import (
    Document,
    StringField,
    EmailField,
    DateTimeField,
    ReferenceField,
    CASCADE,
    ObjectIdField,
)
from bson import ObjectId


# ---------------- USERS ----------------
class User(Document):
    user_id = ObjectIdField(primary_key=True, default=ObjectId)
    email = EmailField(required=True, unique=True)
    password_hash = StringField(required=True, max_length=255)
    name = StringField(max_length=100)
    created_at = DateTimeField()

    meta = {'collection': 'users'}


# ---------------- DOCUMENTS ----------------
class DocumentData(Document):
    doc_id = ObjectIdField(primary_key=True, default=ObjectId)
    title = StringField(max_length=255, required=True)
    abstract = StringField()
    source_url = StringField()
    ingestion_date = DateTimeField()
    uploaded_by = ReferenceField(User, reverse_delete_rule=CASCADE)

    meta = {'collection': 'documents'}


# ---------------- ENTITIES ----------------
class Entity(Document):
    entity_id = ObjectIdField(primary_key=True, default=ObjectId)
    entity_text = StringField(max_length=255, required=True)
    entity_type = StringField(max_length=100)
    description = StringField()
    doc = ReferenceField(DocumentData, reverse_delete_rule=CASCADE)
    user = ReferenceField(User, reverse_delete_rule=CASCADE)  # ✅ new

    meta = {'collection': 'entities'}


# ---------------- RELATIONSHIPS ----------------
class Relationship(Document):
    relation_id = ObjectIdField(primary_key=True, default=ObjectId)
    source_entity = ReferenceField(Entity, reverse_delete_rule=CASCADE)
    target_entity = ReferenceField(Entity, reverse_delete_rule=CASCADE)
    relation_type = StringField(max_length=100)
    doc = ReferenceField(DocumentData, reverse_delete_rule=CASCADE)
    user = ReferenceField(User, reverse_delete_rule=CASCADE)  # ✅ new

    meta = {'collection': 'relationships'}


# ---------------- USER FAVORITES ----------------
class UserFavorite(Document):
    fav_id = ObjectIdField(primary_key=True, default=ObjectId)
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    doc = ReferenceField(DocumentData, reverse_delete_rule=CASCADE)
    created_at = DateTimeField()

    meta = {'collection': 'user_favorites'}


# ---------------- SEARCH HISTORY ----------------
class SearchHistory(Document):
    search_id = ObjectIdField(primary_key=True, default=ObjectId)
    user = ReferenceField(User, reverse_delete_rule=CASCADE)
    query_text = StringField(max_length=255)
    search_date = DateTimeField()

    meta = {'collection': 'search_history'}
