from groq import Groq
from dotenv import load_dotenv
import os

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

STRICT GROUNDING RULES:
- Answer ONLY using the Key Policies above and the knowledge base entries provided in this conversation.
- Never invent policies, timelines, fees, steps, or promises that are not stated there. If a detail (for example how refunds are paid, exchange options, or specific order status) is not stated, do not guess or fill the gap.
- If you cannot answer from that information, say so honestly in one sentence and offer to connect the customer with a human support agent.
- Greetings and small talk are fine without a knowledge base entry.

Formatting: you may use short markdown (bold, bullet lists) when it helps readability.
Always respond in the same language the customer uses."""


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


def stream_ai_response(user_message, conversation_history, faq_context=""):
    """Yield the reply token-by-token as it is generated."""
    messages = build_messages(user_message, conversation_history, faq_context)

    stream = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=1024,
        temperature=0.3,
        stream=True,
        extra_body={"reasoning_effort": "low"}
    )

    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        text = getattr(delta, 'content', None)
        if text:
            yield text
