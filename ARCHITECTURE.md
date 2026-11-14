# Cosmos --- Application Architecture

**Status:** Approved **Architecture:** Hybrid Modular Monolith
**Organization:** Feature-Oriented **Application:** Next.js App Router
**Repository:** pnpm Monorepo

------------------------------------------------------------------------

## 1. Architectural Vision

Cosmos follows a hybrid modular monolith architecture.

The application is deployed as an integrated system, while its internal
structure is divided into well-defined modules with explicit
responsibilities and controlled dependencies.

The architecture combines:

-   Feature-oriented organization.
-   Selective domain-driven design.
-   Centralized shared infrastructure.
-   Reusable workspace packages.
-   Explicit server/client boundaries.

Microservices are not part of the initial architecture. They may be
considered later only when independent deployment or scaling has a
demonstrated benefit.

## 2. Architectural Principles

1.  Separation of concerns: Every module has a clearly defined
    responsibility.
2.  High cohesion: Related functionality stays together.
3.  Low coupling: Modules depend on explicit interfaces rather than
    implementation details.
4.  Feature ownership: Features own their domain-specific components,
    logic, hooks, types and services.
5.  Reuse without duplication: Shared code has one intentional owner.
6.  Server-first: Server Components and server-side execution are
    preferred unless client interactivity is required.
7.  Security by boundary: Authentication, authorization, session
    management and sensitive infrastructure remain server-controlled.
8.  Incremental evolution: Introduce abstractions when actual complexity
    justifies them.
9.  No premature distribution: Keep the system modular without
    introducing unnecessary network boundaries.
10. Explicit dependencies: Avoid circular dependencies and uncontrolled
    cross-feature imports.

## 3. Application Directory Structure

The following represents the approved target structure, not a
requirement to create every directory immediately.

``` text
apps/web/src/
├── app/                         # Next.js routing and composition
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── explore/
│   │   ├── learn/
│   │   ├── research/
│   │   └── community/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (platform)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── settings/
│   ├── api/
│   ├── design-system/
│   │   └── visualization/
│   ├── layout.tsx
│   └── globals.css
│
├── features/                    # Product domain modules
│   ├── astronomy/
│   ├── education/
│   ├── simulations/
│   ├── authentication/
│   ├── community/
│   └── user-profile/
│
├── components/                  # Application-level shared UI
│   ├── layout/
│   └── shared/
│
├── lib/                         # Infrastructure and core utilities
│   ├── database/
│   ├── security/
│   ├── storage/
│   └── utilities/
│
├── services/                    # Shared external integrations
├── hooks/                       # Genuinely shared React hooks
├── stores/                      # Genuinely shared client state
├── types/                       # Web-application-wide types
├── config/                      # Application configuration
└── instrumentation.ts
```

Feature-specific hooks, types, components, stores and services belong
inside their owning feature rather than in global directories.

## 4. Feature Module Architecture

Each feature owns its implementation and exposes a controlled public
interface.

A feature may adopt the following structure when its complexity warrants
it:

``` text
features/
└── astronomy/
    ├── components/
    ├── hooks/
    ├── services/
    ├── types/
    ├── lib/
    └── index.ts
```

Responsibilities:

-   components/: Feature-specific presentation.
-   hooks/: Feature-specific React hooks.
-   services/: Feature-specific application workflows.
-   types/: Feature-specific TypeScript definitions.
-   lib/: Internal feature utilities and domain logic.
-   index.ts: Deliberately selected public exports.

Not every feature needs every directory.

The public entry point must expose only functionality intended for
external consumers. Internal implementation files should not be imported
directly by other features.

## 5. Module Ownership

### Application layer --- app/

Owns:

-   URL routing and route composition.
-   Layouts and route groups.
-   Page metadata.
-   Loading, error and not-found boundaries.
-   Route handlers where required.

Must not become the primary location for domain business logic.

### Feature layer --- features/

Owns:

-   Domain-specific functionality.
-   Business rules and workflows.
-   Feature-specific UI and state.
-   Feature-specific hooks, types and services.
-   Public module interfaces.

### Shared presentation --- components/

Owns application-specific components reused across multiple features.

Universal, independently reusable UI primitives should eventually live
in packages/ui.

### Infrastructure --- lib/

Owns technical capabilities such as:

