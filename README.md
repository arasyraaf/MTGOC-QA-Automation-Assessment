# QA Automation Assessment

## Running

npm install

npx playwright install

Create a `.env` file with valid login credentials that has been registered (login is required on most runs to reach seat selection):

GSC_MOBILE_NUMBER=

GSC_PASSWORD=

npx playwright test

npx playwright show-report

## Test cases covered
1) Opening the website, going to the movies tab, then selecting a movie 
   (tests/movie-browsing.spec.ts)
2) Continuing from the previous, selecting a showtime and logging in to
   reach seat selection (tests/showtime-selection.spec.ts)
3) Continuing from the previous, selecting a seat and continuing until the
   review summary, just before checkout (tests/booking-checkout.spec.ts)
4) Attempting to log in with an invalid/unregistered mobile phone number leads to sign-up page
5) Attemping to select and deselect a movie seat, and validating that the seat is deselected and checkout is unavailable.

## Scope and Reasoning
Test cases follow the assigned user journey per the brief. Within that scope, selections made along the way were the first available option and as for showtime, a same-day selection ahead of the current time is implemented. This is to ensure that the most basic requirement of user journey is able to be completed up until checkout.

## Assumptions
- Login is required on every run to reach seat selection.
- A 2D adult ticket was selected as the main choice for all test runs to maintain a predictable flow for every test run and to represent the most common user flows.