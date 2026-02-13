"""
Email Diagnostic Tool for Juryline

This script helps diagnose email sending issues with Supabase.
Run this to test your email configuration.
"""

import os
import sys
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()


async def test_supabase_email():
    """Test Supabase email configuration."""
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        return False
    
    print("✓ Environment variables loaded")
    print(f"  SUPABASE_URL: {SUPABASE_URL}")
    print(f"  SERVICE_KEY: {SUPABASE_SERVICE_KEY[:20]}...")
    print()
    
    # Test email address
    test_email = input("Enter test email address: ").strip()
    
    print(f"\n🔍 Testing email to: {test_email}")
    print("=" * 50)
    
    # Test 1: OTP endpoint (used for magic links)
    print("\n1️⃣ Testing OTP endpoint (magic link)...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/otp",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "email": test_email,
                    "options": {
                        "should_create_user": False,
                    },
                },
                timeout=10,
            )
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")
            
            if response.status_code == 200:
                print("   ✅ OTP request successful")
            elif response.status_code == 429:
                print("   ⚠️  Rate limited - wait 60 seconds and try again")
            else:
                print(f"   ❌ Failed with status {response.status_code}")
                
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Check Supabase email settings
    print("\n2️⃣ Checking Supabase project settings...")
    print("   Please verify in Supabase Dashboard:")
    print("   📍 Settings → Authentication → Email Templates")
    print("   📍 Settings → Authentication → SMTP Settings")
    print()
    print("   Required SMTP Settings:")
    print("   - SMTP Host: smtp-relay.brevo.com")
    print("   - SMTP Port: 587")
    print("   - SMTP User: Your Brevo login email")
    print("   - SMTP Password: Your Brevo SMTP key")
    print("   - From Email: verified@yourdomain.com")
    print()
    print("   ✓ Enable 'Email Confirmations' if you want signup verification")
    print("   ✓ Rate limits: Default is 4 emails per hour per user")
    
    return True


async def test_signup_flow():
    """Test the signup email flow."""
    from supabase import create_client, Client
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    test_email = input("\nEnter test email for signup: ").strip()
    test_name = input("Enter test name: ").strip()
    
    print(f"\n3️⃣ Testing signup flow...")
    try:
        result = supabase.auth.sign_up({
            "email": test_email,
            "password": "TestPassword123!",
            "options": {
                "data": {
                    "name": test_name,
                    "role": "participant",
                },
            },
        })
        
        if result.user:
            print(f"   ✅ User created: {result.user.id}")
            print(f"   Email confirmed: {result.user.email_confirmed_at is not None}")
            if not result.user.email_confirmed_at:
                print("   📧 Check inbox for verification email")
        else:
            print("   ❌ Failed to create user")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")


async def main():
    print("=" * 50)
    print("🔧 Juryline Email Diagnostic Tool")
    print("=" * 50)
    
    await test_supabase_email()
    
    print("\n" + "=" * 50)
    print("Additional Checks:")
    print("=" * 50)
    print()
    print("1. Verify Brevo account:")
    print("   - Login to app.brevo.com")
    print("   - Check 'Senders & IP' → verify your sender email")
    print("   - Check 'SMTP & API' → copy SMTP key")
    print()
    print("2. Check Supabase logs:")
    print("   - Go to Supabase Dashboard")
    print("   - Select your project")
    print("   - Go to 'Logs' → 'Auth'")
    print("   - Filter by recent errors")
    print()
    print("3. Test with Supabase edge function:")
    print("   - Try sending test email from Dashboard")
    print("   - Authentication → Configuration → Email Templates")
    print("   - Click 'Send test email'")
    print()
    
    test_more = input("\nTest signup flow? (y/n): ").strip().lower()
    if test_more == 'y':
        await test_signup_flow()
    
    print("\n" + "=" * 50)
    print("✅ Diagnostic complete!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
