/**
 * Database facade — SQLite locally, Turso on Vercel when TURSO_* env vars are set.
 */
import * as sqlite from './dbSqlite.js';
import * as turso from './dbTurso.js';

const useTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
const backend = useTurso ? turso : sqlite;

function wrap(name) {
    const fn = backend[name];
    if (!fn) throw new Error(`Database function missing: ${name}`);
    if (useTurso) return (...args) => fn(...args);
    return (...args) => Promise.resolve(fn(...args));
}

export const createUser = wrap('createUser');
export const getUserByEmail = wrap('getUserByEmail');
export const getUserByGoogleId = wrap('getUserByGoogleId');
export const linkGoogleAccount = wrap('linkGoogleAccount');
export const getUserByFirebaseUid = wrap('getUserByFirebaseUid');
export const linkFirebaseAccount = wrap('linkFirebaseAccount');
export const hasAdminUser = wrap('hasAdminUser');
export const getUserById = wrap('getUserById');
export const getAllUsers = wrap('getAllUsers');
export const updateUser = wrap('updateUser');
export const deleteUser = wrap('deleteUser');
export const createProject = wrap('createProject');
export const getProjectById = wrap('getProjectById');
export const getProjectsByUser = wrap('getProjectsByUser');
export const getAllProjects = wrap('getAllProjects');
export const updateProject = wrap('updateProject');
export const deleteProject = wrap('deleteProject');
export const getDashboardStats = wrap('getDashboardStats');

export function getDatabaseMode() {
    return useTurso ? 'turso' : 'sqlite';
}

export default useTurso ? null : sqlite.default;
