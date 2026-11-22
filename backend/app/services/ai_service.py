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
- Provide accurate information about ShopNest policies

Your personality:
- Friendly, warm, and professional
- Clear and concise in responses
- Always empathetic when customers are frustrated
- Never make up information you don't know
- If unsure, offer to escalate to a human agent

ShopNest Key Policies:
- Free shipping on orders above Rs. 499
- 7-day easy return policy
- Delivery within 3-5 business days
- 24/7 customer support available
- Cash on delivery available across India

Always respond in the same language the customer uses."""

def get_ai_response(user_message, conversation_history, faq_context=""):
    system_message = SYSTEM_PROMPT
    if faq_context:
        system_message += f"\n\nRelevant information from knowledge base:\n{faq_context}"

    messages = [{"role": "system", "content": system_message}]

    for msg in conversation_history[-10:]:
        messages.append({
            "role": msg['role'],
            "content": msg['content']
        })

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=1024,
        temperature=0.7,
        extra_body={"reasoning_effort": "low"}
    )

    return response.choices[0].message.content