-   Database access.
-   Security primitives.
-   Storage adapters.
-   Caching infrastructure.
-   Shared technical utilities.

Infrastructure must not depend on application routes or feature
presentation.

### Integrations --- services/

Owns shared adapters for external providers and third-party systems.

Feature-specific orchestration remains inside its feature.

### Shared hooks --- hooks/

Contains only hooks genuinely reused across unrelated application areas.

### Shared state --- stores/

Contains application-wide client state only when state genuinely needs
to be shared.

Feature-local state remains inside the feature.

### Shared types --- types/

Contains application-wide contracts that are not specific to one feature
or reusable workspace package.

### Configuration --- config/

Contains application-specific settings, metadata and environment
configuration.

Server-only configuration must never be imported into client components.

## 6. Dependency Rules

The following diagram describes the intended dependency direction.
Arrows indicate permitted dependency relationships, not runtime
execution order.

``` text
Next.js App Router
        |
        v
Feature Public Interfaces
        |
        +------> Shared Application Modules
        |
        +------> Workspace Package Interfaces
        |
        +------> Approved Infrastructure Interfaces

Infrastructure Adapters
        |
        v
Implement Infrastructure Interfaces
```

Detailed rules:

1.  App routes may compose features through their public interfaces.
2.  Features may use approved shared components, hooks, types, utilities
    and integrations.
3.  A feature must not import another feature's internal files.
4.  Cross-feature dependencies must use explicit public interfaces and
    have a justified use case.
5.  Shared components must not import feature implementations.
6.  Infrastructure must not import UI components, routes or features.
7.  Shared types must avoid runtime dependencies wherever possible.
8.  Server-only modules must never enter client-side dependency graphs.
9.  Circular dependencies are prohibited.
10. Avoid broad wildcard exports that expose internal implementation
    accidentally.
11. The module that consumes an infrastructure capability owns its
    required interface when that interface is specific to its needs.
12. Infrastructure adapters implement those interfaces without
    introducing dependencies on feature implementations.
13. Server-side composition connects interfaces to their
    implementations. Infrastructure adapters must not leak into
    client-side dependency graphs.

## 7. Monorepo Package Ownership

The repository currently has four workspace package directories. Only
@cosmos/design-tokens is an active workspace package with a manifest and
public export. The remaining directories are reserved for future
packages:

``` text
packages/
├── config/
├── design-tokens/
├── types/
└── ui/
```

Intended ownership once each package is activated:

  Package                 Responsibility
  ----------------------- ---------------------------------------------
  @cosmos/design-tokens   Shared design tokens and CSS design system
  @cosmos/ui              Reusable framework-compatible UI components
  @cosmos/types           Cross-workspace TypeScript contracts
  @cosmos/config          Shared development-tool configuration

Package rules:

-   Application-specific configuration remains in apps/web/src/config.
-   Feature-specific types remain inside their feature.
-   Web-specific shared types remain in apps/web/src/types.
-   Cross-workspace types belong in packages/types.
-   Generic reusable UI belongs in packages/ui.
-   Application composition belongs in apps/web.
-   packages/config must not become a second application runtime
    configuration system.

Empty workspace directories are not automatically required to become
published or consumable packages. Each package must have a justified
purpose, manifest and public interface before activation.

## 8. Routing, Navigation and Metadata Strategy

Next.js App Router is the routing and composition layer for Cosmos.

Routing must support four equally important product experiences:
Explore, Learn, Research and Community.

### 8.1 Route Group Organization

The approved route groups are:

``` text
app/
├── (public)/
│   ├── page.tsx
│   ├── explore/
│   ├── learn/
│   ├── research/
│   └── community/
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
├── (platform)/
│   ├── dashboard/
│   ├── profile/
│   └── settings/
├── api/
├── design-system/
│   └── visualization/
├── layout.tsx
└── globals.css
```

Route groups organize application experiences without adding URL
segments.

-   (public): Public-facing homepage and the four product pillars.
-   (auth): Authentication-related experiences.
-   (platform): Authenticated account and platform experiences.
-   api: Backend Route Handlers.
-   design-system: Internal design-system documentation and specimens.

These groups are organizational boundaries, not security boundaries.

The existing design-system route must be preserved.

