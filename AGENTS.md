# AGENTS.md

This file defines implementation standards for this codebase. Follow these rules unless a task explicitly requires otherwise.

## Core principles

- Prefer simple, readable solutions over clever abstractions.
- Keep functions, classes, and components small, composable, and easy to test.
- Make data flow explicit.
- Avoid hidden side effects.
- When changing existing code, match the surrounding conventions unless they conflict with this file.
- Do not introduce new patterns when an established project pattern already exists.

## Stack defaults

- Frontend: React
- API: NestJS
- Data fetching / server state: TanStack Query (React Query)
- Database access: Knex
- Database: PostgreSQL

## React best practices

- Use function components and hooks.
- Keep presentational components separate from data-fetching and mutation concerns when practical.
- Derive UI from props and state instead of duplicating state.
- Minimize `useEffect`; do not use it for logic that can be handled during render, in event handlers, or in React Query callbacks.
- Memoize only when there is a measurable reason.
- Keep component props small and explicit.
- Prefer controlled inputs for forms unless an uncontrolled approach is clearly simpler.
- Do not bury business logic deep inside JSX.
- Extract repeated JSX into small components.
- Prefer clear conditional rendering over nested ternaries.
- Handle loading, empty, error, and success states explicitly.

## File and component organization (mandatory)

These rules are non-optional.

- Do not create multiple components in a single file.
- Use one component per file unless a tiny private subcomponent is truly inseparable and local.
- Respect the existing project file structure at all times.
- Before adding files, inspect and follow the surrounding feature/module layout.
- New code must be placed in the appropriate existing directory, not wherever is convenient.
- Do not create new top-level folders or reorganize modules unless the task explicitly requires it.
- Keep imports aligned with the project path alias and folder conventions.
- Co-locate tests, types, hooks, and feature-specific helpers according to the existing project structure.

## Component ownership and logic placement

- Keep logic close to the component that owns the action.
- If a component performs an action, the action-specific hook or mutation should live with that component or in that component's feature-level module, not arbitrarily higher in the tree.
- If there is logic for a component, that logic belongs to the component actioning it.
- Parent components should orchestrate composition and shared state, not accumulate every child action.
- Lift state or mutations up only when multiple siblings genuinely need shared ownership.
- Avoid prop-drilling action handlers when the action is local to a child component.

## React Query rules (mandatory)

These are non-optional.

- **Always use React Query hooks for client-side fetches and mutations.**
- Do **not** call `fetch` directly inside components for server-state workflows.
- Do **not** implement ad hoc loading, error, or retry state for server data when React Query should own that state.
- Every client-side mutation must be implemented with `useMutation` or a project-standard wrapper around it.
- Every mutation must explicitly handle cache consistency.
- **After a successful mutation, invalidate or update the relevant queries immediately.**
- Prefer targeted invalidation using stable query keys.
- When practical, use `setQueryData` for direct cache updates and `invalidateQueries` for revalidation.
- If a mutation affects multiple views, invalidate every affected query key.
- For list/detail relationships, invalidate both list and detail queries when appropriate.
- Use optimistic updates only when rollback behavior is clearly defined.
- The component that performs the action should usually own the mutation hook usage.
- Do not hoist mutations into parent components unless there is a real shared coordination need.

### Required React Query patterns

- Centralize query keys in a shared location.
- Expose reusable hooks such as:
  - `useUserQuery(...)`
  - `useUsersQuery(...)`
  - `useCreateUserMutation()`
  - `useUpdateUserMutation()`

- Mutation hooks should usually encapsulate their own invalidation behavior instead of relying on callers to remember it.
- Query keys must be deterministic and structured, for example:
  - `['users']`
  - `['users', userId]`
  - `['projects', projectId, 'tasks']`

### Example mutation pattern

```ts
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users", updatedUser.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

### Anti-patterns

- Fetching inside `useEffect` for normal server-state data.
- Calling mutation functions directly from components without `useMutation`.
- Forgetting to invalidate related queries after create, update, or delete.
- Sprinkling raw query keys throughout the app instead of reusing key factories.
- Using React Query for purely local UI state.
- Putting a child component's mutation logic in the parent component without a real shared-state reason.

## NestJS API best practices

- Organize API code by domain or feature, not by technical layer alone.
- Keep controllers thin; controllers should parse request input, call services, and shape responses.
- Put business logic in services, not in controllers.
- Keep database access in repositories or data-access modules rather than mixing Knex calls throughout services and controllers.
- Validate request DTOs consistently.
- Use explicit request and response types.
- Keep modules cohesive and avoid circular dependencies.
- Use guards, interceptors, and pipes deliberately rather than as hidden magic.
- Surface domain errors clearly and translate them into appropriate HTTP responses.
- Do not leak database shapes directly through the API unless that is a conscious design decision.
- Return typed, consistent API responses.

## Knex best practices

- Use Knex through well-defined repository or data-access modules.
- Do not scatter raw SQL and Knex queries throughout services and controllers.
- Prefer composable query builder functions for repeated query fragments.
- Keep inserts, updates, and deletes explicit.
- Always select only the columns you need.
- Use transactions for multi-step writes that must succeed or fail together.
- Make transaction boundaries explicit in service-level workflows.
- Keep migrations small, reversible, and focused.
- Never edit an old migration that has already been applied in shared environments unless explicitly requested.
- Seed data that is required for the app to function (eg. types) belong in the migration itself.
- Seed data that is required for testing should only be applied for development and testing environments.
- Parameterize raw queries; never interpolate unsafe input.

## PostgreSQL best practices

- Model soft deletes consistently if the project uses them.
- Review query plans for slow or high-volume queries.

## Non-negotiables

- Use React Query hooks for all client-side server-state fetches and mutations.
- Always invalidate or update relevant queries after a successful mutation.
- Do not put multiple components in one file.
- Respect the existing file structure.
- Keep action logic with the component that owns the action unless shared ownership is truly needed.
- Keep NestJS controllers thin, services focused, and Knex access centralized.
