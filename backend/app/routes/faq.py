from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.database import faqs_collection, users_collection
from bson import ObjectId
from datetime import datetime

faq_bp = Blueprint('faq', __name__)

def is_admin(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        return user and user.get('role') == 'admin'
    except:
        return False

@faq_bp.route('/', methods=['GET'])
def get_faqs():
    category = request.args.get('category', None)
    query = {'category': category} if category else {}

    faqs = list(faqs_collection.find(query))
    for faq in faqs:
        faq['_id'] = str(faq['_id'])
        faq['created_at'] = faq['created_at'].isoformat()

    return jsonify({'faqs': faqs}), 200


@faq_bp.route('/', methods=['POST'])
@jwt_required()
def create_faq():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    question = data.get('question', '').strip()
    answer = data.get('answer', '').strip()
    category = data.get('category', 'General').strip()

    if not question or not answer:
        return jsonify({'error': 'Question and answer are required'}), 400

    faq = {
        'question': question,
        'answer': answer,
        'category': category,
        'created_at': datetime.utcnow()
    }
    result = faqs_collection.insert_one(faq)

    return jsonify({
        'message': 'FAQ created successfully',
        'id': str(result.inserted_id)
    }), 201


@faq_bp.route('/<faq_id>', methods=['DELETE'])
@jwt_required()
def delete_faq(faq_id):
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    faqs_collection.delete_one({'_id': ObjectId(faq_id)})
    return jsonify({'message': 'FAQ deleted'}), 200