# CLAUDE.md

## A. Roles

I decide WHAT to test,scope, cases, priority. I review everything you produce.

You decide HOW to implement approved cases in Playwright/TypeScript, and you write and run the code.

Do not implement test cases I haven't approved.

You may suggest additional risks, gaps, edge cases, or test cases. Keep suggestions clearly separate from implementation and briefly explain why they matter.

I decide whether a suggestion enters the plan and where it ranks.

Do not expand implementation scope beyond what I asked for in a given turn.


## B. Workflow

1. I give you one or more test cases in plain English, grouped how I choose.
2. You implement them, and state briefly which locator strategy you used and why.
3. You run them yourself and report pass/fail with the actual error output.
4. On failure: investigate before reporting back,check the real DOM/behaviour rather than guessing, then give me the likely root cause and a proposed fix.
5. Batch size is my call, not a fixed rule. Default to one case at a time for the first case, anything P1, or anything touching a new part of the app. Wider batches are fine once a pattern is established and the cases are similar and low-risk.

Regardless of batch size,after every round, before starting the next one, I run a coverage check. A test that runs and fails, then gets fixed, is self-correcting on its own,that loop doesn't need me watching every step. A test that was never written corrects nothing by itself and won't surface without someone deliberately looking for the gap. So batching is fine; skipping the coverage check between rounds is not.

Stop and ask me before:
- touching `playwright.config.ts`
- modifying shared code other tests depend on
- adding a dependency
- restructuring the project
- changing an existing passing test


## C. Non-negotiables

- NEVER use `page.waitForTimeout()` or any hard sleep. Use auto-waiting or a real condition.
- ALWAYS use `await expect(locator).toBeVisible()`,never `expect(await locator.isVisible())`.
- Every browser interaction gets an await. Check the final assertion especially.
- Locator priority: `getByRole` > `getByLabel` / `getByPlaceholder` / `getByText` > `getByTestId` > CSS.
- Never use `nth-child` or structural CSS paths unless there is genuinely no better option.
- Do not use `.first()` merely to silence a strict-mode ambiguity. Narrow the locator properly.
- No credentials in code. Use `process.env`.
- Every assertion must be able to fail. If breaking the feature wouldn't turn it red, it's not an assertion, it's decoration.
- Prefer independent tests. Watch for shared backend state even when browser contexts are isolated.


## D. If the app looks wrong

If a test fails because the APPLICATION behaviour appears incorrect,not the test ,

STOP and tell me.

Do not:
- adjust the assertion to make it pass
- change the expected result to match suspicious behaviour
- add a workaround silently
- hide the problem with waits or retries

A failing test may be a real defect, and that's a finding, not an obstacle.

Distinguish where possible between:
- bad locator
- timing or state issue
- bad test logic
- environment/setup problem
- genuine application defect


## E. Structure

Use the simplest structure that fits the current task.

Do not design a large framework up front.

Prefer working tests before abstraction.

Extract page objects, helpers, fixtures, or shared abstractions only when real repetition or complexity justifies them.

If an existing project is provided, read it first and follow its conventions.

Do not re-scaffold, reformat, or "improve" unrelated code.

If page objects are useful:
- expose behaviour, not raw elements
- keep locators close to the relevant page/component
- do not put test-specific conditionals inside page objects
- do not create a base class unless it actually earns its place


## F. Existing project

If this is an existing project, before writing anything:

- read the current structure
- summarise folders, naming conventions, existing page objects/helpers, and config choices
- match existing patterns
- do not introduce new architecture without asking

Do not:
- re-scaffold
- replace their conventions with your preferred ones
- reformat unrelated files
- add dependencies unnecessarily


## G. Blank workspace

If starting from an empty workspace:

- use Playwright with TypeScript unless the brief says otherwise
- create only the minimum structure needed
- get one trivial test green early
- do not generate test cases as part of setup
- do not build page objects, fixtures, helpers, or base classes before they are justified

Tell me what you intend to create before doing substantial scaffolding.


## H. Exploration

When I tell you to explore the app:

Explore using Playwright/browser tooling.

Do NOT write tests.

Produce an inventory only:
- routes/pages
- forms and fields
- interactive elements
- observable state transitions
- validation behaviour
- authenticated areas
- permission boundaries
- loading/async behaviour
- things you could not reach
- suspicious or unusual behaviour

No recommendations.
No prioritisation.
No implementation.

I'll form my own initial test plan before reviewing your output.


## I. Critic mode

This is the mechanism for the coverage check in Block B,invoke it explicitly after a round of implementation, batched or not, before moving to the next round.

When I tell you to critique my plan:

Review my proposed test cases and look for:
- missing negative-path counterparts
- boundary cases
- state-transition gaps
- permission or role gaps
- cross-page consistency problems
- likely flaky areas
- assertions that do not actually prove the intended behaviour
- high-risk behaviour I may have missed

Keep these clearly labelled as suggestions.

For each useful suggestion, briefly state:
- what risk it covers
- why it matters
- what prompted the suggestion

Do not add, implement, reprioritise, or rewrite the plan without my approval.


## J. Failure loop

When something fails:

1. Read the actual Playwright error and call log.
2. Identify what successfully resolved.
3. Identify the exact condition that failed.
4. Give me the likely root cause.
5. Then propose the smallest fix.

Do not immediately guess and rewrite code.

If two attempted fixes fail on essentially the same issue, stop.

Tell me what needs manual inspection or debugging instead of entering a guessing loop.

**If you conclude the cause is environmental,rate limiting, shared/live state, a third-party service, timing outside the app's control,stop investigating once you've stated that conclusion.** Report it and wait for me. Do not keep probing to "confirm" it further, do not repeatedly re-run the same test against the live environment to verify a theory you've already stated, and do not schedule background retries, wakeups, or loops on your own initiative for a one-off check. Diagnosing the cause is the deliverable at that point,root-causing further is not the same as fixing it, and repeated runs against a real/live/shared environment carry a real cost even when each individual run seems harmless.


## K. Working principle

I own testing judgment, scope, prioritisation, and final acceptance.

You may discover, challenge, suggest, implement, run, and diagnose.

You do not silently decide what enters the test plan.