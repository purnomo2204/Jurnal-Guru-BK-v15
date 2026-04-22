import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: readFileSync(resolve(__dirname, 'DRAFT_firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Rules Security Audit', () => {

  const TEcherNIP = 'teacher123';
  const OtherTeacherNIP = 'teacher456';
  const AdminEmail = 'PURNOMOWIWIT@gmail.com';

  it('1. Should deny unauthenticated users to read or write', async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(unauth.firestore().collection(`teachers/${TEcherNIP}/students`).get());
    await assertFails(unauth.firestore().doc(`teachers/${TEcherNIP}/students/1`).set({id: '1', name: 'John'}));
  });

  it('2. Should allow owner to read their own students list', async () => {
    const auth = testEnv.authenticatedContext(TEcherNIP, { email: 'teacher@a.com', email_verified: true });
    await assertSucceeds(auth.firestore().collection(`teachers/${TEcherNIP}/students`).get());
  });

  it('3. Should deny non-owners from reading a teacher student list (PII Blanket Attack)', async () => {
    const auth = testEnv.authenticatedContext(OtherTeacherNIP, { email: 'other@a.com', email_verified: true });
    // List should fail
    await assertFails(auth.firestore().collection(`teachers/${TEcherNIP}/students`).get());
  });

  it('4. Should allow students to create AKPD forms', async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertSucceeds(unauth.firestore().doc(`teachers/${TEcherNIP}/akpd/resp1`).set({
      id: 'resp1',
      studentId: '1',
      date: '2023-01-01'
    }));
  });

  it('5. Should deny schema breakage on Student creation', async () => {
    const auth = testEnv.authenticatedContext(TEcherNIP, { email: 'teacher@a.com', email_verified: true });
    
    // Valid student
    await assertSucceeds(auth.firestore().doc(`teachers/${TEcherNIP}/students/ok1`).set({
      id: 'ok1',
      name: 'John',
      className: 'XA'
    }));

    // Invalid student name length
    await assertFails(auth.firestore().doc(`teachers/${TEcherNIP}/students/bad2`).set({
      id: 'bad2',
      name: 'A'.repeat(200), // > 150
      className: 'XA'
    }));
  });

  it('6. Should explicitly deny Admin access if email is correct but unverified', async () => {
    const auth = testEnv.authenticatedContext('hacker', { email: AdminEmail, email_verified: false }); // Spoofed
    await assertFails(auth.firestore().collection(`teachers/${TEcherNIP}/students`).get());
  });

  it('7. Should allow verified Admin access', async () => {
    const auth = testEnv.authenticatedContext('adminuid', { email: AdminEmail, email_verified: true });
    await assertSucceeds(auth.firestore().collection(`teachers/${TEcherNIP}/students`).get());
  });

  it('8. Should enforce ID Validation poisoning guard', async () => {
    const auth = testEnv.authenticatedContext(TEcherNIP, { email: 'teacher@a.com', email_verified: true });
    // Try to create document with poisonous ID
    const badId = 'drop table students;'
    await assertFails(auth.firestore().doc(`teachers/${TEcherNIP}/students/${badId}`).set({
      id: 'bad1',
      name: 'John',
      className: 'XA'
    }));
  });

  it('9. Should allow authenticated user to create public chat message if sender matches UID', async () => {
    const auth = testEnv.authenticatedContext('useruid123', { email: 'teacher@a.com', email_verified: true });
    await assertSucceeds(auth.firestore().doc(`public_chat/msg1`).set({
      sender: 'useruid123',
      text: 'hello'
    }));

    await assertFails(auth.firestore().doc(`public_chat/msg2`).set({
      sender: 'imposter', // mismatch
      text: 'hello'
    }));
  });
});
