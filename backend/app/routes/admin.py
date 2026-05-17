from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.database import users_collection, chats_collection, messages_collection, faqs_collection
from bson import ObjectId
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def is_admin(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        return user and user.get('role') == 'admin'
    except:
        return False

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    return jsonify({
        'total_users': users_collection.count_documents({}),
        'total_chats': chats_collection.count_documents({}),
        'total_messages': messages_collection.count_documents({}),
        'total_faqs': faqs_collection.count_documents({})
    }), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    users = list(users_collection.find({}, {'password': 0}))
    for user in users:
        user['_id'] = str(user['_id'])
        if 'created_at' in user:
            user['created_at'] = user['created_at'].isoformat()

    return jsonify({'users': users}), 200


@admin_bp.route('/chats', methods=['GET'])
@jwt_required()
def get_all_chats():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    chats = list(chats_collection.find().sort('updated_at', -1).limit(50))
    for chat in chats:
        chat['_id'] = str(chat['_id'])
        chat['created_at'] = chat['created_at'].isoformat()
        chat['updated_at'] = chat['updated_at'].isoformat()

    return jsonify({'chats': chats}), 200