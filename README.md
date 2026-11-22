# ShopNest Support

An AI support assistant for an e-commerce store. It looks up a customer's real orders, answers policy questions from a knowledge base with sources, and says so when it doesn't know.

**Live demo:** https://shopnest-chatbot.vercel.app

Click **Try the demo** on the landing page. The demo account has three sample orders (out for delivery, in transit, delivered). The backend runs on Render's free tier, so the first request after a quiet period can take up to a minute.

## What it does

- **Order tracking.** Ask "Where is my latest order?" or give an order number. The model calls a tool, the backend looks up that user's orders, and the chat shows a tracking label with the full timeline.
- **Answers with sources.** Policy questions are answered from the FAQ knowledge base, and each answer shows which help article it came from.
- **Says when it doesn't know.** If nothing in the knowledge base matches, Nesta says so and offers a human agent instead of guessing.
- **Streaming replies.** Answers appear token by token over server-sent events.
- **Admin dashboard.** Stats, questions per day, most asked questions, most cited FAQs, knowledge-base coverage, and a list of unanswered questions with an Add as FAQ button.

## How it works

- **Retrieval.** FAQs are ranked with BM25 (a keyword relevance algorithm written in `backend/app/services/retrieval.py`). It is lexical search, not embeddings.
- **Tool calling.** The model (`openai/gpt-oss-120b` on Groq) has two tools, `lookup_order` and `list_my_orders`. Both receive the user id from the JWT on the server, never from the model, so a user can only see their own orders.
- **Grounding.** The system prompt restricts answers to the stated policies, the retrieved FAQ entries and tool results.
- **Auth.** JWT access tokens (7 day expiry) with bcrypt password hashing. Chats and messages are checked for ownership on every request.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Recharts, react-markdown
- **Backend:** Flask, Flask-JWT-Extended, PyMongo, gunicorn
- **Database:** MongoDB Atlas
- **AI:** Groq API
- **Hosting:** Vercel (frontend), Render (backend)

## Run it locally

You need Python 3.12, Node 22, a MongoDB Atlas connection string and a Groq API key.

Backend, from the `backend` folder:

    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    python run.py

Create `backend/.env`:

    MONGO_URI=your_mongodb_connection_string
    GROQ_API_KEY=your_groq_key
    SECRET_KEY=a_long_random_string
    JWT_SECRET_KEY=another_long_random_string
    FRONTEND_URL=http://localhost:3000

`GROQ_MODEL` is optional and defaults to `openai/gpt-oss-120b`.

Seed the sample orders for the demo users, from the project root:

    python backend/seed_orders.py

Frontend, from the `frontend` folder:

    npm install
    npm run dev

By default the frontend calls `http://127.0.0.1:5000/api`. For a deployed backend, set `VITE_API_URL` at build time.

## Project structure

    backend/
      app/
        routes/      auth, chat (streaming), faq, admin
        services/    ai_service (tool calling), retrieval (BM25), order_service
        utils/       database
      seed_orders.py
    frontend/
      src/
        pages/       Landing, Login, Register, Chat, Admin
        components/  OrderLabel, AuthShell
        services/    api (including the streaming client)

## Known limits

- The orders are seeded demo data. A real store would connect the same tools to its order system.
- Retrieval is keyword-based, so a question phrased with none of an FAQ's words can miss it. Embedding search is the next step.
- On the free tier the backend sleeps after inactivity.

Built by Muhammad Hafiz.
