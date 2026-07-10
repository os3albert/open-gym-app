# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

**Greenfield project — no code exists yet.** The repository contains only `README.md` (written in Italian), which describes the product vision and constraints. There is no package.json, no framework, no tests, and no git repository. Once the project is scaffolded, replace this section with the actual build/test/lint commands and the chosen architecture.

## Product Vision (from README.md)

An open-source, Reddit-style platform for gym exercises:

- Users publish exercises tailored to body stature; others replicate them and upvote them.
- Users track their past weight-lifting activity so the app can suggest the weight the next time they perform an exercise.
- Each user has a workout plan ("scheda di allenamento"): they pick from the exercises proposed for their day instead of searching.
- Users can propose exercises and workout plans to other users, who can add them to their own plan or try that user's plan.
- Exercise videos are shared as **YouTube links only** — no video hosting/storage in the app. Uploaders are expected to use AI face-blurring so exercises are judged on usefulness, not on the person.

## Hard Constraints

- **Frontend-only web app — no backend server.** All data is persisted in cache/localStorage.
- **No user registration or authentication.**
- **JSON export and import** of all saved data must be supported, so users can back up to their own device.
- Framework: **Vue.js or React** — the README explicitly leaves the choice open. Pick one, then record the decision and rationale here.

## Required Development Methodology

The README mandates all of the following, so build them in from the start rather than retrofitting:

- **BDD** (behavior-driven scenarios for the use cases), **TDD** (unit tests for each unit), **integration tests**, and **E2E tests** for the most important user flows.
- **CI pipeline with GitHub Actions**: run static code analysis and require all tests to pass before the build step.
- **Containerization** (e.g. Docker) so anyone can host the project on a cloud.
