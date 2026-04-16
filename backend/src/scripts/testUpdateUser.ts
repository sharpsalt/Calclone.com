import { updateUserById } from '../services/usersService';

(async () => {
  try {
    const id = '2db7dcbd-a4c8-4eee-8e05-324266a5fff9';
    console.log('Testing updateUserById for', id);
    const res = await updateUserById(id, { name: 'Test Update', timezone: 'Asia/Kolkata' });
    console.log('Result:', res);
    process.exit(0);
  } catch (err) {
    console.error('Error during test update:', err);
    process.exit(1);
  }
})();
