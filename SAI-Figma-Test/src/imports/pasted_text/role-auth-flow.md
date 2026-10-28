Modify the EXISTING SAI Smart AI Property Finder Figma design ONLY. Do NOT create a new design and do NOT remove, replace, simplify, or redesign any existing pages, features, filters, components, or functionality.

IMPORTANT: The existing design is already completed and should be preserved. The ONLY major change required is to correct the role-selection, authentication, verification, and role-based access flow.

PRESERVE EVERYTHING THAT ALREADY EXISTS:
- All existing pages
- All existing dashboards
- All existing property pages
- All existing property cards
- All existing filters
- All additional/advanced filters
- City selection
- Language selection
- AI chatbot / AI Assistant
- Guest Mode
- Senior-citizen-friendly features
- Property search
- Property recommendations
- Saved properties
- Property comparison
- Property details
- Contact owner
- Site visits
- Buyer enquiries
- Agent features
- Builder features
- Seller features
- Super Admin features
- Notifications
- Profile pages
- Subscription features
- Advertisement-related features
- Analytics
- Inventory
- Projects
- Towers/Buildings
- All existing navigation
- All existing header tabs
- All existing buttons and UI components
- All existing prototype pages and screens

DO NOT DELETE ANY OF THESE FEATURES OR PAGES.

Do not redesign the existing UI. Keep the current SAI visual language, teal/turquoise color palette, typography, spacing, cards, buttons, icons, headers, navigation, and layouts exactly as they currently appear.

==================================================
ONLY CHANGE: ROLE-FIRST AUTHENTICATION
==================================================

Currently, verification happens before role selection. This must be corrected.

The new flow must be:

Existing Landing / Welcome Page
        ↓
Choose Your Role
        ↓
Role-Specific Login / Sign Up
        ↓
Role-Specific Verification
        ↓
Existing Role-Specific Dashboard/Application

The role must ALWAYS be selected BEFORE verification.

Role options:

- Buyer
- Seller
- Agent
- Builder

When a user selects a role, connect them ONLY to the existing application and pages belonging to that role.

==================================================
BUYER FLOW
==================================================

Choose Buyer
→ Existing Buyer Login / Sign Up
→ Buyer Verification
→ Existing Buyer Home/Dashboard

The Buyer must remain inside the existing Buyer application.

Preserve all existing Buyer features, including:
- Property search
- All existing filters and advanced filters
- City selection
- Language selection
- AI Assistant
- Property recommendations
- Property details
- Saved properties
- Property comparison
- Site visits
- Contact owner
- Other existing Buyer features

Do NOT remove or simplify any Buyer functionality.

==================================================
SELLER FLOW
==================================================

Choose Seller
→ Existing Seller Login / Sign Up
→ Seller Verification
→ Existing Seller Dashboard

Preserve every existing Seller page and feature.

==================================================
AGENT FLOW
==================================================

Choose Agent
→ Existing Agent Login / Sign Up
→ Agent Verification
→ Existing Agent Dashboard

Preserve every existing Agent page and feature.

Keep all existing Agent dashboard navigation and features exactly as they currently are.

Make sure existing header tabs such as:
- Dashboard
- Listings/Properties
- Clients
- Leads/Buyer Enquiries
- Site Visits
- AI Assistant
- Profile

continue to work and connect to their EXISTING corresponding pages.

==================================================
BUILDER FLOW
==================================================

Choose Builder
→ Existing Builder Login / Sign Up
→ Builder Verification
→ Existing Builder Dashboard

Preserve every existing Builder page and feature.

Keep the existing Builder navigation exactly as it currently exists, including:

- Builder Overview
- My Projects
- Towers/Buildings
- Inventory
- Buyer Enquiries
- AI Assistant
- Profile

Make each existing header tab navigate to its existing corresponding page.

==================================================
ROLE-BASED ACCESS
==================================================

After verification, the selected role determines which part of the application the user can access.

Buyer → Buyer application ONLY
Seller → Seller application ONLY
Agent → Agent application ONLY
Builder → Builder application ONLY

Do NOT allow a user to navigate from one role's dashboard to another role's dashboard.

For example:

Buyer must NOT be able to access:
- Agent Dashboard
- Builder Dashboard
- Seller Dashboard
- Super Admin Dashboard

Agent must NOT be able to access:
- Builder Dashboard
- Seller Dashboard
- Super Admin Dashboard

Builder must NOT be able to access:
- Agent Dashboard
- Seller Dashboard
- Super Admin Dashboard

