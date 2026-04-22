# Security Specification

## 1. Data Invariants
- A Teacher owns all their scoped subcollections under `teachers/{nip}/*`.
- Only `PURNOMOWIWIT@gmail.com` (verified) is the Admin.
- `public_chat` and `shared_items` are accessible to all authenticated users.
- `shared_items/{itemId}/comments` can be created by any authenticated user.
- A `Student` must have an `id`, `name`, and `className`.
- Only a Teacher can create/update/delete their own resources, or an Admin.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Update (Identity Spoofing):** Trying to change the `uid` of a document holding another owner.
2. **Schema Break (Size):** Submitting a `Student` name > 100 characters.
3. **Ghost Field (Type Leak):** Injecting `isAdmin: true` into a `Student` document.
4. **Spoof Admin:** Logging in with `PURNOMOWIWIT@gmail.com` where `email_verified: false` and attempting an admin action.
5. **PII Blanket Attack:** Attempting to `get` or `list` another teacher's students.
6. **Cross-Tenant Write:** Attempting to create a document in another teacher's path.
7. **Value Poisoning (Data type mismatch):** Updating `className` with an object instead of a string.
8. **Action State Shortcut:** Changing an outcome status bypass.
9. **Missing Required Fields:** Creating a `CounselingLog` without `studentId`.
10. **ID Poisoning:** Submitting a document ID containing massive unprintable payload.
11. **Malicious Array Expansion:** Inserting 10,000 items in an array.
12. **Unauthorized Read Delegation:** Sending a generic query to a filtered endpoint and missing `uid` bounds.

## 3. Test Runner
We will generate `firestore.rules.test.ts` using `@firebase/rules-unit-testing`.