### 8.2 Approved URL Taxonomy

  --------------------------------------------------------------------------
  URL                            Purpose               Access
  ------------------------------ --------------------- ---------------------
  /                              The Discovery or The  Public URL;
                                 Gateway               experience depends on
                                                       session

  /explore                       Universe exploration  Public

  /learn                         Astronomy education   Public

  /research                      Scientific research   Public

  /community                     Community discovery   Public

  /login                         Sign in               Public

  /register                      Account creation      Public

  /forgot-password               Password recovery     Public

  /reset-password                Password reset        Public

  /dashboard                     Personal workspace    Authenticated

  /profile                       Account profile       Authenticated
                                 management

  /settings                      Account settings      Authenticated

  /api/\*                        Backend endpoints     Per-endpoint policy

  /design-system/visualization   Visualization         Internal
                                 specimen
  --------------------------------------------------------------------------

Potential future content routes include:

-   /explore/\[objectSlug\]
-   /learn/\[courseSlug\]
-   /community/\[discussionSlug\]

Dynamic routes must only be introduced when their underlying content
models and lookup contracts are established. They are not requirements
to create placeholder pages now.

Public user-profile URLs are not defined by this stage.

### 8.3 Two Homepage Experiences

Cosmos has one homepage URL with two distinct experiences.

**The Discovery --- Unauthenticated visitors**

-   Full cinematic introduction.
-   Wonder-led storytelling and visual discovery.
-   Introduction to the four product pillars.
-   Curated discoveries and featured experiences.
-   Natural invitation to join Cosmos.

**The Gateway --- Authenticated visitors**

-   Full-quality cinematic atmosphere.
-   Shorter, purposeful storytelling.
-   No repeated introductory onboarding.
-   Immediate access to the four product pillars.
-   Fresh, curated discoveries and platform highlights.
-   No generic personalized dashboard or activity-feed replacement.

Both experiences share the same public-facing homepage metadata.

The homepage experience must be selected using validated server-side
session state.

A client-side authentication check must not determine the authoritative
homepage experience.

Session-dependent responses must never be shared or cached across users
in a way that exposes authenticated content.

### 8.4 Navigation Hierarchy

Cosmos uses one persistent global navigation foundation with contextual
navigation inside each pillar.

**Level 1 --- Global Navigation**

Provides consistent access to the Cosmos identity and the four primary
pillars:

-   Explore
-   Learn
-   Research
-   Community

Global navigation remains accessible throughout the main platform
experiences.

Its visual presentation may adapt to immersive content and different
screen sizes without losing its identity or availability.

**Level 2 --- Pillar Navigation**

Provides navigation specific to the active pillar.

Each pillar has its own categories, sections and discovery paths.

**Level 3 --- Contextual Navigation**

Provides navigation within individual objects, lessons, simulations,
resources and discussions.

Breadcrumbs may be used where deeper navigation benefits from additional
context.

Navigation principles:

1.  All four pillars have equal architectural importance.
2.  Global navigation remains recognizable across the platform.
3.  Pillar navigation is contextual rather than identical everywhere.
4.  Cinematic presentation must not obstruct navigation.
5.  Desktop and mobile navigation must be designed appropriately for
    their respective environments.
6.  Navigation must remain accessible and understandable.

### 8.5 Public and Protected Access

Cosmos follows a public-first access model.

Public visitors may:

-   Explore publicly available astronomical content.
-   Read educational material.
-   Access public research resources.
-   Read published community discussions.

Authentication is required for protected capabilities, including:

-   Saving personal discoveries.
-   Tracking learning progress.
-   Creating discussions and participating.
-   Managing personal account information.
-   Accessing private workspaces and resources.

Community access follows a read-public, participate-authenticated model.

Authentication and authorization must be enforced on the server for
every protected operation.

Authorization must consider the requested action, resource ownership and
applicable permissions.

A valid session alone does not grant permission to access another user's
private resources.

API endpoints must enforce their own authentication and authorization
requirements.

Route groups, layouts and hidden navigation controls must never be
treated as substitutes for server-side security.

Authentication redirects should preserve the intended destination while
validating return URLs to prevent unsafe redirects.

### 8.6 URL Conventions

-   Use lowercase URL segments.
-   Use kebab-case for multiword segments.
-   Prefer meaningful, stable resource identifiers and slugs.
-   Keep URL hierarchy aligned with actual content relationships.
-   Avoid unnecessary nesting.
-   Avoid speculative routes and placeholder route groups.

