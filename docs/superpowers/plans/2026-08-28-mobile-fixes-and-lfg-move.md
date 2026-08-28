# Mobile Fixes and Moving "Looking for game" to Find Players Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four mobile UX issues — a redundant emoji picker, focus-zoom on inputs, a status modal trapped inside the nav drawer — and move "Looking for game" out of the status modal into a dedicated panel on the Find Players page, adding an optional free-text note.

**Architecture:** Frontend-only CSS/DOM fixes for tasks 1-3 (React portal for modals, a CSS media query, a Tailwind class change). Task 4 spans two repositories: the .NET backend (`Playr`) gets a new nullable `LookingForGameNote` column threaded through the domain entity, EF config, migration, DTOs, service and controller; the frontend (`Playr-Frontend`) gets the field added to its API types and a new `LookingForGamePanel` component that replaces the looking-for-game UI removed from `StatusModal`.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind (frontend), ASP.NET Core + EF Core + PostgreSQL (backend), Vitest + Testing Library (frontend tests), xUnit + FluentAssertions (backend tests).

## Global Constraints

- Backend note field: nullable, max 200 characters, trimmed; over-length input is rejected with `InvalidOperationException` (not truncated), matching `NormalizeOptionalText`'s existing behavior for `Bio`.
- The note must be cleared server-side whenever status changes away from `LookingForGame`.
- Emoji picker hidden below the `sm` (640px) breakpoint, everywhere it's used.
- Form control font-size floor of 16px applies only below 640px; desktop is unchanged.
- `StatusModal` no longer offers `LookingForGame` as a status option; that flow lives only on Find Players.
- No FluentValidation in this codebase — follow the existing house style (data annotations + service-side normalization).

---

## Part A — Backend (`C:\NoBackup\development\Playr`)

### Task A1: Add `LookingForGameNote` to the domain entity and EF configuration

