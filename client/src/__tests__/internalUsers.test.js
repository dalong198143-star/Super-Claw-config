import INTERNAL_USERS from '../config/internalUsers'

describe('Internal Users Configuration', () => {
  test('exports an array of users', () => {
    expect(Array.isArray(INTERNAL_USERS)).toBe(true);
    expect(INTERNAL_USERS.length).toBeGreaterThan(0);
  });

  test('each user has required fields', () => {
    INTERNAL_USERS.forEach(user => {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('avatar');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('balance');
    });
  });

  test('user IDs are unique', () => {
    const ids = INTERNAL_USERS.map(user => user.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('user roles are valid', () => {
    const validRoles = ['admin', 'creator', 'learner'];
    INTERNAL_USERS.forEach(user => {
      expect(validRoles).toContain(user.role);
    });
  });

  test('balances are non-negative numbers', () => {
    INTERNAL_USERS.forEach(user => {
      expect(typeof user.balance).toBe('number');
      expect(user.balance).toBeGreaterThanOrEqual(0);
    });
  });

  test('has at least one admin user', () => {
    const admins = INTERNAL_USERS.filter(user => user.role === 'admin');
    expect(admins.length).toBeGreaterThan(0);
  });
});
