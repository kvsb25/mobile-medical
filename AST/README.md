# EPICS Core Logic AST

This folder contains a focused abstract syntax tree representation of the main application logic only.

Included:
- `frontend_ast.md`: frontend entry, router, auth context, and route guard.
- `backend_ast.md`: backend server bootstrap, route wiring, auth/rate-limiter middleware, and primary controllers.
- `frontend/*.ast.md`: per-file detailed frontend AST docs.
- `backend/*.ast.md`: per-file detailed backend AST docs.

Selection policy:
- Scope is limited to `frontend` and `Backend`.
- Only files that drive app behavior are represented (entry points, routing, auth, core request workflows).
- UI-only presentation components and low-level helpers are intentionally excluded.