### 8.7 Route Metadata and SEO

The application metadata foundation in config/metadata.ts remains the
central source of default metadata.

Metadata conventions:

1.  Every indexable page has a unique, descriptive title.
2.  Page titles use the existing Cosmos title template.
3.  Public pages provide meaningful, page-specific descriptions.
4.  Open Graph metadata is appropriate to the page content.
5.  Indexable public pages receive canonical URLs.
6.  Authentication and private account pages use noindex.
7.  Dynamic content generates metadata from its actual content.
8.  Both homepage experiences share public-facing SEO metadata.
9.  Metadata must not expose private user information.
10. metadataBase is configured only after the production domain is
    finalized.

Public community discussions may be indexed when published and
appropriate.

Private account pages, dashboards and settings must not be indexed.

Canonical URLs and social-sharing URLs must use the finalized production
origin when available.

### 8.8 Implementation Rules

-   Keep route files focused on composition.
-   Keep domain logic inside feature modules.
-   Use Server Components by default.
-   Introduce Client Components only when interaction requires them.
-   Resolve homepage authentication state on the server.
-   Keep Route Handlers thin and delegate application workflows.
-   Enforce access independently of route-group organization.
-   Preserve the existing application configuration and design-system
    routes.
-   Do not implement speculative routes before their domain requirements
    exist.
-   Apply appropriate caching and rendering boundaries to public and
    authenticated content.

Routing and navigation implementation must follow the approved
architecture without introducing unnecessary application features during
the foundation phase.

## 9. Application Shell and Layout Architecture

The application shell provides the structural foundation shared across
Cosmos experiences.

It separates document-level configuration, public experiences,
authentication experiences and authenticated platform experiences while
preserving one consistent Cosmos identity.

### 9.1 Layout Hierarchy

The approved layout hierarchy is:

``` text
Root Layout — app/layout.tsx
│
├── Public Layout — (public)/layout.tsx
│   ├── Global navigation
│   └── Discovery / Gateway / Explore / Learn / Research / Community
│
├── Authentication Layout — (auth)/layout.tsx
│   └── Minimal branded authentication experience
│
└── Platform Layout — (platform)/layout.tsx
    ├── Global navigation
    └── Dashboard / Profile / Settings
```

The root layout is the single document-level layout for the application.
Nested route-group layouts provide experience-specific composition
without changing public URLs.

### 9.2 Root Layout Responsibilities

The root layout owns application-wide document configuration:

-   HTML document structure and language.
-   Body element and global styling foundation.
-   Application-wide font configuration.
-   Global CSS imports.
-   Root theme configuration.
-   Default metadata integration.

The root layout must not own:

-   Application-specific global navigation.
-   Pillar-specific navigation.
-   Homepage experience selection.
-   Authentication workflows.
-   Feature-specific business logic.

Keep the root layout stable and lightweight.

### 9.3 Public Layout

The public layout provides the shared shell for public-facing Cosmos
experiences.

Responsibilities:

-   Compose the shared global navigation.
-   Provide the structural foundation for the four public pillars.
-   Preserve the immersive visual identity of Cosmos.
-   Support responsive navigation presentation.
-   Allow pillar-specific layouts to extend the experience when
    required.

The Discovery and Gateway homepage experiences are selected in the
homepage Server Component using validated server-side session state.

The persistent root layout must not make this decision because layouts
can persist across navigation and do not necessarily rerender for every
route transition.

### 9.4 Authentication Layout

The authentication layout provides a focused, minimal branded
environment for:

-   Login.
-   Registration.
-   Password recovery.
-   Password reset.

It must preserve Cosmos visual identity without requiring the full
public navigation experience.

Authentication and authorization remain server-controlled. The layout
itself is not a security boundary.

### 9.5 Platform Layout

The platform layout provides the shared structural foundation for
authenticated account and platform experiences.

Responsibilities:

-   Compose the shared global navigation.
-   Provide consistent platform-level structure.
-   Support authenticated destinations such as the dashboard, profile
    and settings.
-   Allow platform-specific components to be introduced when justified.

Every protected page, data operation and server action must
independently enforce its required authentication and authorization
rules.

### 9.6 Global Navigation Architecture

Global navigation provides consistent access to:

-   Cosmos identity.
-   Explore.
-   Learn.
-   Research.
-   Community.

