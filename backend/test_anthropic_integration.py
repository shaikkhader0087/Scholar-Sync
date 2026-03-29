import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path so we can import AIService
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from papers.services.ai_service import AIService

def test_anthropic():
    print("Testing Anthropic Integration...")
    try:
        service = AIService()
        if not service.anthropic_client:
            print("Error: Anthropic client not initialized. Check ANTHROPIC_API_KEY in .env")
            return

        print("Successfully initialized Anthropic client.")
        
        # Test a simple call
        # We use a very short prompt to minimize token usage
        response = service.call_anthropic("Hello, say 'Anthropic working!'")
        print(f"Anthropic Response: {response}")
        
        if "Anthropic working!" in response:
            print("SUCCESS: Anthropic integration is working correctly.")
        else:
            print("WARNING: Anthropic responded but not as expected. Output: ", response)
            
    except Exception as e:
        print(f"FAILED: An error occurred: {str(e)}")

if __name__ == "__main__":
    test_anthropic()
