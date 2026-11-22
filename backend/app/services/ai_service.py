import json
import os

from dotenv import load_dotenv
from groq import Groq

from app.services.order_service import find_order, list_orders, to_label

load_dotenv()

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Configurable so future model deprecations only need an env change
GROQ_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')

SYSTEM_PROMPT = """You are Nesta, a friendly and helpful customer support assistant for ShopNest, a modern e-commerce platform.

Your responsibilities:
- Help customers with orders, shipping, returns, and refunds
- Answer product-related questions clearly
- Resolve complaints professionally and empathetically
- Guide users through account issues

Your personality:
- Friendly, warm, and professional
- Clear and concise (keep answers under about 120 words)
- Always empathetic when customers are frustrated

ShopNest Key Policies (always true):
- Free shipping on orders above Rs. 499
- 7-day easy return policy
- Delivery within 3-5 business days
- 24/7 customer support available
- Cash on delivery available across India

ORDER TOOLS:
- For any question about the status, location, delivery date or contents of the customer's order, use the order tools. Do not answer those from the knowledge base.
- If the customer gives an order number, call lookup_order. If they ask about "my order" or "my orders" without a number, call list_my_orders.
- Call the tool first. Do not write anything before calling it.
- After a tool runs, the customer sees a tracking card with the full details. Reply in one or two short sentences: say the status and when it arrives. Do not repeat every step.
- Only state order details that the tools returned. Never guess a status or a date.
- If an order is not found, say so and ask the customer to check the number.
- You cannot cancel orders, change addresses or issue refunds. For those, offer to connect the customer with a human agent.

STRICT GROUNDING RULES:
- For everything else, answer ONLY using the Key Policies above and the knowledge base entries provided in this conversation.
- Never invent policies, timelines, fees, steps, or promises that are not stated there. If a detail is not stated, do not guess or fill the gap.
- If you cannot answer from that information, say so honestly in one sentence and offer to connect the customer with a human support agent.
- Greetings and small talk are fine without a knowledge base entry.

Formatting: you may use short markdown (bold, bullet lists) when it helps readability.
Always respond in the same language the customer uses."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "lookup_order",
            "description": "Look up one of the customer's orders by its order number (looks like SN-48213907). Use when the customer gives an order number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The order number, for example SN-48213907"}
                },
                "required": ["order_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_my_orders",
            "description": "List the customer's most recent orders. Use when they ask about 'my order' or 'my orders' without giving an order number.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]


def build_messages(user_message, conversation_history, faq_context=""):
    system_message = SYSTEM_PROMPT
    if faq_context:
        system_message += (
            "\n\nKnowledge base entries relevant to this question "
            "(use only these plus the Key Policies):\n" + faq_context
        )
    else:
        system_message += (
            "\n\nNo knowledge base entry matched this question. If it asks about a policy "
            "or detail not covered by the Key Policies, say you don't have that information "
            "and offer to connect the customer with a human agent."
        )

    messages = [{"role": "system", "content": system_message}]

    for msg in conversation_history[-10:]:
        messages.append({"role": msg['role'], "content": msg['content']})

    messages.append({"role": "user", "content": user_message})
    return messages


def get_ai_response(user_message, conversation_history, faq_context=""):
    messages = build_messages(user_message, conversation_history, faq_context)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=1024,
        temperature=0.3,
        extra_body={"reasoning_effort": "low"}
    )

    return response.choices[0].message.content


def _summary(order):
    label = to_label(order)
    return {
        'order_id': label['id'],
        'status': label['status'],
        'arrival': label['eta'],
        'items': label['items'],
        'total_inr': label['total'],
    }


def run_tool(name, args, user_id):
    """Run an order tool for this user only. Returns (result for the model, cards for the UI)."""
    if name == 'lookup_order':
        order = find_order(user_id, args.get('order_id', ''))
        if not order:
            return {'error': 'No order with that number was found on this account.'}, []
        return _summary(order), [to_label(order)]

    if name == 'list_my_orders':
        orders = list_orders(user_id, 5)
        if not orders:
            return {'orders': [], 'note': 'This account has no orders yet.'}, []
        return {'orders': [_summary(o) for o in orders]}, [to_label(o) for o in orders[:3]]

    return {'error': 'Unknown tool.'}, []


def stream_agent(user_message, conversation_history, faq_context, user_id):
    """Stream a reply. Yields {'type': 'token'|'order', ...} events; runs order tools when needed."""
    messages = build_messages(user_message, conversation_history, faq_context)

    for _ in range(3):
        stream = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice='auto',
            max_tokens=1024,
            temperature=0.3,
            stream=True,
            extra_body={"reasoning_effort": "low"}
        )

        text_parts = []
        calls = {}

        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta

            text = getattr(delta, 'content', None)
            if text:
                text_parts.append(text)
                yield {'type': 'token', 'text': text}

            for tc in (getattr(delta, 'tool_calls', None) or []):
                entry = calls.setdefault(tc.index, {'id': '', 'name': '', 'args': ''})
                if tc.id:
                    entry['id'] = tc.id
                fn = getattr(tc, 'function', None)
                if fn:
                    if fn.name:
                        entry['name'] += fn.name
                    if fn.arguments:
                        entry['args'] += fn.arguments

        if not calls:
            return

        ordered = [calls[i] for i in sorted(calls)]
        messages.append({
            'role': 'assistant',
            'content': ''.join(text_parts) or None,
            'tool_calls': [
                {
                    'id': c['id'],
                    'type': 'function',
                    'function': {'name': c['name'], 'arguments': c['args'] or '{}'}
                }
                for c in ordered
            ]
        })

        for c in ordered:
            try:
                args = json.loads(c['args'] or '{}')
            except json.JSONDecodeError:
                args = {}
            result, labels = run_tool(c['name'], args, user_id)
            for label in labels:
                yield {'type': 'order', 'order': label}
            messages.append({
                'role': 'tool',
                'tool_call_id': c['id'],
                'content': json.dumps(result)
            })
