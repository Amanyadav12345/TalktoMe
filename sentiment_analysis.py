# sentiment_analysis.py
import sys
from textblob import TextBlob

CRISIS_KEYWORDS = [
    "i want to die", "don’t want to live", "don't want to live", "kill myself", "no reason to live",
    "end it all", "nobody cares", "i'm worthless", "i feel empty", "hopeless", "i give up",
    "tired of living", "nothing matters", "hate myself", "not okay", "i'm alone"
]

def analyze_sentiment(text):
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity

    # Default sentiment
    if polarity > 0:
        sentiment = "positive"
    elif polarity < 0:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Normalize for matching
    text_lower = text.lower()

    # Check for any crisis indicators
    for phrase in CRISIS_KEYWORDS:
        if phrase in text_lower:
            return "alert"  # Special crisis marker

    return sentiment

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
        result = analyze_sentiment(input_text)
        print(result)
    else:
        print("neutral")