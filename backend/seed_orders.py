from datetime import datetime, timedelta

from app.utils.database import users_collection
from app.services.order_service import orders_collection

now = datetime.utcnow()


def build(user_id, ids):
    return [
        {
            'order_id': ids[0],
            'user_id': user_id,
            'items': [{'name': 'Wireless earbuds', 'qty': 1}],
            'total': 2499,
            'status': 'out_for_delivery',
            'placed_at': now - timedelta(days=3),
            'stage_times': {
                'packed': now - timedelta(days=2),
                'shipped': now - timedelta(days=1),
                'out_for_delivery': now - timedelta(hours=3),
            },
            'expected_by': now + timedelta(hours=4),
            'from_city': 'Chennai hub',
            'to_city': 'Madurai',
        },
        {
            'order_id': ids[1],
            'user_id': user_id,
            'items': [{'name': 'Running shoes', 'qty': 1}],
            'total': 3299,
            'status': 'shipped',
            'placed_at': now - timedelta(days=2),
            'stage_times': {
                'packed': now - timedelta(days=1),
                'shipped': now - timedelta(hours=5),
            },
            'expected_by': now + timedelta(days=2),
            'from_city': 'Bengaluru hub',
            'to_city': 'Madurai',
        },
        {
            'order_id': ids[2],
            'user_id': user_id,
            'items': [{'name': 'Cotton kurta set', 'qty': 2}],
            'total': 1798,
            'status': 'delivered',
            'placed_at': now - timedelta(days=7),
            'stage_times': {
                'packed': now - timedelta(days=6),
                'shipped': now - timedelta(days=5),
                'out_for_delivery': now - timedelta(days=4, hours=4),
                'delivered': now - timedelta(days=4),
            },
            'expected_by': now - timedelta(days=4),
            'from_city': 'Chennai hub',
            'to_city': 'Madurai',
        },
    ]


SEEDS = {
    'test@shopnest.com': ['SN-48213907', 'SN-48195562', 'SN-47988120'],
    'admin@shopnest.com': ['SN-50011234', 'SN-50011235', 'SN-50011236'],
}

for email, ids in SEEDS.items():
    user = users_collection.find_one({'email': email})
    if not user:
        print('Skipped, no such user:', email)
        continue
    uid = str(user['_id'])
    orders_collection.delete_many({'user_id': uid})
    orders_collection.insert_many(build(uid, ids))
    print('Seeded', len(ids), 'orders for', email)
