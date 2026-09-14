# Stub and Placeholder Checks

## Red flags

Check for:

- placeholder text;
- TODO-only implementations;
- empty handlers;
- hardcoded sample data where dynamic behavior is required;
- return values that bypass real logic;
- unwired routes, exports, or configuration;
- tests that assert implementation details without behavior.

## Check rule

A stub check is not a text hunt alone. Confirm whether the suspicious code is reachable, intentional, and acceptable for the stated scope.
