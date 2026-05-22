import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path so we can import AIService
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from papers.services.ai_service import AIService

def test_translation():
    print("Testing translation...")
    try:
        service = AIService()
        
        # Print configured APIs
        print(f"Gemini client initialized: {service.gemini_client is not None}")
        print(f"Anthropic client initialized: {service.anthropic_client is not None}")
        print(f"DeepSeek client initialized: {service.deepseek_client is not None}")
        print(f"OpenAI client initialized: {service.openai_client is not None}")
        
        text = "Hello world! This is a test paper summary about machine learning."
        target_lang = "Spanish"
        print(f"\nTranslating '{text}' to {target_lang}...")
        
        # Test Gemini specifically
        if service.gemini_client:
            try:
                print("Trying Gemini directly...")
                res_gemini = service.translate_text(text, target_lang, model_id="gemini-2.0-flash")
                print(f"Gemini translated: {res_gemini}")
            except Exception as e:
                print(f"Gemini directly failed: {e}")

        # Test fallback / all
        print("\nTrying with _call_with_fallback...")
        res_fallback = service.translate_text(text, target_lang)
        print(f"Fallback translation result: {res_fallback}")
            
    except Exception as e:
        print(f"FAILED: An error occurred: {str(e)}")

if __name__ == "__main__":
    test_translation()
