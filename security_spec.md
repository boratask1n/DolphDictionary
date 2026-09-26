# Security Specification & Test Protocol

## 1. Data Invariants
1. **User Identity Boundary**: A user can only access, create, read, update, or delete their own documents under `/users/{userId}/**`. Cross-user data leakage is strictly prohibited.
2. **User Document Ownership**: In `/users/{userId}`, `userId` in the path must match `request.auth.uid`.
3. **Word Ownership & Immutability**: Any word stored in `/users/{userId}/words/{wordId}` must have `userId == request.auth.uid`. The `id`, `userId`, and `dateAdded` fields are immutable on update.
4. **Field Boundaries**:
   - `word` text must be string <= 128 chars.
   - `language` must be 'en' or 'de'.
   - `primaryAcademicContext` must be string <= 128 chars.
   - `personalNote` must be string <= 2048 chars.
   - `difficultyRating` must be number between 1.0 and 10.0.
5. **ReviewLog Integrity**: A review log belongs to the authenticated user and cannot be altered or overwritten once created (immutable logs).
6. **Default Deny**: Any path not explicitly matched and permitted is denied by default.

---

## 2. The "Dirty Dozen" Payloads (Attacks that MUST return PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempting to read `/users/user123/words/word456` without auth token.
2. **Cross-Tenant Impersonation**: User A (`auth.uid: userA`) attempting to write to `/users/userB/words/word1`.
3. **Shadow Field Injection**: Attempting to create a word with an unauthorized extra field `isAdmin: true` or `shadowAdmin: true`.
4. **Owner ID Spoofing**: User A creating a word under `/users/userA/words/word1` with `userId: "userB"`.
5. **Huge Payload / Denial-of-Wallet Attack**: Attempting to set `word` to a 500KB string.
6. **Path Traversal / Junk Characters in ID**: Attempting to create `/users/userA/words/word..%2F..%2Fhack`.
7. **Invalid Language Code**: Attempting to create a word with `language: "fr"` or `language: "invalid"`.
8. **Immutability Violation (Owner Overwrite)**: User A updating their word and trying to change `userId` to `userC`.
9. **Immutability Violation (DateAdded Overwrite)**: User A updating a word and tampering with original `dateAdded`.
10. **Review Log Tampering**: User A attempting to update an existing immutable review log in `/users/userA/reviewLogs/log1`.
11. **Negative / Out-of-bounds Difficulty**: Attempting to write a word with `difficultyRating: 999.0` or `difficultyRating: -5`.
12. **Foreign Settings Mutation**: User A attempting to write to `/users/userB/settings/preferences`.

---

## 3. Test Runner Specification (`firestore.rules.test.ts`)
All above 12 attack vectors are asserted to fail with `PERMISSION_DENIED` under the rules defined in `firestore.rules`.
