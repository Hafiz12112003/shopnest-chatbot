from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.database import chats_collection, messages_collection, faqs_collection, users_collection
from app.services.ai_service import get_ai_response
from bson import ObjectId
from datetime import datetime

chat_bp = Blueprint('chat', __name__)

def get_user_name(user_id):
    """Get user name from user_id"""
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)}, {'name': 1})
        return user['name'] if user else 'User'
    except:
        return 'User'

@chat_bp.route('/new', methods=['POST'])
@jwt_required()
def new_chat():
    user_id = get_jwt_identity()
    user_name = get_user_name(user_id)

    chat = {
        'user_id': user_id,
        'user_name': user_name,
        'title': 'New Conversation',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'message_count': 0
    }
    result = chats_collection.insert_one(chat)

    return jsonify({
        'chat_id': str(result.inserted_id),
        'message': 'New chat created'
    }), 201


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.get_json()

    user_message = data.get('message', '').strip()
    chat_id = data.get('chat_id')

    if not user_message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    if not chat_id:
        return jsonify({'error': 'Chat ID is required'}), 400

    # Search FAQs for relevant answer
    faq_context = ""
    search_term = user_message.lower()
    faqs = list(faqs_collection.find({}))
    for faq in faqs:
        if any(word in faq.get('question', '').lower()
               for word in search_term.split() if len(word) > 3):
            faq_context += f"Q: {faq['question']}\nA: {faq['answer']}\n\n"

    # Get conversation history
    history = list(messages_collection.find(
        {'chat_id': chat_id},
        {'role': 1, 'content': 1, '_id': 0}
    ).sort('created_at', 1).limit(10))

    # Get AI response
    ai_response = get_ai_response(user_message, history, faq_context)

    # Save user message
    messages_collection.insert_one({
        'chat_id': chat_id,
        'role': 'user',
        'content': user_message,
        'created_at': datetime.utcnow()
    })

    # Save AI response
    messages_collection.insert_one({
        'chat_id': chat_id,
        'role': 'assistant',
        'content': ai_response,
        'created_at': datetime.utcnow()
    })

    # Update chat title from first message
    chat = chats_collection.find_one({'_id': ObjectId(chat_id)})
    if chat and chat.get('message_count', 0) == 0:
        title = user_message[:50] + ('...' if len(user_message) > 50 else '')
        chats_collection.update_one(
            {'_id': ObjectId(chat_id)},
            {'$set': {'title': title, 'message_count': 1, 'updated_at': datetime.utcnow()}}
        )
    else:
        chats_collection.update_one(
            {'_id': ObjectId(chat_id)},
            {'$inc': {'message_count': 1}, '$set': {'updated_at': datetime.utcnow()}}
        )

    return jsonify({
        'response': ai_response,
        'chat_id': chat_id
    }), 200


@chat_bp.route('/history/<chat_id>', methods=['GET'])
@jwt_required()
def get_history(chat_id):
    messages = list(messages_collection.find(
        {'chat_id': chat_id}
    ).sort('created_at', 1))

    for msg in messages:
        msg['_id'] = str(msg['_id'])
        msg['created_at'] = msg['created_at'].isoformat()

    return jsonify({'messages': messages}), 200


@chat_bp.route('/my-chats', methods=['GET'])
@jwt_required()
def get_my_chats():
    user_id = get_jwt_identity()

    chats = list(chats_collection.find(
        {'user_id': user_id}
    ).sort('updated_at', -1))

    for chat in chats:
        chat['_id'] = str(chat['_id'])
        chat['created_at'] = chat['created_at'].isoformat()
        chat['updated_at'] = chat['updated_at'].isoformat()

    return jsonify({'chats': chats}), 200


@chat_bp.route('/delete/<chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    chats_collection.delete_one({'_id': ObjectId(chat_id)})
    messages_collection.delete_many({'chat_id': chat_id})
    return jsonify({'message': 'Chat deleted'}), 200