# Phase 02 — Authentication with Supabase (Email Verification + Magic Links)

## Goal
Implement authentication using **Supabase Auth** with **mandatory email verification**, role-based access (Organizer/Judge/Participant), and **magic link** flow for judge invitations. No custom JWT code needed — Supabase handles it all.

---

## Step 1: Supabase Auth Configuration

### 1.1 Enable Email Verification

In Supabase Dashboard → Auth → Settings:
- **Enable email confirmations**: ON
- **Confirm email template**: Customize with Juryline branding
- **Redirect URL after confirmation**: `{FRONTEND_URL}/auth/callback`
- **Site URL**: `http://localhost:3000` (dev) / production URL

### 1.2 Auth Flow Overview

```
Register                          Email Verification
   │                                    │
   │  supabase.auth.signUp({           │  User clicks link in email
   │    email, password,               │  → redirects to /auth/callback
   │    options: {                      │  → Supabase confirms email
   │      data: { name, role }         │  → Auto-login → redirect by role
   │    }                              │
   │  })                               │
   │                                    │
   ▼                                    ▼
 "Check your email!" page         Dashboard / Submit / Review
```

```
Judge Magic Link
   │
   │  Organizer creates invite
   │  → Backend calls supabase.auth.admin.generateLink({
   │      type: 'magiclink', email, options: { data: { name, role: 'judge' } }
   │    })
   │  → Returns magic link URL
   │  → Organizer shares the link
   │  → Judge clicks link → auto-verified, auto-logged in
```

---

## Step 2: Backend Auth Helpers

### 2.1 JWT Verification (`app/utils/dependencies.py`)

```python
from jose import jwt

async def get_current_user(authorization: str = Header(...)):
    """Verify Supabase JWT and return user profile"""
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(
        token, 
        settings.SUPABASE_JWT_SECRET, 
        algorithms=["HS256"],
        audience="authenticated"
    )
    user_id = payload["sub"]
    
    # Fetch profile from Supabase
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return result.data

async def require_role(role: str):
    """Factory for role-based dependencies"""
    async def checker(user = Depends(get_current_user)):
        if user["role"] != role:
            raise HTTPException(403, f"Requires {role} role")
        return user
    return checker

require_organizer = Depends(require_role("organizer"))
require_judge = Depends(require_role("judge"))
require_participant = Depends(require_role("participant"))
```

### 2.2 Profile Creation Trigger

When a user signs up via Supabase Auth, we need to auto-create a `profiles` row. Use a **Supabase database trigger**:

```sql
-- Add to schema.sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

This means: when `supabase.auth.signUp({ data: { name: "Alex", role: "organizer" } })` is called, the trigger auto-creates the profile.

### 2.3 Judge Invitation Endpoint

```python
# app/routers/judges.py

@router.post("/events/{event_id}/judges/invite")
async def invite_judge(
    event_id: UUID,
    invite: JudgeInviteRequest,  # { email, name }
    user = Depends(require_organizer)
):
    # 1. Generate magic link via Supabase Admin API
    result = supabase.auth.admin.generate_link({
        "type": "magiclink",
        "email": invite.email,
        "options": {
            "data": {"name": invite.name, "role": "judge"},
            "redirect_to": f"{settings.FRONTEND_URL}/auth/callback"
        }
    })
    
    # 2. Create event_judges record
    supabase.table("event_judges").insert({
        "event_id": str(event_id),
        "judge_id": result.user.id,  # Supabase auto-creates user
        "invite_status": "pending"
    }).execute()
    
    # 3. Return invite link for organizer to share
    return { "invite_link": result.properties.action_link }
```

---

## Step 3: Frontend Auth Pages

### 3.1 Register Page (`/register`)

```typescript
// Uses supabase.auth.signUp()
const handleRegister = async (data: RegisterForm) => {
    const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: { name: data.name, role: data.role }, // stored in user_metadata
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    if (!error) router.push("/verify-email"); // "Check your inbox!"
};
```

**UI Elements:**
- Animated card form with Chakra UI
- Fields: Name, Email, Password, Role selector (Organizer / Participant)
- "Sign Up" button with loading spinner
- Link to login page

### 3.2 Email Verification Page (`/verify-email`)

- Big animated envelope icon (Framer Motion)
- "Check your email! 📧"
- "We've sent a verification link to {email}"
- "Didn't receive it? Resend" button
- Animated pulse effect on the envelope

### 3.3 Auth Callback (`/auth/callback/route.ts`)

```typescript
// Next.js route handler — handles Supabase email confirmation redirect
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    
    if (code) {
        const supabase = createServerClient(...);
        await supabase.auth.exchangeCodeForSession(code);
    }
    
    // Redirect based on role
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role;
    
    const redirectMap = {
        organizer: "/dashboard",
        judge: "/review",
        participant: "/submit",
    };
    
    return NextResponse.redirect(redirectMap[role] || "/dashboard");
}
```

### 3.4 Login Page (`/login`)

```typescript
const handleLogin = async (data: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });
    // Supabase auto-rejects unverified emails!
    if (error?.message === "Email not confirmed") {
        // Show "Please verify your email first" message
    }
};
```

### 3.5 Auth Hook (`hooks/useAuth.ts`)

```typescript
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        });
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => setUser(session?.user ?? null)
        );
        
        return () => subscription.unsubscribe();
    }, []);
    
    return { user, loading, signOut: () => supabase.auth.signOut() };
}
```

### 3.6 Protected Route Component

```typescript
export function ProtectedRoute({ children, allowedRoles }: Props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    if (loading) return <LoadingSpinner />;
    if (!user) { router.push("/login"); return null; }
    
    const role = user.user_metadata?.role;
    if (allowedRoles && !allowedRoles.includes(role)) {
        router.push("/unauthorized");
        return null;
    }
    
    return children;
}
```

### 3.7 Navbar with Auth State

- Show user name + avatar initial
- Role badge (colored: Organizer=blue, Judge=purple, Participant=green)
- Animated dropdown: Profile, Logout
- Responsive hamburger menu

---

## Verification Checklist

- [ ] `supabase.auth.signUp()` sends verification email
- [ ] Unverified users CANNOT log in (Supabase rejects them)
- [ ] Email verification link → `/auth/callback` → auto-login + role redirect
- [ ] Profile auto-created via database trigger on signup
- [ ] Judge magic link creates user + logs them in
- [ ] Backend `get_current_user` correctly verifies Supabase JWT
- [ ] Role-based guards return 403 for wrong roles
- [ ] Login/Register pages render with Chakra UI animations
- [ ] "Check your email" page displays after registration
- [ ] Auth state persists across page refreshes (Supabase session)
