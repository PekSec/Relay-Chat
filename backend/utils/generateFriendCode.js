import { randomInt } from 'node:crypto';

// The unique database index decides whether this candidate can be used.
export default function generateFriendCode() {
    return randomInt(36 ** 4).toString(36).toUpperCase().padStart(4, '0');
}
