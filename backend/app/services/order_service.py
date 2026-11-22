from datetime import datetime, timedelta

from app.utils.database import db

orders_collection = db['orders']

STAGE_KEYS = ['packed', 'shipped', 'out_for_delivery', 'delivered']
STAGE_NAMES = ['Packed', 'Shipped', 'Out for delivery', 'Delivered']
STATUS_LABELS = {
    'packed': 'Packed',
    'shipped': 'In transit',
    'out_for_delivery': 'Out for delivery',
    'delivered': 'Delivered',
}


def _ist(dt):
    return dt + timedelta(hours=5, minutes=30)


def _fmt(dt):
    return _ist(dt).strftime('%a %I:%M %p').replace(' 0', ' ')


def _arrival(expected):
    today = _ist(datetime.utcnow()).date()
    e = _ist(expected)
    t = e.strftime('%I %p').lstrip('0')
    if e.date() == today:
        return f'Arrives today by {t}'
    if e.date() == today + timedelta(days=1):
        return f'Arrives tomorrow by {t}'
    return f"Arrives {e.strftime('%a %d %b')} by {t}"


def find_order(user_id, order_id):
    """Return the order only if it belongs to this user."""
    oid = (order_id or '').strip().upper()
    if oid.isdigit():
        oid = 'SN-' + oid
    if not oid:
        return None
    return orders_collection.find_one({'user_id': user_id, 'order_id': oid})


def list_orders(user_id, limit=5):
    return list(orders_collection.find({'user_id': user_id}).sort('placed_at', -1).limit(limit))


def to_label(order):
    """Shape an order for the shipping-label card in the chat."""
    current = STAGE_KEYS.index(order['status'])
    times = order.get('stage_times', {})
    stops = []
    for i, (key, name) in enumerate(zip(STAGE_KEYS, STAGE_NAMES)):
        t = times.get(key)
        done = i <= current
        if done and t:
            label_time = _fmt(t)
        elif key == 'delivered' and order.get('expected_by'):
            label_time = 'By ' + _fmt(order['expected_by'])
        else:
            label_time = ''
        stops.append({'name': name, 'time': label_time, 'done': done})

    delivered = order['status'] == 'delivered'
    if delivered:
        eta = 'Delivered ' + _fmt(times['delivered'])
    else:
        eta = _arrival(order['expected_by'])

    items = ', '.join(f"{i['name']} x{i['qty']}" for i in order.get('items', []))

    return {
        'id': order['order_id'],
        'status': STATUS_LABELS[order['status']],
        'tone': 'delivered' if delivered else 'transit',
        'eta': eta,
        'from': order.get('from_city', 'Chennai hub'),
        'to': order.get('to_city', 'Your address'),
        'items': items,
        'total': order.get('total'),
        'stops': stops,
    }
