import json
from datetime import datetime

from bson import ObjectId
from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.utils.database import chats_collection, messages_collection, faqs_collection, users_collection
from app.services.ai_service import get_ai_response, stream_agent
from app.services.retrieval import retrieve

chat_bp = Blueprint('chat', __name__)


def get_user_name(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)}, {'name': 1})
        return user['name'] if user else 'User'
    except Exception:
        return 'User'


def get_owned_chat(chat_id, user_id):
    """Return the chat only if it belongs to this user."""
    try:
        return chats_collection.find_one({'_id': ObjectId(chat_id), 'user_id': user_id})
    except Exception:
        return None


def build_context(user_message):
    """Rank FAQs with BM25 and build the prompt context plus the sources list."""
    faqs = list(faqs_collection.find({}))
    sources = retrieve(user_message, faqs, top_k=3)
    context = ''
    for i, s in enumerate(sources, 1):
        context += f"[{i}] Q: {s['question']}\nA: {s['answer']}\n\n"
    return context, sources


def get_history_for_ai(chat_id):
    return list(messages_collection.find(
        {'chat_id': chat_id},
        {'role': 1, 'content': 1, '_id': 0}
    ).sort('created_at', 1).limit(10))


def save_exchange(chat, chat_id, user_message, ai_response, sources, orders=None):
    now = datetime.utcnow()
    messages_collection.insert_one({
        'chat_id': chat_id, 'role': 'user', 'content': user_message, 'created_at': now
    })
    messages_collection.insert_one({
        'chat_id': chat_id, 'role': 'assistant', 'content': ai_response,
        'sources': sources, 'orders': orders or [], 'created_at': datetime.utcnow()
    })

    update = {'$inc': {'message_count': 2}, '$set': {'updated_at': datetime.utcnow()}}
    if chat.get('message_count', 0) == 0:
        title = user_message[:50] + ('...' if len(user_message) > 50 else '')
        update['$set']['title'] = title
    chats_collection.update_one({'_id': ObjectId(chat_id)}, update)


def parse_message_request(user_id):
    """Validate the request. Returns (chat, chat_id, message, error_response)."""
    data = request.get_json(silent=True) or {}
    user_message = (data.get('message') or '').strip()
    chat_id = data.get('chat_id')

    if not user_message:
        return None, None, None, (jsonify({'error': 'Message cannot be empty'}), 400)
    if len(user_message) > 2000:
        return None, None, None, (jsonify({'error': 'Message too long (max 2000 characters)'}), 400)
    if not chat_id:
        return None, None, None, (jsonify({'error': 'Chat ID is required'}), 400)

    chat = get_owned_chat(chat_id, user_id)
    if not chat:
        return None, None, None, (jsonify({'error': 'Chat not found'}), 404)

    return chat, chat_id, user_message, None


@chat_bp.route('/new', methods=['POST'])
@jwt_required()
def new_chat():
    user_id = get_jwt_identity()
    chat = {
        'user_id': user_id,
        'user_name': get_user_name(user_id),
        'title': 'New Conversation',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'message_count': 0
    }
    result = chats_collection.insert_one(chat)
    return jsonify({'chat_id': str(result.inserted_id), 'message': 'New chat created'}), 201


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    chat, chat_id, user_message, error = parse_message_request(user_id)
    if error:
        return error

    context, sources = build_context(user_message)
    history = get_history_for_ai(chat_id)

    try:
        ai_response = get_ai_response(user_message, history, context)
    except Exception as e:
        print('AI error:', e)
        return jsonify({'error': 'The AI service is unavailable right now. Please try again.'}), 502

    save_exchange(chat, chat_id, user_message, ai_response, sources)
    return jsonify({'response': ai_response, 'chat_id': chat_id, 'sources': sources}), 200


@chat_bp.route('/message/stream', methods=['POST'])
@jwt_required()
def send_message_stream():
    user_id = get_jwt_identity()
    chat, chat_id, user_message, error = parse_message_request(user_id)
    if error:
        return error

    context, sources = build_context(user_message)
    history = get_history_for_ai(chat_id)

    def sse(event):
        return f"data: {json.dumps(event)}\n\n"

    def generate():
        yield sse({'type': 'sources', 'sources': sources})
        parts = []
        orders = []
        try:
            for event in stream_agent(user_message, history, context, user_id):
                if event['type'] == 'token':
                    parts.append(event['text'])
                    yield sse(event)
                elif event['type'] == 'order':
                    if not orders:
                        # An order answer replaces the help-article chip
                        yield sse({'type': 'sources', 'sources': []})
                    orders.append(event['order'])
                    yield sse(event)
        except Exception as e:
            print('AI stream error:', e)
            yield sse({'type': 'error', 'message': 'The AI service is unavailable right now. Please try again.'})
            return

        full = ''.join(parts).strip()
        if not full and orders:
            full = "Here's what I found."
        if not full:
            yield sse({'type': 'error', 'message': 'The AI returned an empty reply. Please try again.'})
            return

        save_exchange(chat, chat_id, user_message, full, [] if orders else sources, orders)
        yield sse({'type': 'done'})

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
    )


@chat_bp.route('/history/<chat_id>', methods=['GET'])
@jwt_required()
def get_history(chat_id):
    user_id = get_jwt_identity()
    if not get_owned_chat(chat_id, user_id):
        return jsonify({'error': 'Chat not found'}), 404

    messages = list(messages_collection.find({'chat_id': chat_id}).sort('created_at', 1))
    for msg in messages:
        msg['_id'] = str(msg['_id'])
        msg['created_at'] = msg['created_at'].isoformat()

    return jsonify({'messages': messages}), 200


@chat_bp.route('/my-chats', methods=['GET'])
@jwt_required()
def get_my_chats():
    user_id = get_jwt_identity()
    chats = list(chats_collection.find({'user_id': user_id}).sort('updated_at', -1))
    for chat in chats:
        chat['_id'] = str(chat['_id'])
        chat['created_at'] = chat['created_at'].isoformat()
        chat['updated_at'] = chat['updated_at'].isoformat()
    return jsonify({'chats': chats}), 200


@chat_bp.route('/delete/<chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    user_id = get_jwt_identity()
    if not get_owned_chat(chat_id, user_id):
        return jsonify({'error': 'Chat not found'}), 404

    chats_collection.delete_one({'_id': ObjectId(chat_id)})
    messages_collection.delete_many({'chat_id': chat_id})
    return jsonify({'message': 'Chat deleted'}), 200
