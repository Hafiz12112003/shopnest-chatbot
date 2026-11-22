from datetime import datetime, timedelta

from bson import ObjectId
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.utils.database import users_collection, chats_collection, messages_collection, faqs_collection

admin_bp = Blueprint('admin', __name__)


def is_admin(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        return bool(user and user.get('role') == 'admin')
    except Exception:
        return False


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    if not is_admin(get_jwt_identity()):
        return jsonify({'error': 'Admin access required'}), 403

    return jsonify({
        'total_users': users_collection.count_documents({}),
        'total_chats': chats_collection.count_documents({}),
        'total_messages': messages_collection.count_documents({}),
        'total_faqs': faqs_collection.count_documents({})
    }), 200


@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    if not is_admin(get_jwt_identity()):
        return jsonify({'error': 'Admin access required'}), 403

    # Questions per day, last 7 days (missing days filled with 0)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    since = today - timedelta(days=6)
    daily_raw = messages_collection.aggregate([
        {'$match': {'role': 'user', 'created_at': {'$gte': since}}},
        {'$group': {
            '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
            'count': {'$sum': 1}
        }}
    ])
    daily_map = {d['_id']: d['count'] for d in daily_raw}
    daily = []
    for i in range(7):
        day = since + timedelta(days=i)
        key = day.strftime('%Y-%m-%d')
        daily.append({'date': day.strftime('%d %b'), 'questions': daily_map.get(key, 0)})

    # Most frequently asked questions
    top_questions = [
        {'question': q['_id'], 'count': q['count']}
        for q in messages_collection.aggregate([
            {'$match': {'role': 'user'}},
            {'$group': {'_id': {'$toLower': '$content'}, 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ])
    ]

    # Most cited FAQs
    top_faqs = [
        {'question': f['_id'], 'count': f['count']}
        for f in messages_collection.aggregate([
            {'$match': {'role': 'assistant', 'sources.0': {'$exists': True}}},
            {'$unwind': '$sources'},
            {'$group': {'_id': '$sources.question', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ])
    ]

    # Knowledge base coverage (only messages saved since sources were tracked)
    answered = messages_collection.count_documents(
        {'role': 'assistant', 'sources.0': {'$exists': True}})
    unanswered = messages_collection.count_documents(
        {'role': 'assistant', 'sources': {'$size': 0}})

    # Recent unanswered questions = gaps in the FAQ
    gaps = []
    recent_unanswered = messages_collection.find(
        {'role': 'assistant', 'sources': {'$size': 0}}
    ).sort('created_at', -1).limit(8)
    for doc in recent_unanswered:
        q = messages_collection.find_one(
            {'chat_id': doc['chat_id'], 'role': 'user', 'created_at': {'$lte': doc['created_at']}},
            sort=[('created_at', -1)]
        )
        if q:
            gaps.append({'question': q['content'], 'asked_at': q['created_at'].isoformat()})

    return jsonify({
        'daily': daily,
        'top_questions': top_questions,
        'top_faqs': top_faqs,
        'coverage': {'answered': answered, 'unanswered': unanswered},
        'gaps': gaps
    }), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    if not is_admin(get_jwt_identity()):
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
    if not is_admin(get_jwt_identity()):
        return jsonify({'error': 'Admin access required'}), 403

    chats = list(chats_collection.find().sort('updated_at', -1).limit(50))
    for chat in chats:
        chat['_id'] = str(chat['_id'])
        chat['created_at'] = chat['created_at'].isoformat()
        chat['updated_at'] = chat['updated_at'].isoformat()

    return jsonify({'chats': chats}), 200