The navigation must remain recognizable and accessible across the main
platform experiences.

Its visual presentation may adapt to cinematic sections, scrolling
contexts and different screen sizes without losing its identity or
availability.

Global navigation must be reusable rather than independently
reimplemented inside individual route layouts.

Application-level shared layout components belong in components/layout
when they are genuinely reused across application areas.

### 9.7 Pillar-Level and Contextual Navigation

Pillar navigation belongs to the active product experience.

Each pillar may introduce its own navigation structure, categories and
discovery paths.

Pillar-specific navigation should be introduced through nested layouts
when the relevant experience requires it.

Contextual navigation may support deeper journeys through individual
objects, lessons, simulations, resources and discussions.

Do not create placeholder pillar layouts or navigation structures before
their actual requirements are established.

### 9.8 Provider and Application Context Placement

Providers must be introduced only when a real application requirement
needs them.

-   Keep Server Components as the default.
-   Use Client Components for providers that require React context or
    client-side behavior.
-   Place providers as deeply as practical.
-   Avoid wrapping the entire application in client-side providers
    without a demonstrated need.
-   Keep feature-specific context inside the owning feature.
-   Do not use client-side context as a substitute for server-owned data
    or authorization.

### 9.9 Layout and Execution Boundaries

-   Layouts compose experiences; they do not own domain business logic.
-   Server Components remain the default for layouts and pages.
-   Client Components are introduced only for required interaction.
-   Layouts must not assume they rerender on every navigation.
-   Layouts must not rely on direct access to the current pathname or
    search parameters.
-   Request-specific decisions should be made at the appropriate page or
    server execution boundary.
-   Authentication and authorization must be enforced independently of
    layout composition.
-   Providers and shared components must respect the established
    dependency rules.

The application shell must preserve the shared Cosmos identity while
allowing each experience to have its own appropriate presentation and
interaction model.

## 10. Server and Client Boundaries

The application must maintain explicit execution boundaries.

Server-side responsibilities include:

-   Session validation.
-   Authentication and authorization.
-   Database access.
-   Sensitive environment variables.
-   Private external service credentials.
-   Security-sensitive business operations.

Client-side responsibilities include:

-   User interactions.
-   Local presentation state.
-   Browser-only APIs.
-   Interactive visualizations where required.

Rules:

-   Use server-only protection for sensitive modules.
-   Never expose private secrets through NEXT_PUBLIC variables.
-   Never trust client-side authorization checks.
-   Validate untrusted input at system boundaries.
-   Enforce authorization on the server for protected operations.

## 11. Authentication and Security Architecture

Cosmos uses custom server-managed sessions.

The authentication implementation must preserve these architectural
decisions:

-   Opaque, cryptographically random session identifiers.
-   HttpOnly, Secure and appropriately configured SameSite cookies.
-   Server-side session records.
-   Only a hash of the session secret stored server-side.
-   Argon2id password hashing.
-   Server-side session validation, rotation and revocation.
-   Explicit authorization checks.
-   CSRF protection and rate limiting.
-   Single-use, time-limited verification and password-reset tokens.

Authentication is divided by responsibility:

-   features/authentication owns authentication-related user
    experiences, presentation and application workflows.
-   Server-side security infrastructure owns session management,
    password hashing, verification tokens, session validation and
    authorization primitives.
-   Other features consume approved server-side authentication and
    authorization interfaces.
-   No feature may implement its own session mechanism or bypass
    centralized authorization.

## 12. State Management

State must be placed according to its actual ownership.

-   Component-local state belongs in components.
-   Feature-specific state belongs inside its feature.
-   Shared client state belongs in stores when necessary.
-   Server-owned data should remain server-owned.
-   Remote data fetching and caching must not be duplicated
    unnecessarily.

Avoid introducing global state for data that can be derived locally or
retrieved from the server.

## 13. Testing and Quality

Each module should be testable independently where practical.

Quality requirements:

-   TypeScript strict mode.
-   ESLint validation.
-   Production build validation.
-   Tests for important domain rules and security-sensitive workflows.
-   Explicit module boundaries.
-   No unexplained circular dependencies.
-   No unnecessary dependencies.

New infrastructure or architectural abstractions must provide a clear
benefit.

## 14. Feature Development Workflow

When introducing a new feature:

