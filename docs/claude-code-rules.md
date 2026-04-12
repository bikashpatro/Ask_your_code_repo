**Claude Code**

Best Practices & Project Rules

*Version 2.0 --- Revised & Improved*

  -----------------------------------------------------------------------
  **1. Tech Stack**
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Category**          Technologies
  --------------------- -------------------------------------------------
  **Framework**         Next.js

  **Package Manager**   pnpm

  **State Management**  Redux (Redux Toolkit slices)

  **Styling**           Tailwind CSS

  **UI Components**     shadcn/ui

  **Icons**             Lucide Icons

  **Animation**         Framer Motion

  **Backend /           Supabase
  Database**            
  -----------------------------------------------------------------------

**Integrations**

-   Supabase MCP (database operations via MCP, never directly)

-   Pencil MCP

-   Supabase skills for edge functions, RPC, and cron jobs

  -----------------------------------------------------------------------
  **2. Code Standards**
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

**2.1 File Size & Structure**

1.  Keep files under 200 lines of code for readability and
    > maintainability.

2.  Follow component-first architecture: build reusable components
    > first, then assemble them into pages.

3.  Create a dedicated folder or file for all API calls (e.g.,
    > lib/api/). Import and use these in your functions. Never write API
    > calls directly in component or page files.

**2.2 State Management**

1.  Use Redux Toolkit slices for all state management. Organize by
    > feature domain.

2.  Avoid prop drilling. Use Redux state or React Context instead of
    > passing props through multiple levels.

3.  Use state as the source of truth. When editing an entity, first
    > check Redux state. Only query the database if the data is
    > unavailable or outdated.

**2.3 Environment Variables & Security**

1.  Never hardcode base URLs, API keys, or headers in the code.

2.  Store all credentials and config in .env.local and access via
    > environment variables.

3.  All Supabase configuration must come from a centralized file (e.g.,
    > lib/supabase.ts) which reads from env vars. Never import
    > process.env directly in components.

**2.4 Code Quality**

1.  Add simple comments at the top of every file: file name, purpose,
    > and brief description.

2.  Add simple comments above every function explaining what it does.
    > Keep comments concise (one line is fine).

3.  This applies to all code: Next.js components, RPC functions, edge
    > functions, utilities, etc.

4.  Build generic, reusable components wherever possible.

5.  Separate concerns: UI components, business logic, and API calls
    > should live in different files.

**2.5 Error Handling**

1.  Use a global error boundary for unexpected errors in the React tree.

2.  Use toast notifications (or a consistent notification system) for
    > user-facing errors.

3.  Handle all Supabase errors in the API utility layer. Return
    > consistent error shapes to components.

4.  Never silently swallow errors. Always log or display them
    > appropriately.

**2.6 Naming Conventions**

Follow these conventions consistently across the project:

-   Components: PascalCase (e.g., UserCard.tsx, LoginForm.tsx)

-   Files and folders: kebab-case (e.g., user-card.tsx, api-utils.ts)

-   Redux slices: camelCase (e.g., userSlice.ts, authSlice.ts)

-   API utility files: grouped under lib/api/ (e.g., lib/api/posts.ts,
    > lib/api/auth.ts)

-   Environment variables: NEXT_PUBLIC\_ prefix for client-side, no
    > prefix for server-only

**2.7 TypeScript**

Use TypeScript throughout the project. Define explicit types and
interfaces for all props, API responses, Redux state shapes, and
Supabase table rows. Avoid using \'any\' unless absolutely necessary.

**2.8 Testing**

Write unit tests for utility functions and API helpers. Tests are only
required when explicitly requested for components or pages, unless the
feature is complex or critical.

  -----------------------------------------------------------------------
  **3. Workflow Rules**
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

**3.1 Follow Commands Strictly**

Do only what is explicitly requested. Do not add extra features,
refactor unrelated code, or install additional packages unless asked. If
a task seems incomplete, ask before expanding scope.

**3.2 Ask Before Implementing**

