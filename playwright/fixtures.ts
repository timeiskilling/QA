// import { test as baseTest, expect } from 'playwright/test';
// // Import project utils for managing users in the test database.
// import { createUserInTestDatabase, deleteUserFromTestDatabase } from './my-db-utils';

// export * from 'playwright/test';
// export const test = baseTest.extend<{}, { dbUserName: string }>({
//   // Returns db user name unique for the worker.
//   dbUserName: [async ({ }, use) => {
//     // Use workerIndex as a unique identifier for each worker.
//     const userName = `user-${test.info().workerIndex}`;
//     // Initialize user in the database.
//     await createUserInTestDatabase(userName);
//     await use(userName);
//     // Clean up after the tests are done.
//     await deleteUserFromTestDatabase(userName);
//   }, { scope: 'worker' }],
// });