Seller must NOT be able to access:
- Buyer Dashboard
- Agent Dashboard
- Builder Dashboard
- Super Admin Dashboard

Do this by fixing the EXISTING prototype connections. Do not remove legitimate pages or features.

==================================================
SUPER ADMIN
==================================================

Keep Super Admin completely separate from the normal public role-selection flow.

Do NOT expose Super Admin as a normal public Buyer/Seller/Agent/Builder role.

Preserve the existing Super Admin login, verification, dashboard, pages, features, analytics, user management, advertisements, subscriptions, and other existing functionality.

==================================================
SENIOR CITIZEN / GUEST MODE
==================================================

IMPORTANT: Preserve the existing Guest Mode exactly as it currently works.

Do NOT force senior citizens or guests to log in before using the basic application.

A guest should still be able to:

- Continue as Guest
- Select native/preferred language
- Interact directly with the AI chatbot
- Search properties
- Browse properties
- Use existing filters
- Use existing advanced filters
- Explore property details

If a guest tries to perform an account-required action such as:

- Save property
- Contact owner
- Schedule a visit
- Buy/proceed with a property
- Access personalized recommendations
- Access profile

then show the existing authentication prompt.

After authentication is required, the flow must become:

Choose Role
→ Buyer
→ Existing Buyer Login/Sign Up
→ Buyer Verification
→ Existing Buyer Application

Do NOT send the guest directly to another role's dashboard.

==================================================
CITY SELECTION
==================================================

KEEP THE EXISTING CITY SELECTION FEATURE.

Do not remove or redesign it.

A logged-in user must be able to change their city without logging out.

Changing the city must NOT change:
- User role
- Authentication state
- Dashboard
- Application access

Keep all existing city-based property filtering functionality.

==================================================
FILTERS
==================================================

CRITICAL: DO NOT REMOVE OR MODIFY THE EXISTING FILTER SYSTEM.

All existing filters and additional filters must remain exactly as currently designed.

Preserve:
- Budget/price filters
- Location filters
- Property type
- Seller/owner type
- Furnishing
- Locality
- Nearby hospitals
- Metro
- Schools
- Companies/workplaces
- Any existing AI-based filters
- Any additional filters already present
- Any sorting options
- Any property search functionality

If additional filters already exist in the design, KEEP THEM.

Do not replace them with simplified filters.

==================================================
AI ASSISTANT
==================================================

KEEP THE EXISTING AI Assistant/chatbot pages and functionality.

The AI Assistant must remain available in the appropriate existing application.

Buyer → Buyer AI Assistant
Seller → Seller AI Assistant
Agent → Agent AI Assistant
Builder → Builder AI Assistant

Do not delete or redesign the existing chatbot.

==================================================
PROTOTYPE CONNECTIONS
==================================================

Review the EXISTING prototype connections and fix ONLY incorrect authentication and role-access connections.

Check:

- Role selection
- Login
- Sign Up
- Verification
- Continue buttons
- Back buttons
- Header navigation
- Dashboard navigation
- Profile navigation
- Guest-to-login flow
- City selection
- Language selection
- AI Assistant
- Existing filters
- Existing pages

Make sure the existing pages remain connected.

Do NOT create duplicate pages if the destination page already exists.

Reuse the existing frames/screens wherever possible.

==================================================
MOST IMPORTANT REQUIREMENT
==================================================

This is an EXISTING completed design.

DO NOT:
- Create a new application
- Redesign the application
- Delete pages
- Delete filters
- Delete features
- Remove existing functionality
- Replace existing dashboards
- Simplify existing pages
- Remove advanced filters
- Remove the AI Assistant
- Remove Guest Mode
- Remove senior-citizen features
- Change the existing visual design

ONLY:
1. Move role selection BEFORE verification.
2. Connect each role to its existing authentication flow.
3. Connect each role to its existing dashboard/application.
4. Prevent prototype navigation between different roles.
5. Fix any existing header/navigation connections that point to the wrong role.
6. Preserve ALL existing pages, filters, features, and functionality.

FINAL FLOW:

GUEST:
Landing
→ Guest Mode
→ Native Language
→ AI Chatbot / Property Browsing
→ Account-required action
→ Choose Role
→ Buyer
→ Buyer Login/Sign Up
→ Buyer Verification
→ Existing Buyer Application

REGISTERED USER:
Landing
→ Choose Role
→ Selected Role Login/Sign Up
→ Selected Role Verification
→ Existing Selected Role Application

SUPER ADMIN:
Existing Admin Login
→ Admin Verification
→ Existing Super Admin Dashboard

Make these changes directly on the existing design while preserving everything else.