If you have any doubt about a feature --- no matter how small --- ask
and clarify before implementation. Present all clarifying questions at
once rather than one at a time, so we can resolve ambiguity in a single
round. This avoids misleading implementations.

**3.3 Check Scope Before Building**

Before implementing any new feature, verify the following in order:

-   Check the project documentation --- does this feature already exist?

-   If it exists, update it. If not, create the documentation entry
    > first.

-   Check the design --- are mockups or UI specs available?

-   Check the database --- are the required tables, columns, and RLS
    > policies in place?

-   If anything is mismatched or missing, ask me to clarify before
    > writing any code.

**3.4 Documentation-First Development**

The project document is the single source of truth. Every change flows
through the document first, then into code. Follow this order for all
work:

-   Step 1: Update the documentation with the planned change.

-   Step 2: Implement the change in code.

-   Step 3: If I ask for a change, update the doc first, then develop.

**3.5 No Direct Supabase Changes**

Never modify anything directly in Supabase (tables, functions, policies,
etc.). All Supabase changes must go through MCP so the documentation
stays in sync. I will also not change things directly in Supabase for
the same reason.

  -----------------------------------------------------------------------
  **4. Documentation Format**
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

Maintain the project document using this structure. Every new feature,
table, function, or job must be documented here before implementation.

  ------------------------------------------------------------------------
  **Section**        **What to Track**      **Example**
  ------------------ ---------------------- ------------------------------
  **Frontend         Feature name +         *Login → app/login/page.tsx,
  Features**         associated files       components/LoginForm.tsx*

  **Backend Tables** Table name, columns,   *User (id, email, created_at)
                     RLS policies           --- RLS: authenticated read*

  **RPC Functions**  Function name +        *get_posts → returns paginated
                     purpose                posts*

  **Edge Functions** Function name +        *send_mail → triggered on new
                     trigger                signup*

  **Cron Jobs**      Job name + schedule    *cleanup_sessions → daily at 2
                                            AM*

  **RLS Policies**   Table + policy name +  *posts → owner_only →
                     rule                   auth.uid() = user_id*
  ------------------------------------------------------------------------

**Documentation Rules**

-   Before adding a new feature: check if it already exists in the doc.
    > If yes, update it. If no, create it.

-   Before adding a new table: add it to the doc first, then create it
    > via MCP.

-   Same rule applies for RPC functions, edge functions, cron jobs, and
    > RLS policies.

-   The doc must always match the actual state of the project. No direct
    > changes to Supabase.

  -----------------------------------------------------------------------
  **5. Recommended Folder Structure**
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

app/ → Next.js App Router pages

(feature)/page.tsx → Page files

components/ → Reusable UI components

ui/ → shadcn/ui components

lib/ → Utilities and config

api/ → API call functions (grouped by domain)

supabase.ts → Supabase client (reads from env)

store/ → Redux store setup

slices/ → Redux Toolkit slices

types/ → TypeScript interfaces and types

hooks/ → Custom React hooks

.env.local → Environment variables (never committed)

  -----------------------------------------------------------------------
  **6. Quick Reference Summary**
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Rule**                       **Summary**
  ------------------------------ ----------------------------------------
  **File size**                  Under 200 lines per file

  **Architecture**               Component-first, then pages

  **State**                      Redux Toolkit slices, no prop drilling

  **API calls**                  Centralized in lib/api/, never inline

  **Env vars**                   All in .env.local, accessed via
                                 lib/supabase.ts

  **Comments**                   Simple comments on every file and
                                 function

  **Error handling**             Global boundary + toasts + API-layer
                                 handling

  **TypeScript**                 Explicit types everywhere, avoid \'any\'

  **Documentation**              Update doc first, then code

  **Supabase changes**           Only through MCP, never directly

  **Scope check**                Doc → Design → Database → Implement

  **Commands**                   Do only what is asked, nothing extra

  **Clarification**              Ask all questions upfront before
                                 building
  -----------------------------------------------------------------------
