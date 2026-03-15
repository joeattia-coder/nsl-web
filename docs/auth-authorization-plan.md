# Auth and Authorization Plan

## Goals

- Link every player profile to a user account over time.
- Support direct username/password login and social login through Google and Facebook.
- Support admin-created invitations for account setup.
- Separate broad responsibility roles from fine-grained permissions.
- Support scoped staff access for leagues, seasons, tournaments, and player self-service.

## Scope Model

Role assignments and permission overrides use these scopes:

- `GLOBAL`
- `LEAGUE`
- `SEASON`
- `TOURNAMENT`
- `PLAYER`

`scopeId` is stored as an empty string for global assignments.

## Admin Surface and Permission Catalog

### System

- `dashboard.view`
- `users.view`
- `users.create`
- `users.edit`
- `users.invite`
- `users.disable`
- `roles.view`
- `roles.manage`
- `permissions.view`
- `permissions.manage`

Recommended scope:

- `dashboard.view`: `GLOBAL`, `LEAGUE`, `TOURNAMENT`
- `users.*`: `GLOBAL`
- `roles.*`: `GLOBAL`
- `permissions.*`: `GLOBAL`

### League Management

- `leagues.view`
- `leagues.create`
- `leagues.edit`
- `leagues.delete`
- `seasons.view`
- `seasons.create`
- `seasons.edit`
- `seasons.delete`

Recommended scope:

- `leagues.*`: `GLOBAL` or `LEAGUE`
- `seasons.*`: `GLOBAL`, `LEAGUE`, `SEASON`

### Tournament Management

- `tournaments.view`
- `tournaments.create`
- `tournaments.edit`
- `tournaments.delete`
- `tournaments.publish`
- `stages.view`
- `stages.create`
- `stages.edit`
- `stages.delete`
- `rounds.view`
- `rounds.create`
- `rounds.edit`
- `rounds.delete`
- `groups.view`
- `groups.create`
- `groups.edit`
- `groups.delete`
- `entries.view`
- `entries.create`
- `entries.edit`
- `entries.delete`
- `matches.view`
- `matches.create`
- `matches.edit`
- `matches.delete`
- `matches.approve`

Recommended scope:

- `tournaments.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`
- `stages.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`
- `rounds.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`
- `groups.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`
- `entries.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`
- `matches.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`

### Player and Venue Management

- `players.view`
- `players.create`
- `players.edit`
- `players.delete`
- `players.invite`
- `venues.view`
- `venues.create`
- `venues.edit`
- `venues.delete`

Recommended scope:

- `players.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`
- `venues.*`: `GLOBAL`, `LEAGUE`, `SEASON`, `TOURNAMENT`

### Content Management

- `news.view`
- `news.create`
- `news.edit`
- `news.delete`
- `news.publish`
- `videos.view`
- `videos.create`
- `videos.edit`
- `videos.delete`

Recommended scope:

- `news.*`: `GLOBAL`
- `videos.*`: `GLOBAL`

### Self Service

- `profile.self.view`
- `profile.self.edit`
- `account.self.manage`

Recommended scope:

- `profile.self.*`: `PLAYER`
- `account.self.manage`: `PLAYER`

## Default Role Bundles

### Administrator

- Full access to all permissions.
- Usually assigned at `GLOBAL` scope.

### League Administrator

- `dashboard.view`
- `leagues.view`
- `leagues.edit`
- `seasons.view`
- `seasons.create`
- `seasons.edit`
- `seasons.delete`
- `tournaments.view`
- `tournaments.create`
- `tournaments.edit`
- `tournaments.delete`
- `tournaments.publish`
- `stages.view`
- `stages.create`
- `stages.edit`
- `stages.delete`
- `rounds.view`
- `rounds.create`
- `rounds.edit`
- `rounds.delete`
- `groups.view`
- `groups.create`
- `groups.edit`
- `groups.delete`
- `entries.view`
- `entries.create`
- `entries.edit`
- `entries.delete`
- `matches.view`
- `matches.create`
- `matches.edit`
- `matches.delete`
- `matches.approve`
- `players.view`
- `players.create`
- `players.edit`
- `players.invite`
- `venues.view`
- `venues.create`
- `venues.edit`

Recommended scope:

- `LEAGUE`

### League Operator

- `dashboard.view`
- `leagues.view`
- `seasons.view`
- `tournaments.view`
- `stages.view`
- `rounds.view`
- `groups.view`
- `entries.view`
- `entries.create`
- `entries.edit`
- `entries.delete`
- `matches.view`
- `matches.create`
- `matches.edit`
- `players.view`
- `venues.view`

Recommended scope:

- `LEAGUE`

### Tournament Administrator

- `dashboard.view`
- `tournaments.view`
- `tournaments.edit`
- `tournaments.delete`
- `tournaments.publish`
- `stages.view`
- `stages.create`
- `stages.edit`
- `stages.delete`
- `rounds.view`
- `rounds.create`
- `rounds.edit`
- `rounds.delete`
- `groups.view`
- `groups.create`
- `groups.edit`
- `groups.delete`
- `entries.view`
- `entries.create`
- `entries.edit`
- `entries.delete`
- `matches.view`
- `matches.create`
- `matches.edit`
- `matches.delete`
- `matches.approve`
- `players.view`
- `players.create`
- `players.edit`
- `players.invite`
- `venues.view`

Recommended scope:

- `TOURNAMENT`

### Tournament Operator

- `dashboard.view`
- `tournaments.view`
- `stages.view`
- `rounds.view`
- `groups.view`
- `entries.view`
- `entries.create`
- `entries.edit`
- `entries.delete`
- `matches.view`
- `matches.create`
- `matches.edit`
- `players.view`
- `venues.view`

Recommended scope:

- `TOURNAMENT`

### Player

- `profile.self.view`
- `profile.self.edit`
- `account.self.manage`

Recommended scope:

- `PLAYER`

## Data Model Summary

### Identity and Onboarding

- `User`: login identity, username, email, password metadata, verification timestamps.
- `Player`: domain profile for competition participation.
- `AuthAccount`: provider-backed auth identities for local, Google, and Facebook login.
- `Invitation`: admin-driven setup invites with one-time tokens.
- `EmailVerificationToken`: self-registration verification tokens.
- `PasswordResetToken`: password reset tokens.

### Authorization

- `Role`: broad responsibility presets such as Administrator or Tournament Operator.
- `Permission`: individual actions like `players.edit` or `news.publish`.
- `RolePermission`: many-to-many link between roles and permissions.
- `UserRoleAssignment`: scoped role grants for users.
- `UserPermissionOverride`: scoped allow or deny overrides for edge cases.

## Enforcement Rules

- The backend should authorize actions by permission, not by page name.
- Navigation visibility should derive from the same permission checks as the backend.
- Scoped assignments should be resolved against the active league, season, tournament, or player context.
- User permission overrides should be exceptional, not the default management path.
- Invitation links should act as the verification step for admin-created onboarding.