1.  Define its responsibility and domain boundaries.
2.  Identify existing shared capabilities.
3.  Decide which logic belongs inside the feature.
4.  Define its public interface.
5.  Implement the minimum required internal structure.
6.  Integrate it through the application routing layer.
7.  Validate dependencies and execution boundaries.
8.  Add appropriate tests.
9.  Review the architecture before expanding the module.

Do not create all possible feature directories in advance.

## 15. Architecture Change Policy

Changes to architectural boundaries should be deliberate.

Before introducing:

-   A new shared package.
-   A new infrastructure abstraction.
-   Cross-feature dependencies.
-   A new state-management system.
-   A separate backend service.
-   A new authentication or authorization mechanism.

Document the reason, ownership, dependencies and trade-offs.

Major architectural changes should be recorded as Architecture Decision
Records when appropriate.

------------------------------------------------------------------------

## 16. Shared UI Architecture

### 16.1 Component Ownership Model

Cosmos uses three levels of component ownership. A component belongs at
the narrowest level that accurately represents its responsibility.

**Level 1 --- Shared UI package (`packages/ui`)**

This package owns reusable, framework-compatible presentation primitives
and components. Its components must be generic, accessible, composable
and independent of Cosmos business domains.

Examples include:

-   Button.
-   Input and other form primitives.
-   Checkbox.
-   Dialog.
-   Tooltip.
-   Tabs.
-   Dropdown and select primitives.
-   Loading indicators.

The package must not own Cosmos-specific navigation, application
workflows, feature rules, domain entities or business logic.

**Level 2 --- Application-wide components (`apps/web/src/components`)**

This layer owns Cosmos application components shared by multiple
application areas. These components may express the Cosmos product
identity and application experience.

Examples include:

-   Global navigation.
-   Application shell components.
-   Shared page-level layouts.
-   Cosmos-specific shared presentation.

Application components may compose primitives from `@cosmos/ui`. They
must not become a second home for feature-specific domain logic.

**Level 3 --- Feature components (`apps/web/src/features/*`)**

A feature owns components that express its domain, workflows or
feature-specific presentation.

Examples include:

-   Celestial-object cards owned by Explore.
-   Lesson and learning-path cards owned by Learn.
-   Simulation controls owned by Research.
-   Discussion and community cards owned by Community.

A feature component remains inside its owning feature unless a concrete
cross-feature requirement justifies extracting a genuinely generic
component.

### 16.2 Ownership and Promotion Rules

Apply the following rules when deciding where a component belongs:

1.  Generic presentation primitives belong in `packages/ui`.
2.  Cosmos-specific components shared across application areas belong in
    `apps/web/src/components`.
3.  Domain-specific components belong to their owning feature.
4.  Do not promote a component to a shared layer solely because it might
    be reused in the future.
5.  Shared components must not depend on feature implementations.
6.  A feature may consume shared UI and application-level components
    through approved public interfaces, but shared layers must never
    import from feature modules.
7.  `packages/design-tokens` owns design tokens and their CSS entry
    point; it does not own React components.

### 16.3 Shared UI Package Technology

The initial shared UI package will use:

-   React.
-   TypeScript.
-   CSS Modules for component-specific styles.
-   The existing Cosmos design-token system.
-   Accessible and composable component APIs.
-   WCAG 2.2 AA as the accessibility target.

The package must remain independent of Next.js. It must not import
Next.js modules or rely on App Router behavior.

React is a peer dependency of the UI package. This avoids bundling a
separate React runtime into the shared package and allows the consuming
application to provide its React version.

Do not introduce a large third-party component library at this stage.
Build the primitives Cosmos requires and introduce specialized
dependencies only when a demonstrated requirement justifies them.

### 16.4 Styling and Design-Token Contract

The design-token package remains the source of truth for visual tokens.

The shared UI package must:

-   Use semantic and component-level CSS custom properties supplied by
    the Cosmos design system.
-   Avoid hard-coded colors, spacing, typography, elevations and other
    visual values when an appropriate token exists.
-   Avoid depending directly on raw primitive tokens for component
    styling when a semantic or component token is available.
-   Keep component-specific selectors and styles in CSS Modules.
-   Avoid importing the global design-token stylesheet from individual
    components.

The application is responsible for loading the canonical
`@cosmos/design-tokens/css` stylesheet once through its global CSS entry
point. The shared UI components consume the resulting CSS custom
properties.

