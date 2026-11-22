import math
import re
from collections import Counter

STOPWORDS = {
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'i', 'my', 'me',
    'you', 'your', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'it', 'this', 'that',
    'can', 'how', 'what', 'when', 'where', 'which', 'with', 'be', 'have', 'has', 'if',
    'will', 'would', 'should', 'about', 'at', 'by', 'from', 'as', 'we', 'us', 'our'
}


def tokenize(text):
    words = re.findall(r"[a-z0-9]+", (text or '').lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 1]


def retrieve(query, faqs, top_k=3, min_score=0.5):
    """Rank FAQs against a query with BM25. Returns the top matches with scores."""
    q_tokens = tokenize(query)
    if not q_tokens or not faqs:
        return []

    docs = []
    for faq in faqs:
        # Question is weighted double so title matches rank higher
        text = (faq.get('question', '') + ' ') * 2 + faq.get('answer', '') + ' ' + faq.get('category', '')
        docs.append(tokenize(text))

    n = len(docs)
    avgdl = (sum(len(d) for d in docs) / n) or 1

    df = Counter()
    for d in docs:
        for term in set(d):
            df[term] += 1

    k1, b = 1.5, 0.75
    scored = []
    for faq, d in zip(faqs, docs):
        tf = Counter(d)
        dl = len(d)
        score = 0.0
        for term in set(q_tokens):
            if term not in tf:
                continue
            idf = math.log(1 + (n - df[term] + 0.5) / (df[term] + 0.5))
            score += idf * (tf[term] * (k1 + 1)) / (tf[term] + k1 * (1 - b + b * dl / avgdl))
        if score >= min_score:
            scored.append((score, faq))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [
        {
            'id': str(f['_id']),
            'question': f.get('question', ''),
            'answer': f.get('answer', ''),
            'category': f.get('category', 'General'),
            'score': round(s, 2)
        }
        for s, f in scored[:top_k]
    ]
