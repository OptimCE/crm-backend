/**
 * Enum representing user roles in the system with increasing privilege levels
 */
export enum Role {
    /** Regular community member */
    MEMBER = 'MEMBER',
    /** Community manager with elevated permissions */
    GESTIONNAIRE = 'MANAGER',
    /** Administrator with full permissions */
    ADMIN = 'ADMIN',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.MEMBER]: 0,
    [Role.GESTIONNAIRE]: 1,
    [Role.ADMIN]: 2,
}