This is a styling contract rather than a requirement for the UI package
to import the global token stylesheet itself. The UI package should not
duplicate token definitions or establish a competing theme system.

### 16.5 Dependency Boundaries

The intended dependency direction is:

``` text
apps/web
  ├── @cosmos/ui
  └── @cosmos/design-tokens

@cosmos/ui
  └── React (peer dependency)

@cosmos/design-tokens
  └── CSS token definitions
```

The application consumes both the UI package and the design-token
stylesheet. UI component styles reference the CSS custom properties
provided by the application's loaded token stylesheet.

The following boundaries apply:

1.  `packages/ui` must not depend on `apps/web`.
2.  `packages/ui` must not depend on feature modules.
3.  `packages/ui` must not contain Cosmos business logic.
4.  `packages/ui` must not depend on Next.js.
5.  Application components may consume `@cosmos/ui`.
6.  Feature components may consume `@cosmos/ui` through its public
    package interface.
7.  Shared UI components must not import application components or
    feature components.
8.  Design tokens must not depend on React or application code.
9.  Avoid a direct runtime dependency from `@cosmos/ui` to
    `@cosmos/design-tokens` when the UI package only references the
    token contract through CSS custom properties.

### 16.6 Public API and Component Composition

The UI package must expose components through explicit public exports.

-   Consumers should import supported components from the package's
    public entry point.
-   Internal implementation paths are not public APIs.
-   Avoid broad wildcard exports that unintentionally expose internals.
-   Export types deliberately when they are part of a component's
    supported contract.
-   Keep component composition predictable and document supported
    extension points.

Component APIs should expose meaningful semantic options rather than
unrestricted visual controls.

The initial customization contract may include:

-   `variant` for supported semantic appearances, such as primary,
    secondary or tertiary.
-   `size` for supported component sizes, such as small, medium or
    large.
-   Standard component states such as disabled and loading where
    applicable.
-   An optional `className` extension point where consumers need
    controlled styling composition.

Do not expose arbitrary color, spacing, typography or geometry props
that allow consumers to bypass the design system. Add component-specific
props only when they express meaningful behavior or semantics.

### 16.7 Accessibility Requirements

Accessibility is a foundational requirement, not a later enhancement.

Shared components must provide appropriate semantic HTML, accessible
names and relationships, keyboard interaction, visible focus treatment,
and correct disabled or state communication.

Interactive components must be designed and tested for keyboard use and
assistive technology. Components that manage focus, such as dialogs and
menus, must follow the relevant interaction patterns, including
appropriate focus entry, containment where required, and restoration.

The target is WCAG 2.2 AA. Individual components must meet the
requirements applicable to their role and behavior.

### 16.8 Initial Package Structure

The intended initial package organization is:

``` text
packages/ui/
├── package.json
├── tsconfig.json
└── src/
    ├── components/
    │   ├── button/
    │   ├── input/
    │   ├── dialog/
    │   ├── tooltip/
    │   └── ...
    ├── utilities/
    ├── types/
    └── index.ts
```

This is a starting organization, not a requirement to create every
directory or component immediately. Add component folders only when
those components are implemented.

The package must expose a deliberate public API and keep implementation
details private.

### 16.9 Implementation Status

The ownership model, technology choices, styling contract, dependency
boundaries, public API principles and accessibility target are approved
and documented.

The `packages/ui` implementation remains pending. No components, package
dependencies or application integrations are implied to exist until they
are explicitly implemented and validated.

------------------------------------------------------------------------

## 17. Current Implementation Status

Routing and navigation architecture has been approved and documented.
The corresponding route reorganization and navigation implementation
have not yet been performed.

The following foundational elements currently exist:

-   pnpm monorepo.
-   Turborepo task orchestration.
-   Next.js App Router application.
-   Shared design-token package.
-   Application configuration architecture.
-   Environment validation.
-   Foundational application directories.

The following are architectural targets and are not yet implemented:

-   Feature modules.
-   Shared UI package implementation (architecture approved and
    documented; package and components not yet implemented).
-   Shared types package implementation.
-   Shared tooling configuration package implementation.
-   Database infrastructure.
-   Authentication implementation.
-   External service integrations.

The architecture document defines intended boundaries; it does not claim
these systems already exist.

------------------------------------------------------------------------

**End of Architecture Document**