**Files:**
- Modify: `src/Playr.Domain/Profiles/UserProfile.cs:22`
- Modify: `src/Playr.Infrastructure/Data/PlayrDbContext.cs:62-64`
- Test: `tests/Playr.Application.Tests/Profiles/ProfileServiceTests.cs` (new tests added in Task A4; this task has no test of its own — it's a data-shape change verified by compilation and the migration in Task A2)

**Interfaces:**
- Produces: `UserProfile.LookingForGameNote` (`string?`), a plain property later read/written by `ProfileService`.

- [ ] **Step 1: Add the property to `UserProfile`**

In `src/Playr.Domain/Profiles/UserProfile.cs`, change line 22 from:

```csharp
    public PlayStyle? LookingForPlayStyle { get; set; }
```

to:

```csharp
    public PlayStyle? LookingForPlayStyle { get; set; }
    public string? LookingForGameNote { get; set; }
```

- [ ] **Step 2: Configure the column**

In `src/Playr.Infrastructure/Data/PlayrDbContext.cs`, change lines 62-64 from:

```csharp
            profile.Property(p => p.LookingForPlayStyle)
                .HasConversion<string>()
                .HasMaxLength(32);
```

to:

```csharp
            profile.Property(p => p.LookingForPlayStyle)
                .HasConversion<string>()
                .HasMaxLength(32);
            profile.Property(p => p.LookingForGameNote).HasMaxLength(200);
```

- [ ] **Step 3: Build to confirm it compiles**

Run: `dotnet build C:\NoBackup\development\Playr\Playr.sln`
Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git -C C:\NoBackup\development\Playr add src/Playr.Domain/Profiles/UserProfile.cs src/Playr.Infrastructure/Data/PlayrDbContext.cs
git -C C:\NoBackup\development\Playr commit -m "Add LookingForGameNote to UserProfile entity and EF config"
```

---

### Task A2: Add the EF Core migration

**Files:**
- Create: `src/Playr.Infrastructure/Migrations/<timestamp>_AddLookingForGameNote.cs`
- Create: `src/Playr.Infrastructure/Migrations/<timestamp>_AddLookingForGameNote.Designer.cs` (generated)
- Modify: `src/Playr.Infrastructure/Migrations/PlayrDbContextModelSnapshot.cs` (generated)

**Interfaces:**
- Consumes: the `LookingForGameNote` property from Task A1.
- Produces: a `LookingForGameNote` column (`character varying(200)`, nullable) on `UserProfiles` in Postgres.

- [ ] **Step 1: Generate the migration**

Run (from the `Playr` repo root, using the `dotnet-ef` tool already used for prior migrations):

```powershell
dotnet ef migrations add AddLookingForGameNote --project src\Playr.Infrastructure --startup-project src\Playr.Api
```

Expected output ends with `Done.` and three files change: a new `<timestamp>_AddLookingForGameNote.cs`, its `.Designer.cs`, and an updated `PlayrDbContextModelSnapshot.cs`.

- [ ] **Step 2: Verify the generated migration body**

Open the new `<timestamp>_AddLookingForGameNote.cs` and confirm the `Up` method matches this shape (column name and type must match exactly; the timestamp in the class/file name will differ):

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<string>(
        name: "LookingForGameNote",
        table: "UserProfiles",
        type: "character varying(200)",
        maxLength: 200,
        nullable: true);
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropColumn(
        name: "LookingForGameNote",
        table: "UserProfiles");
}
```

If `dotnet ef` produced a different shape (e.g. missing `maxLength: 200`), edit the file to match.

- [ ] **Step 3: Apply the migration against the local dev database**

Run: `dotnet ef database update --project src\Playr.Infrastructure --startup-project src\Playr.Api`
Expected: `Done.` with no errors. (If the dev database isn't running, start it per `docker-compose.yml` / `start-dev.ps1` first.)

- [ ] **Step 4: Commit**

```bash
git -C C:\NoBackup\development\Playr add src/Playr.Infrastructure/Migrations
git -C C:\NoBackup\development\Playr commit -m "Add migration for LookingForGameNote column"
```

---

### Task A3: Thread `LookingForGameNote` through DTOs, commands and API models

**Files:**
- Modify: `src/Playr.Application/Profiles/ProfileDto.cs:19-20`
- Modify: `src/Playr.Application/Profiles/UpdateStatusCommand.cs:5-8`
- Modify: `src/Playr.Application/Profiles/LookingForGamePlayerDto.cs:12-13`
- Modify: `src/Playr.Api/Models/Profiles/ProfileResponse.cs:18-19`
- Modify: `src/Playr.Api/Models/Profiles/UpdateStatusRequest.cs:5-8`
- Modify: `src/Playr.Api/Models/Profiles/LookingForGamePlayerResponse.cs:11-12`
- Modify: `tests/Playr.Application.Tests/UnitTest1.cs` (fix the now-broken positional `ProfileDto` construction)

**Interfaces:**
- Produces: `ProfileDto` gains a `string? LookingForGameNote` parameter positioned right after `LookingForPlayStyle` and before the two optional trailing parameters (`RelationshipStatus`, `PendingInvitationId`). Same insertion point applies to `UpdateStatusCommand`, `LookingForGamePlayerDto`, `ProfileResponse`, `UpdateStatusRequest`, `LookingForGamePlayerResponse`.

- [ ] **Step 1: Update `ProfileDto`**

In `src/Playr.Application/Profiles/ProfileDto.cs`, change lines 19-23 from:

```csharp
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    RelationshipStatus? RelationshipStatus = null,
```

to:

```csharp
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    string? LookingForGameNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    RelationshipStatus? RelationshipStatus = null,
```

- [ ] **Step 2: Update `UpdateStatusCommand`**

Replace the full contents of `src/Playr.Application/Profiles/UpdateStatusCommand.cs` with:

```csharp
using Playr.Domain.Profiles;

namespace Playr.Application.Profiles;

public sealed record UpdateStatusCommand(
    ProfileStatus Status,
    Guid? LookingForGameId,
    PlayStyle? LookingForPlayStyle,
    string? LookingForGameNote);
```

- [ ] **Step 3: Update `LookingForGamePlayerDto`**

In `src/Playr.Application/Profiles/LookingForGamePlayerDto.cs`, change lines 11-14 from:

```csharp
    Guid? LookingForGameId,
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    RelationshipStatus RelationshipStatus,
```

to:

```csharp
    Guid? LookingForGameId,
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    string? LookingForGameNote,
    RelationshipStatus RelationshipStatus,
```

- [ ] **Step 4: Update `ProfileResponse`**

In `src/Playr.Api/Models/Profiles/ProfileResponse.cs`, change lines 18-22 from:

```csharp
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    string? RelationshipStatus = null,
```

to:

```csharp
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    string? LookingForGameNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    string? RelationshipStatus = null,
```

- [ ] **Step 5: Update `UpdateStatusRequest`**

Replace the full contents of `src/Playr.Api/Models/Profiles/UpdateStatusRequest.cs` with:

```csharp
using System.ComponentModel.DataAnnotations;
using Playr.Domain.Profiles;

namespace Playr.Api.Models.Profiles;

public sealed record UpdateStatusRequest(
    ProfileStatus Status,
    Guid? LookingForGameId,
    PlayStyle? LookingForPlayStyle,
    [property: StringLength(200)] string? LookingForGameNote);
```

- [ ] **Step 6: Update `LookingForGamePlayerResponse`**

In `src/Playr.Api/Models/Profiles/LookingForGamePlayerResponse.cs`, change lines 10-13 from:

```csharp
    Guid? LookingForGameId,
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    string RelationshipStatus,
```

to:

```csharp
    Guid? LookingForGameId,
    string? LookingForGameName,
    PlayStyle? LookingForPlayStyle,
    string? LookingForGameNote,
    string RelationshipStatus,
```

- [ ] **Step 7: Fix the broken positional `ProfileDto` construction in `UnitTest1.cs`**

`tests/Playr.Application.Tests/UnitTest1.cs` builds a `ProfileDto` positionally. Find the block (currently around the `Profile_contracts_expose_required_shapes` test):

```csharp
        var profile = new ProfileDto(
            Guid.NewGuid(),
            "player",
            "Player",
            "bio",
            "avatar",
            "region",
            languages,
            platforms,
            externalLinks,
            games,
            ProfileStatus.LookingForGame,
            null,
            null,
            null,
            createdAt,
            updatedAt);
```

Insert a new `null` argument for `LookingForGameNote` between the `LookingForPlayStyle` argument and `createdAt`:

```csharp
        var profile = new ProfileDto(
            Guid.NewGuid(),
            "player",
            "Player",
            "bio",
            "avatar",
            "region",
            languages,
            platforms,
            externalLinks,
            games,
            ProfileStatus.LookingForGame,
            null,
            null,
            null,
            null,
            createdAt,
            updatedAt);
```

- [ ] **Step 8: Build and run the application test project**

Run: `dotnet test C:\NoBackup\development\Playr\tests\Playr.Application.Tests\Playr.Application.Tests.csproj`
Expected: build succeeds, all tests pass (the `Profile_contracts_expose_required_shapes` test in particular).

- [ ] **Step 9: Commit**

```bash
git -C C:\NoBackup\development\Playr add src/Playr.Application/Profiles/ProfileDto.cs src/Playr.Application/Profiles/UpdateStatusCommand.cs src/Playr.Application/Profiles/LookingForGamePlayerDto.cs src/Playr.Api/Models/Profiles/ProfileResponse.cs src/Playr.Api/Models/Profiles/UpdateStatusRequest.cs src/Playr.Api/Models/Profiles/LookingForGamePlayerResponse.cs tests/Playr.Application.Tests/UnitTest1.cs
git -C C:\NoBackup\development\Playr commit -m "Thread LookingForGameNote through profile DTOs and API models"
```

---

### Task A4: Persist, validate and clear the note in `ProfileService`

**Files:**
- Modify: `src/Playr.Infrastructure/Profiles/ProfileService.cs:15-22` (constants), `:118-163` (`UpdateStatusAsync`), `:188-206` (`ToDto`), `:357-375` (list projection)
- Modify: `src/Playr.Api/Controllers/ProfilesController.cs:66-69` (command construction), `:115-133` (`ToResponse`), `:154-163` (list mapping)
- Test: `tests/Playr.Application.Tests/Profiles/ProfileServiceTests.cs`

**Interfaces:**
- Consumes: `UpdateStatusCommand` (Task A3), `UserProfile.LookingForGameNote` (Task A1).
- Produces: `ProfileService.UpdateStatusAsync` persists a trimmed, length-checked note when status is `LookingForGame`, and nulls it otherwise. `ToDto` and `GetLookingForGamePlayersAsync` include the note in their output.

Note: `ProfileServiceTests.cs` currently has no tests for `UpdateStatusAsync` — this task adds the first ones. It uses an EF Core InMemory or SQLite provider; check the top of the existing test file for the fixture pattern (a `PlayrDbContext` built against `UseInMemoryDatabase` is the established pattern in this codebase's other service test files — follow whatever `ProfileServiceTests.cs` already sets up for `UpdateCurrentUserAsync` tests).

- [ ] **Step 1: Read the existing test fixture setup**

Open `tests/Playr.Application.Tests/Profiles/ProfileServiceTests.cs` and note how it constructs `PlayrDbContext` and seeds a `UserProfile` for the `UpdateCurrentUserAsync` tests. Reuse that exact setup helper for the new tests below (do not invent a new one).

- [ ] **Step 2: Write the failing test — note is persisted and trimmed**

Add to `tests/Playr.Application.Tests/Profiles/ProfileServiceTests.cs`, following the file's existing test structure (async `Fact`, same DB/seed helper as the other tests in this file):

```csharp
[Fact]
public async Task UpdateStatusAsync_persists_trimmed_note_when_looking_for_game()
{
    var (service, dbContext, userId, gameId) = await CreateServiceWithSeededProfileAndGameAsync();

    var result = await service.UpdateStatusAsync(
        userId,
        new UpdateStatusCommand(ProfileStatus.LookingForGame, gameId, PlayStyle.Chill, "  need a 4th  "),
        CancellationToken.None);

    result.LookingForGameNote.Should().Be("need a 4th");
}
```

- [ ] **Step 3: Run it to verify it fails**

Run: `dotnet test C:\NoBackup\development\Playr\tests\Playr.Application.Tests\Playr.Application.Tests.csproj --filter UpdateStatusAsync_persists_trimmed_note_when_looking_for_game`
Expected: FAIL — either a compile error (`UpdateStatusCommand` doesn't yet take a 4th positional value... it does after Task A3, so this should instead fail because `LookingForGameNote` isn't set/trimmed yet) or an assertion failure showing the note is `null` or untrimmed.

- [ ] **Step 4: Implement note normalization and persistence**

In `src/Playr.Infrastructure/Profiles/ProfileService.cs`, add a constant near the others (lines 15-22):

```csharp
    private const int MaxLookingForNoteLength = 200;
```

Then in `UpdateStatusAsync` (currently lines 118-163), change the body so the note is normalized and persisted. Replace:

```csharp
    public async Task<ProfileDto> UpdateStatusAsync(Guid userId, UpdateStatusCommand command, CancellationToken cancellationToken)
    {
        if (command.Status == ProfileStatus.LookingForGame)
        {
            if (command.LookingForGameId is null)
            {
                throw new InvalidOperationException("A game is required when status is Looking for game.");
            }

            if (command.LookingForPlayStyle is null)
            {
                throw new InvalidOperationException("A play style is required when status is Looking for game.");
            }

            var gameExists = await dbContext.Games.AsNoTracking()
                .AnyAsync(g => g.Id == command.LookingForGameId, cancellationToken);
            if (!gameExists)
            {
                throw new InvalidOperationException("The selected game was not found.");
            }
        }

        var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Profile was not found.");

        profile.Status = command.Status;
        if (command.Status == ProfileStatus.LookingForGame)
        {
            profile.LookingForGameId = command.LookingForGameId;
            profile.LookingForPlayStyle = command.LookingForPlayStyle;
        }
        else
        {
            profile.LookingForGameId = null;
            profile.LookingForPlayStyle = null;
        }

        profile.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var reloaded = await dbContext.UserProfiles.AsNoTracking()
            .Include(p => p.LookingForGame)
            .FirstAsync(p => p.UserId == userId, cancellationToken);
        return ToDto(reloaded);
    }
```

with:

```csharp
    public async Task<ProfileDto> UpdateStatusAsync(Guid userId, UpdateStatusCommand command, CancellationToken cancellationToken)
    {
        string? note = null;
        if (command.Status == ProfileStatus.LookingForGame)
        {
            if (command.LookingForGameId is null)
            {
                throw new InvalidOperationException("A game is required when status is Looking for game.");
            }

            if (command.LookingForPlayStyle is null)
            {
                throw new InvalidOperationException("A play style is required when status is Looking for game.");
            }

            var gameExists = await dbContext.Games.AsNoTracking()
                .AnyAsync(g => g.Id == command.LookingForGameId, cancellationToken);
            if (!gameExists)
            {
                throw new InvalidOperationException("The selected game was not found.");
            }

            note = NormalizeOptionalText(command.LookingForGameNote, "Looking for game note", MaxLookingForNoteLength);
        }

        var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Profile was not found.");

        profile.Status = command.Status;
        if (command.Status == ProfileStatus.LookingForGame)
        {
            profile.LookingForGameId = command.LookingForGameId;
            profile.LookingForPlayStyle = command.LookingForPlayStyle;
            profile.LookingForGameNote = note;
        }
        else
        {
            profile.LookingForGameId = null;
            profile.LookingForPlayStyle = null;
            profile.LookingForGameNote = null;
        }

        profile.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var reloaded = await dbContext.UserProfiles.AsNoTracking()
            .Include(p => p.LookingForGame)
            .FirstAsync(p => p.UserId == userId, cancellationToken);
        return ToDto(reloaded);
    }
```

Then update `ToDto` (currently lines 188-206). Change:

```csharp
    private static ProfileDto ToDto(UserProfile profile, RelationshipStatus? relationshipStatus = null, Guid? pendingInvitationId = null) => new(
        profile.UserId,
        profile.Username,
        profile.DisplayName,
        profile.Bio,
        profile.AvatarUrl,
        profile.Region,
        profile.Languages,
        profile.Platforms,
        profile.ExternalLinks,
        profile.CurrentlyPlayingGames,
        profile.Status,
        profile.LookingForGameId,
        profile.LookingForGame?.Name,
        profile.LookingForPlayStyle,
        profile.CreatedAt,
        profile.UpdatedAt,
        relationshipStatus,
        pendingInvitationId);
```

to:

```csharp
    private static ProfileDto ToDto(UserProfile profile, RelationshipStatus? relationshipStatus = null, Guid? pendingInvitationId = null) => new(
        profile.UserId,
        profile.Username,
        profile.DisplayName,
        profile.Bio,
        profile.AvatarUrl,
        profile.Region,
        profile.Languages,
        profile.Platforms,
        profile.ExternalLinks,
        profile.CurrentlyPlayingGames,
        profile.Status,
        profile.LookingForGameId,
        profile.LookingForGame?.Name,
        profile.LookingForPlayStyle,
        profile.LookingForGameNote,
        profile.CreatedAt,
        profile.UpdatedAt,
        relationshipStatus,
        pendingInvitationId);
```

Finally update the `GetLookingForGamePlayersAsync` projection (currently lines 357-375). Change:

```csharp
            return new LookingForGamePlayerDto(
                p.UserId,
                p.Username,
                p.DisplayName,
                p.AvatarUrl,
                p.LookingForGameId,
                p.LookingForGame?.Name,
                p.LookingForPlayStyle,
                friendSet.Contains(p.UserId)
                    ? RelationshipStatus.Friends
                    : pending is not null
                        ? RelationshipStatus.InvitePending
                        : RelationshipStatus.None,
                cancellableId);
```

to:

```csharp
            return new LookingForGamePlayerDto(
                p.UserId,
                p.Username,
                p.DisplayName,
                p.AvatarUrl,
                p.LookingForGameId,
                p.LookingForGame?.Name,
                p.LookingForPlayStyle,
                p.LookingForGameNote,
                friendSet.Contains(p.UserId)
                    ? RelationshipStatus.Friends
                    : pending is not null
                        ? RelationshipStatus.InvitePending
                        : RelationshipStatus.None,
                cancellableId);
```

- [ ] **Step 5: Update the controller to pass the note through**

In `src/Playr.Api/Controllers/ProfilesController.cs`, change line 68 from:

```csharp
                new UpdateStatusCommand(request.Status, request.LookingForGameId, request.LookingForPlayStyle),
```

to:

```csharp
                new UpdateStatusCommand(request.Status, request.LookingForGameId, request.LookingForPlayStyle, request.LookingForGameNote),
```

Change `ToResponse` (lines 115-133) — insert `profile.LookingForGameNote` after `profile.LookingForPlayStyle`:

```csharp
    private static ProfileResponse ToResponse(ProfileDto profile) => new(
        profile.UserId,
        profile.Username,
        profile.DisplayName,
        profile.Bio,
        profile.AvatarUrl,
        profile.Region,
        profile.Languages,
        profile.Platforms,
        profile.ExternalLinks,
        profile.CurrentlyPlayingGames,
        profile.Status,
        profile.LookingForGameId,
        profile.LookingForGameName,
        profile.LookingForPlayStyle,
        profile.LookingForGameNote,
        profile.CreatedAt,
        profile.UpdatedAt,
        profile.RelationshipStatus?.ToString(),
        profile.PendingInvitationId);
```

Change the `GetLookingForGamePlayers` mapping (lines 154-163):

```csharp
        return Ok(players.Select(p => new LookingForGamePlayerResponse(
            p.UserId,
            p.Username,
            p.DisplayName,
            p.AvatarUrl,
            p.LookingForGameId,
            p.LookingForGameName,
            p.LookingForPlayStyle,
            p.LookingForGameNote,
            p.RelationshipStatus.ToString(),
            p.PendingInvitationId)).ToList());
```

- [ ] **Step 6: Run the new test to verify it passes**

Run: `dotnet test C:\NoBackup\development\Playr\tests\Playr.Application.Tests\Playr.Application.Tests.csproj --filter UpdateStatusAsync_persists_trimmed_note_when_looking_for_game`
Expected: PASS

- [ ] **Step 7: Write and run the remaining `UpdateStatusAsync` note tests**

Add three more tests to `ProfileServiceTests.cs`, each using the same seeded-profile helper:

```csharp
[Fact]
public async Task UpdateStatusAsync_rejects_note_over_max_length()
{
    var (service, _, userId, gameId) = await CreateServiceWithSeededProfileAndGameAsync();
    var overLong = new string('a', 201);

    var act = () => service.UpdateStatusAsync(
        userId,
        new UpdateStatusCommand(ProfileStatus.LookingForGame, gameId, PlayStyle.Competitive, overLong),
        CancellationToken.None);

    await act.Should().ThrowAsync<InvalidOperationException>()
        .WithMessage("Looking for game note cannot be longer than 200 characters.");
}

[Fact]
public async Task UpdateStatusAsync_stores_null_note_when_not_provided()
{
    var (service, _, userId, gameId) = await CreateServiceWithSeededProfileAndGameAsync();

    var result = await service.UpdateStatusAsync(
        userId,
        new UpdateStatusCommand(ProfileStatus.LookingForGame, gameId, PlayStyle.Competitive, null),
        CancellationToken.None);

    result.LookingForGameNote.Should().BeNull();
}

[Fact]
public async Task UpdateStatusAsync_clears_note_when_status_changes_away_from_looking_for_game()
{
    var (service, _, userId, gameId) = await CreateServiceWithSeededProfileAndGameAsync();
    await service.UpdateStatusAsync(
        userId,
        new UpdateStatusCommand(ProfileStatus.LookingForGame, gameId, PlayStyle.Chill, "need a 4th"),
        CancellationToken.None);

    var result = await service.UpdateStatusAsync(
        userId,
        new UpdateStatusCommand(ProfileStatus.Online, null, null, null),
        CancellationToken.None);

    result.LookingForGameNote.Should().BeNull();
}
```

Run: `dotnet test C:\NoBackup\development\Playr\tests\Playr.Application.Tests\Playr.Application.Tests.csproj --filter "FullyQualifiedName~ProfileServiceTests"`
Expected: PASS for all `ProfileServiceTests`, including the four new ones.

- [ ] **Step 8: Build the whole solution**

Run: `dotnet build C:\NoBackup\development\Playr\Playr.sln`
Expected: `Build succeeded.`

- [ ] **Step 9: Commit**

```bash
git -C C:\NoBackup\development\Playr add src/Playr.Infrastructure/Profiles/ProfileService.cs src/Playr.Api/Controllers/ProfilesController.cs tests/Playr.Application.Tests/Profiles/ProfileServiceTests.cs
git -C C:\NoBackup\development\Playr commit -m "Persist, validate and clear LookingForGameNote in ProfileService"
```

---

### Task A5: Update the API contract integration test and run the full backend suite

**Files:**
- Modify: `tests/Playr.IntegrationTests/ProfileEndpointConfigurationTests.cs:44-58` (add an assertion for the new response property)

**Interfaces:**
- Consumes: `ProfileResponse` (Task A3).

Note: `ThrowingProfileService` in this file implements `IProfileService`; since `IProfileService`'s method signatures are unchanged (only record parameter lists changed), this stub does not need modification.

- [ ] **Step 1: Add an assertion for the new response property**

In `tests/Playr.IntegrationTests/ProfileEndpointConfigurationTests.cs`, after line 58 (`profileResponse.GetProperty("UpdatedAt")!.PropertyType.Should().Be(typeof(DateTimeOffset));`), add:

```csharp
        profileResponse.GetProperty("LookingForGameNote")!.PropertyType.Should().Be(typeof(string));
```

- [ ] **Step 2: Run the integration test project**

Run: `dotnet test C:\NoBackup\development\Playr\tests\Playr.IntegrationTests\Playr.IntegrationTests.csproj`
Expected: all tests pass, including `Profile_api_contract_contains_required_models_and_controller_metadata`.

- [ ] **Step 3: Run the full backend solution test suite**

Run: `dotnet test C:\NoBackup\development\Playr\Playr.sln`
Expected: all tests across all projects pass.

- [ ] **Step 4: Commit**

```bash
git -C C:\NoBackup\development\Playr add tests/Playr.IntegrationTests/ProfileEndpointConfigurationTests.cs
git -C C:\NoBackup\development\Playr commit -m "Assert LookingForGameNote in the profile API contract test"
```

---

## Part B — Frontend (`C:\NoBackup\development\Playr-Frontend`)

### Task B1: Hide the emoji picker button below the `sm` breakpoint

**Files:**
- Modify: `src/components/EmojiPickerButton.tsx:30`
- Test: `src/components/EmojiPickerButton.test.tsx` (new file)

**Interfaces:**
- No signature change; `EmojiPickerButton` keeps its existing `{ onSelect: (emoji: string) => void }` props.

- [ ] **Step 1: Write the failing test**

Create `src/components/EmojiPickerButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmojiPickerButton } from './EmojiPickerButton'

describe('EmojiPickerButton', () => {
  it('is hidden below the sm breakpoint and shown from sm up', () => {
    render(<EmojiPickerButton onSelect={vi.fn()} />)

    const wrapper = screen.getByLabelText('Add emoji').parentElement!
    expect(wrapper.className).toContain('hidden')
    expect(wrapper.className).toContain('sm:block')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/components/EmojiPickerButton.test.tsx`
Expected: FAIL — `wrapper.className` does not contain `hidden` (current class is just `relative`).

- [ ] **Step 3: Update the component**

In `src/components/EmojiPickerButton.tsx`, change line 30 from:

```tsx
    <div className="relative" ref={containerRef}>
```

to:

```tsx
    <div className="relative hidden sm:block" ref={containerRef}>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/EmojiPickerButton.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/EmojiPickerButton.tsx src/components/EmojiPickerButton.test.tsx
git commit -m "Hide emoji picker button below the sm breakpoint"
```

---

### Task B2: Stop focus-zoom on mobile form inputs

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- None — pure CSS, no component API changes.

This is a CSS-only, environment-dependent behavior (iOS zoom-on-focus) that isn't practically assertable in jsdom. No automated test is added; verify manually per Step 3.

- [ ] **Step 1: Add the media query**

In `src/index.css`, after the existing `body { ... }` block (ends at line 59), add:

```css

@media (max-width: 639px) {
  input,
  textarea,
  select {
    font-size: 16px;
  }
}
```

- [ ] **Step 2: Run the frontend build to confirm no CSS errors**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manual verification note**

Record in the commit message (not code) that this should be manually verified on an iOS device or simulator: focusing the chat input, search input, and login fields at a viewport width under 640px should no longer trigger zoom.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "Set 16px minimum font-size on mobile form inputs to prevent iOS zoom-on-focus"
```

---

### Task B3: Render `Modal` in a portal to `document.body`

**Files:**
- Modify: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/Modal.test.tsx`

**Interfaces:**
- No prop changes to `Modal`. `screen.*` queries in tests continue to work unchanged since Testing Library queries `document.body`.

- [ ] **Step 1: Write the failing test — modal renders as a direct child of `document.body`**

In `src/components/ui/Modal.test.tsx`, add this test inside the existing `describe('Modal', ...)` block:

```tsx
  it('renders into a portal attached to document.body, not an ancestor node', () => {
    const { container } = render(
      <div data-testid="transformed-ancestor" style={{ transform: 'translateX(0)' }}>
        <Modal title="Settings" onClose={vi.fn()}>
          <p>Body</p>
        </Modal>
      </div>,
    )

    const heading = screen.getByRole('heading', { name: 'Settings' })
    expect(container.contains(heading)).toBe(false)
    expect(document.body.contains(heading)).toBe(true)
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/components/ui/Modal.test.tsx`
Expected: FAIL — `container.contains(heading)` is `true` because the modal currently renders inline.

- [ ] **Step 3: Add the portal**

Replace the full contents of `src/components/ui/Modal.tsx` with:

```tsx
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'
import { useOverlayDismiss } from '../../lib/useOverlayDismiss'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

export function Modal({ title, onClose, children, maxWidthClassName = 'max-w-md' }: ModalProps) {
  useBodyScrollLock()
  const { backdropProps } = useOverlayDismiss({ onDismiss: onClose })

  return createPortal(
    <div
      // items-start on mobile: centring tall content pushes it off *both* the
      // top and the bottom of a short viewport, making it unreachable.
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 cursor-pointer sm:items-center"
      {...backdropProps}
    >
      <div
        className={`my-auto flex max-h-[90svh] w-full ${maxWidthClassName} cursor-default flex-col overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-5`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  )
}
```

The only changes from the original are the `createPortal` import, wrapping the returned JSX tree, and passing `document.body` as the portal target instead of returning the tree directly.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/ui/Modal.test.tsx`
Expected: PASS — all tests in the file, including the new one and the four pre-existing ones (`constrains its height...`, `locks background scroll...`, `closes on the close button`, `does not close when interacting with its content`, `closes on Escape`).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Modal.tsx src/components/ui/Modal.test.tsx
git commit -m "Render Modal into a document.body portal to escape transformed ancestors"
```

---

### Task B4: Add `lookingForGameNote` to the frontend API layer

**Files:**
- Modify: `src/api/profilesApi.ts:8-27` (`ProfileData`), `:39-43` (`UpdateStatusData`), `:131-141` (`LookingForGamePlayer`)
- Modify: `src/context/StatusContext.tsx`

**Interfaces:**
- Produces: `ProfileData.lookingForGameNote: string | null`, `UpdateStatusData.lookingForGameNote?: string | null`, `LookingForGamePlayer.lookingForGameNote: string | null`.
- Produces: `StatusContextValue.lookingForGameNote: string | null` and `updateStatus(status, lookingForGameId?, lookingForPlayStyle?, lookingForGameNote?)`.
- Consumes: backend fields added in Part A (this task assumes Part A is deployed to whatever backend the frontend dev server points at; if not yet deployed, the new field is simply `undefined`/`null` from the API and the code below still works, it just has nothing to display).

This task is a pure type/plumbing change with no independently interesting behavior to unit-test in isolation — it's exercised end-to-end by Task B6 and B7's tests. No new test file is added here; correctness is checked by `tsc` in Step 3.

- [ ] **Step 1: Update `ProfileData`, `UpdateStatusData`, and `LookingForGamePlayer` in `profilesApi.ts`**

In `src/api/profilesApi.ts`, change lines 19-22 (inside `ProfileData`) from:

```typescript
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  createdAt: string
```

to:

```typescript
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  lookingForGameNote: string | null
  createdAt: string
```

Change lines 39-43 (`UpdateStatusData`) from:

```typescript
export interface UpdateStatusData {
  status: ProfileStatus
  lookingForGameId?: string | null
  lookingForPlayStyle?: PlayStyle | null
}
```

to:

```typescript
export interface UpdateStatusData {
  status: ProfileStatus
  lookingForGameId?: string | null
  lookingForPlayStyle?: PlayStyle | null
  lookingForGameNote?: string | null
}
```

Change lines 136-138 (inside `LookingForGamePlayer`) from:

```typescript
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
```

to:

```typescript
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  lookingForGameNote: string | null
```

- [ ] **Step 2: Update `StatusContext`**

Replace the full contents of `src/context/StatusContext.tsx` with:

```tsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getProfile, updateProfileStatus, type PlayStyle, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from './AuthContext'

export interface StatusContextValue {
  status: ProfileStatus
  avatarUrl: string | null
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  lookingForGameNote: string | null
  isLoading: boolean
  updateStatus: (
    status: ProfileStatus,
    lookingForGameId?: string | null,
    lookingForPlayStyle?: PlayStyle | null,
    lookingForGameNote?: string | null,
  ) => Promise<void>
}

const StatusContext = createContext<StatusContextValue | null>(null)

export function StatusProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [status, setStatus] = useState<ProfileStatus>('Online')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [lookingForGameId, setLookingForGameId] = useState<string | null>(null)
  const [lookingForGameName, setLookingForGameName] = useState<string | null>(null)
  const [lookingForPlayStyle, setLookingForPlayStyle] = useState<PlayStyle | null>(null)
  const [lookingForGameNote, setLookingForGameNote] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      if (!user) {
        setStatus('Online')
        setAvatarUrl(null)
        setLookingForGameId(null)
        setLookingForGameName(null)
        setLookingForPlayStyle(null)
        setLookingForGameNote(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const profile = await getProfile(user.username)
        if (!cancelled) {
          setStatus(profile.status)
          setAvatarUrl(profile.avatarUrl)
          setLookingForGameId(profile.lookingForGameId)
          setLookingForGameName(profile.lookingForGameName)
          setLookingForPlayStyle(profile.lookingForPlayStyle)
          setLookingForGameNote(profile.lookingForGameNote)
        }
      } catch {
        // Keep defaults if the profile can't be loaded.
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [user])

  const updateStatus = useCallback(
    async (
      newStatus: ProfileStatus,
      newLookingForGameId?: string | null,
      newLookingForPlayStyle?: PlayStyle | null,
      newLookingForGameNote?: string | null,
    ) => {
      if (!token) {
        throw new Error('You must be logged in to update your status.')
      }

      const profile = await updateProfileStatus(token, {
        status: newStatus,
        lookingForGameId: newLookingForGameId ?? null,
        lookingForPlayStyle: newLookingForPlayStyle ?? null,
        lookingForGameNote: newLookingForGameNote ?? null,
      })

      setStatus(profile.status)
      setAvatarUrl(profile.avatarUrl)
      setLookingForGameId(profile.lookingForGameId)
      setLookingForGameName(profile.lookingForGameName)
      setLookingForPlayStyle(profile.lookingForPlayStyle)
      setLookingForGameNote(profile.lookingForGameNote)
    },
    [token],
  )

  return (
    <StatusContext.Provider
      value={{
        status,
        avatarUrl,
        lookingForGameId,
        lookingForGameName,
        lookingForPlayStyle,
        lookingForGameNote,
        isLoading,
        updateStatus,
      }}
    >
      {children}
    </StatusContext.Provider>
  )
}

export function useStatus(): StatusContextValue {
  const context = useContext(StatusContext)
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider')
  }
  return context
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: no errors. (This will surface any other call site that constructs `ProfileData`/`LookingForGamePlayer`/`UpdateStatusData` object literals missing the new field — fix any such call site by adding `lookingForGameNote: null` or the appropriate value before proceeding.)

- [ ] **Step 4: Commit**

```bash
git add src/api/profilesApi.ts src/context/StatusContext.tsx
git commit -m "Add lookingForGameNote to profile API types and StatusContext"
```

---

### Task B5: Simplify `StatusModal` — remove the looking-for-game flow

**Files:**
- Modify: `src/components/ui/StatusModal.tsx`
- Modify: `src/components/layout/Sidebar.test.tsx` (its `useStatus` mock already includes the fields this task needs — verify no change needed after Step 4)
- Test: `src/components/ui/StatusModal.test.tsx` (new file)

**Interfaces:**
- Consumes: `useStatus()` (Task B4).
- Produces: `StatusModal` still takes `{ onClose: () => void }` — no external signature change. Internally it no longer renders a game `Select` or play-style buttons, and calls `updateStatus(selectedStatus, null, null, null)`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/StatusModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusModal } from './StatusModal'
import { __resetBodyScrollLock } from '../../lib/useBodyScrollLock'
import { afterEach } from 'vitest'

const updateStatus = vi.fn().mockResolvedValue(undefined)

vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    lookingForGameId: null,
    lookingForPlayStyle: null,
    lookingForGameNote: null,
    updateStatus,
  }),
}))

afterEach(() => {
  __resetBodyScrollLock()
  document.body.removeAttribute('style')
  updateStatus.mockClear()
})

describe('StatusModal', () => {
  it('does not offer Looking for game as a status option', () => {
    render(<StatusModal onClose={vi.fn()} />)

    expect(screen.queryByText('Looking for game')).not.toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('Busy')).toBeInTheDocument()
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('saves with null game and play style fields', async () => {
    const user = userEvent.setup()
    render(<StatusModal onClose={vi.fn()} />)

    await user.click(screen.getByText('Busy'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateStatus).toHaveBeenCalledWith('Busy', null, null, null)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/components/ui/StatusModal.test.tsx`
Expected: FAIL — `screen.queryByText('Looking for game')` currently finds a match, and `updateStatus` is currently called with 3 arguments (missing the note).

- [ ] **Step 3: Simplify the component**

Replace the full contents of `src/components/ui/StatusModal.tsx` with:

```tsx
import { useState } from 'react'
import { Moon, Circle, EyeOff } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
import type { ProfileStatus } from '../../api/profilesApi'
import { useStatus } from '../../context/StatusContext'

interface StatusModalProps {
  onClose: () => void
}

const statusOptions: { value: ProfileStatus; label: string; description: string; icon: typeof Circle }[] = [
  { value: 'Online', label: 'Online', description: 'Visible and available', icon: Circle },
  { value: 'Busy', label: 'Busy', description: "Online, but don't disturb", icon: Moon },
  { value: 'Offline', label: 'Offline', description: 'Appear offline to others', icon: EyeOff },
]

export function StatusModal({ onClose }: StatusModalProps) {
  const { status, updateStatus } = useStatus()

  const [selectedStatus, setSelectedStatus] = useState<ProfileStatus>(
    status === 'LookingForGame' ? 'Online' : status,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    setIsSaving(true)
    try {
      await updateStatus(selectedStatus, null, null, null)
      onClose()
    } catch {
      setError('Failed to update status. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal title="Set your status" onClose={onClose}>
      {status === 'LookingForGame' && (
        <p className="mb-3 rounded-lg border border-border bg-surface-raised p-3 text-xs text-muted">
          You're looking for a game. Manage that on Find Players.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {statusOptions.map(({ value, label, description, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelectedStatus(value)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
              selectedStatus === value
                ? 'border-primary bg-surface-raised'
                : 'border-border hover:bg-surface-raised'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <span>
              <span className="block text-sm font-medium text-text">{label}</span>
              <span className="block text-xs text-muted">{description}</span>
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-frustrated">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/ui/StatusModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Update the `Sidebar.test.tsx` `useStatus` mock**

The mock in `src/components/layout/Sidebar.test.tsx` (lines 14-24) needs `lookingForGameNote` added for type/shape consistency with the real context. Change:

```tsx
vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    avatarUrl: null,
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    isLoading: false,
    updateStatus: vi.fn(),
  }),
}))
```

to:

```tsx
vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    avatarUrl: null,
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    lookingForGameNote: null,
    isLoading: false,
    updateStatus: vi.fn(),
  }),
}))
```

- [ ] **Step 6: Run the full frontend test suite**

Run: `npm test`
Expected: all tests pass, including `Sidebar.test.tsx`, `StatusModal.test.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/StatusModal.tsx src/components/ui/StatusModal.test.tsx src/components/layout/Sidebar.test.tsx
git commit -m "Remove Looking for game flow from StatusModal"
```

---

### Task B6: Build `LookingForGamePanel` and integrate it into Find Players

**Files:**
- Create: `src/components/LookingForGamePanel.tsx`
- Create: `src/components/LookingForGamePanel.test.tsx`
- Modify: `src/pages/FindPlayersPage.tsx`
- Modify: `src/pages/FindPlayersPage.test.tsx`

**Interfaces:**
- Consumes: `useStatus()` (Task B4: `status`, `lookingForGameId`, `lookingForGameName`, `lookingForPlayStyle`, `lookingForGameNote`, `updateStatus`), `getGames()` from `src/api/gamesApi.ts` (`Promise<Game[]>`, `Game = { id, name, coverImageUrl, genre }`), `Select` from `src/components/ui/Select.tsx` (`{ options: SelectOption[], value: string, onChange: (value: string) => void, placeholder?, id? }`).
- Produces: `LookingForGamePanel({ onChanged: () => void })` — a default-exported-free named export `LookingForGamePanel`. Calls `onChanged()` after a successful start or stop.

- [ ] **Step 1: Write the failing tests**

Create `src/components/LookingForGamePanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LookingForGamePanel } from './LookingForGamePanel'
import * as gamesApi from '../api/gamesApi'

