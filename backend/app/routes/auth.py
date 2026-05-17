from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.utils.database import users_collection
import bcrypt
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 409

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user = {
        'name': name,
        'email': email,
        'password': hashed,
        'role': 'user',
        'created_at': datetime.utcnow()
    }
    result = users_collection.insert_one(user)
    user_id = str(result.inserted_id)

    # Store identity as simple string
    token = create_access_token(identity=user_id)

    return jsonify({
        'message': 'Account created successfully!',
        'token': token,
        'user': {
            'id': user_id,
            'name': name,
            'email': email,
            'role': 'user'
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    user_id = str(user['_id'])

    # Store identity as simple string
    token = create_access_token(identity=user_id)

    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'user': {
            'id': user_id,
            'name': user['name'],
            'email': email,
            'role': user.get('role', 'user')
        }
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    from bson import ObjectId
    user = users_collection.find_one({'_id': ObjectId(user_id)}, {'password': 0})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user['_id'] = str(user['_id'])
    if 'created_at' in user:
        user['created_at'] = user['created_at'].isoformat()
    return jsonify({'user': user}), 200