vi.mock('../api/gamesApi')

const updateStatus = vi.fn().mockResolvedValue(undefined)
const statusState = vi.hoisted(() => ({
  status: 'Online' as const,
  lookingForGameId: null as string | null,
  lookingForGameName: null as string | null,
  lookingForPlayStyle: null as string | null,
  lookingForGameNote: null as string | null,
}))

vi.mock('../context/StatusContext', () => ({
  useStatus: () => ({ ...statusState, updateStatus }),
}))

const games: gamesApi.Game[] = [
  { id: 'game-1', name: 'Apex Legends', coverImageUrl: null, genre: null },
]

beforeEach(() => {
  vi.mocked(gamesApi.getGames).mockResolvedValue(games)
  statusState.status = 'Online'
  statusState.lookingForGameId = null
  statusState.lookingForGameName = null
  statusState.lookingForPlayStyle = null
  statusState.lookingForGameNote = null
})

afterEach(() => {
  updateStatus.mockClear()
})

describe('LookingForGamePanel', () => {
  it('starts looking for a game with a game, play style and note', async () => {
    const user = userEvent.setup()
    const onChanged = vi.fn()
    render(<LookingForGamePanel onChanged={onChanged} />)

    await waitFor(() => expect(screen.getByText('Select a game')).toBeInTheDocument())
    await user.click(screen.getByText('Select a game'))
    await user.click(screen.getByRole('option', { name: 'Apex Legends' }))
    await user.click(screen.getByRole('button', { name: 'Competitive' }))
    await user.type(screen.getByPlaceholderText('Anything specific? (optional)'), 'need a 4th')
    await user.click(screen.getByRole('button', { name: 'Start looking' }))

    await waitFor(() =>
      expect(updateStatus).toHaveBeenCalledWith('LookingForGame', 'game-1', 'Competitive', 'need a 4th'),
    )
    expect(onChanged).toHaveBeenCalled()
  })

  it('shows an error when starting without a game and play style', async () => {
    const user = userEvent.setup()
    render(<LookingForGamePanel onChanged={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Start looking' }))

    expect(screen.getByText('Choose a game and a play style.')).toBeInTheDocument()
    expect(updateStatus).not.toHaveBeenCalled()
  })

  it('shows the active search and stops it', async () => {
    statusState.status = 'LookingForGame'
    statusState.lookingForGameId = 'game-1'
    statusState.lookingForGameName = 'Apex Legends'
    statusState.lookingForPlayStyle = 'Competitive'
    statusState.lookingForGameNote = 'need a 4th'

    const user = userEvent.setup()
    const onChanged = vi.fn()
    render(<LookingForGamePanel onChanged={onChanged} />)

    expect(screen.getByText('Apex Legends')).toBeInTheDocument()
    expect(screen.getByText('need a 4th')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stop looking' }))

    await waitFor(() => expect(updateStatus).toHaveBeenCalledWith('Online', null, null, null))
    expect(onChanged).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/components/LookingForGamePanel.test.tsx`
Expected: FAIL — the module `../components/LookingForGamePanel` does not exist yet.

- [ ] **Step 3: Implement `LookingForGamePanel`**

Create `src/components/LookingForGamePanel.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { getGames, type Game } from '../api/gamesApi'
import type { PlayStyle } from '../api/profilesApi'
import { useStatus } from '../context/StatusContext'

interface LookingForGamePanelProps {
  onChanged: () => void
}

const playStyleOptions: { value: PlayStyle; label: string; description: string }[] = [
  { value: 'Competitive', label: 'Competitive', description: 'Ranked, sweaty, trying to win' },
  { value: 'Chill', label: 'Chill', description: 'Casual, relaxed, just for fun' },
]

const MAX_NOTE_LENGTH = 200

export function LookingForGamePanel({ onChanged }: LookingForGamePanelProps) {
  const {
    status,
    lookingForGameId,
    lookingForGameName,
    lookingForPlayStyle,
    lookingForGameNote,
    updateStatus,
  } = useStatus()

  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedPlayStyle, setSelectedPlayStyle] = useState<PlayStyle | null>(null)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getGames()
      .then((result) => {
        if (!cancelled) setGames(result)
      })
      .catch(() => {
        if (!cancelled) setGames([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isActive = status === 'LookingForGame'

  async function handleStart() {
    setError(null)
    if (!selectedGameId || !selectedPlayStyle) {
      setError('Choose a game and a play style.')
      return
    }

    setIsSaving(true)
    try {
      await updateStatus('LookingForGame', selectedGameId, selectedPlayStyle, note.trim() || null)
      setSelectedGameId(null)
      setSelectedPlayStyle(null)
      setNote('')
      onChanged()
    } catch {
      setError('Failed to start looking for a game. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStop() {
    setError(null)
    setIsSaving(true)
    try {
      await updateStatus('Online', null, null, null)
      onChanged()
    } catch {
      setError('Failed to stop looking for a game. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isActive) {
    return (
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-text">You're looking for a game</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {lookingForGameName && <Badge variant="tag">{lookingForGameName}</Badge>}
            {lookingForPlayStyle && (
              <Badge variant={lookingForPlayStyle === 'Competitive' ? 'need-help' : 'enjoying'}>
                {lookingForPlayStyle}
              </Badge>
            )}
          </div>
          {lookingForGameNote && <p className="mt-2 text-sm text-muted">{lookingForGameNote}</p>}
        </div>
        {error && <p className="text-sm text-frustrated">{error}</p>}
        <div>
          <Button variant="secondary" onClick={handleStop} disabled={isSaving}>
            {isSaving ? 'Stopping...' : 'Stop looking'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-text">Looking for a game?</p>

      <div>
        <label htmlFor="lfg-game" className="mb-1 block text-xs font-medium text-muted">
          Game
        </label>
        <Select
          id="lfg-game"
          value={selectedGameId ?? ''}
          onChange={(val) => setSelectedGameId(val || null)}
          placeholder="Select a game"
          options={games.map((game) => ({ value: game.id, label: game.name }))}
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-muted">Play style</span>
        <div className="flex gap-2">
          {playStyleOptions.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedPlayStyle(value)}
              title={description}
              className={`flex-1 rounded-lg border p-2 text-center text-sm font-medium transition-colors cursor-pointer ${
                selectedPlayStyle === value
                  ? 'border-primary bg-surface-raised text-text'
                  : 'border-border text-muted hover:bg-surface-raised'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="lfg-note" className="mb-1 block text-xs font-medium text-muted">
          Note
        </label>
        <input
          id="lfg-note"
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, MAX_NOTE_LENGTH))}
          placeholder="Anything specific? (optional)"
          className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <p className="mt-1 text-right text-xs text-muted">{note.length}/{MAX_NOTE_LENGTH}</p>
      </div>

      {error && <p className="text-sm text-frustrated">{error}</p>}

      <div>
        <Button onClick={handleStart} disabled={isSaving}>
          {isSaving ? 'Starting...' : 'Start looking'}
        </Button>
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/LookingForGamePanel.test.tsx`
Expected: PASS for all three tests.

- [ ] **Step 5: Integrate the panel into `FindPlayersPage` and show the note on player cards**

In `src/pages/FindPlayersPage.tsx`, add the import (near the top, after the `InviteModal` import at line 8):

```tsx
import { LookingForGamePanel } from '../components/LookingForGamePanel'
```

Insert `<LookingForGamePanel onChanged={loadPlayers} />` right after the header block (after the closing `</div>` of the header at line 95, before the `{successMessage && (...)}` block):

```tsx
      </div>

      <LookingForGamePanel onChanged={loadPlayers} />

      {successMessage && (
```

Add the note under the existing badges block. Change lines 125-137 from:

```tsx
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {player.lookingForGameName && (
                      <Badge variant="tag">
                        <Gamepad2 className="mr-1 h-3 w-3" aria-hidden="true" />
                        {player.lookingForGameName}
                      </Badge>
                    )}
                    {player.lookingForPlayStyle && (
                      <Badge variant={player.lookingForPlayStyle === 'Competitive' ? 'need-help' : 'enjoying'}>
                        {player.lookingForPlayStyle}
                      </Badge>
                    )}
                  </div>
```

to:

```tsx
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {player.lookingForGameName && (
                      <Badge variant="tag">
                        <Gamepad2 className="mr-1 h-3 w-3" aria-hidden="true" />
                        {player.lookingForGameName}
                      </Badge>
                    )}
                    {player.lookingForPlayStyle && (
                      <Badge variant={player.lookingForPlayStyle === 'Competitive' ? 'need-help' : 'enjoying'}>
                        {player.lookingForPlayStyle}
                      </Badge>
                    )}
                  </div>
                  {player.lookingForGameNote && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{player.lookingForGameNote}</p>
                  )}
```

- [ ] **Step 6: Update `FindPlayersPage.test.tsx`**

The test file mocks `../context/StatusContext`? No — it doesn't currently; `LookingForGamePanel` now pulls in `useStatus`, so the test needs that context mocked, plus `getGames` mocked, plus the `lookingForGameNote` field added to the existing `players` fixture. Replace the full contents of `src/pages/FindPlayersPage.test.tsx` with:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FindPlayersPage from './FindPlayersPage'
import * as profilesApi from '../api/profilesApi'
import * as gamesApi from '../api/gamesApi'

vi.mock('../api/profilesApi')
vi.mock('../api/gamesApi')
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'token' }),
}))
vi.mock('../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    lookingForGameNote: null,
    updateStatus: vi.fn().mockResolvedValue(undefined),
  }),
}))
vi.mock('../components/ui/InviteModal', () => ({
  InviteModal: ({ onSent }: { onSent: () => void }) => (
    <button type="button" onClick={onSent}>
      Mock send invitation
    </button>
  ),
}))

const players: profilesApi.LookingForGamePlayer[] = [
  {
    userId: 'user-1',
    username: 'nexusnova',
    displayName: 'Nexus Nova',
    avatarUrl: null,
    lookingForGameId: 'game-1',
    lookingForGameName: 'Apex Legends',
    lookingForPlayStyle: 'Chill',
    lookingForGameNote: 'looking for a duo partner',
    relationshipStatus: 'None',
    pendingInvitationId: null,
  },
]

describe('FindPlayersPage', () => {
  beforeEach(() => {
    vi.mocked(profilesApi.getLookingForGamePlayers).mockResolvedValue(players)
    vi.mocked(gamesApi.getGames).mockResolvedValue([])
  })

  function renderPage() {
    // The page navigates to profiles, so it needs router context.
    return render(
      <MemoryRouter>
        <FindPlayersPage />
      </MemoryRouter>,
    )
  }

  it('shows success feedback after sending an invitation', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /invite/i }))
    await user.click(screen.getByRole('button', { name: /mock send invitation/i }))

    expect(screen.getByText('Invitation sent to Nexus Nova.')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
  })

  it('shows the looking-for-game note on a player card', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    expect(screen.getByText('looking for a duo partner')).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Run the full frontend test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 8: Typecheck and build**

Run: `npx tsc -b`
Run: `npm run build`
Expected: no errors, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/LookingForGamePanel.tsx src/components/LookingForGamePanel.test.tsx src/pages/FindPlayersPage.tsx src/pages/FindPlayersPage.test.tsx
git commit -m "Add LookingForGamePanel to Find Players with an optional note"
```

---

### Task B7: Full-suite regression pass

**Files:**
- None created or modified unless a failure surfaces; this task is a verification gate.

**Interfaces:**
- None.

- [ ] **Step 1: Run the entire frontend test suite**

Run: `npm test`
Expected: all test files pass, including `TopBar.test.tsx` and `AppShell.test.tsx` (which reference status/avatar rendering but were not directly modified — confirm they still pass given `StatusContext`'s shape change).

- [ ] **Step 2: If `TopBar.test.tsx` or `AppShell.test.tsx` fail**

Inspect the failure output. If either file mocks `useStatus()` directly, add `lookingForGameNote: null` to its mock object the same way Task B5 Step 5 did for `Sidebar.test.tsx`, then re-run.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Run the full build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit any fixes from Step 2**

```bash
git add -A
git commit -m "Fix remaining StatusContext mock shapes after LookingForGamePanel changes"
```

(Skip this step entirely if Step 2 required no changes.)
