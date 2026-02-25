
const messages = {
    NotFoundError: "Not Found Error",
    UnauthorizedError: "Unauthorized Error",
    ForbiddenError: "Forbidden Error",
    InternalServerError: "Internal Server Error",
    BadRequestError: "Bad Request Error",
    ServiceUnavailableError: "Service Unavailable Error",
    GatewayTimeoutError: "Gateway Timeout Error",
};

const RBAC_MESSAGES = {
    AccessDenied: "Access Denied",
    InsufficientPermissions: "Insufficient Permissions",
    RoleNotFound: "Role Not Found",
    UserNotFound: "User Not Found",
    InvalidRoleAssignment: "Invalid Role Assignment",
};  

const RBAC_Roles = {
    Admin: "Admin",
    User: "User",
    Superadmin: "Superadmin",
};

const RBAC_Permissions = {
    Read: "Read",
    Write: "Write",
    Delete: "Delete",
    Update: "Update",
};

const access_permissions = {
    [RBAC_Roles.Admin]: [RBAC_Permissions.Read, RBAC_Permissions.Write, RBAC_Permissions.Update],
    [RBAC_Roles.User]: [RBAC_Permissions.Read],
    [RBAC_Roles.Superadmin]: [RBAC_Permissions.Read, RBAC_Permissions.Write, RBAC_Permissions.Delete, RBAC_Permissions.Update],
};

const RBAC_group = {
    AA: [RBAC_Roles.Admin],
    UU: [RBAC_Roles.User],
    SS: [RBAC_Roles.Superadmin],
    AAUU: [RBAC_Roles.Admin, RBAC_Roles.User],
    AASS: [RBAC_Roles.Admin, RBAC_Roles.Superadmin],
    UUSS: [RBAC_Roles.User, RBAC_Roles.Superadmin],
    AAUUSS: [RBAC_Roles.Admin, RBAC_Roles.User, RBAC_Roles.Superadmin],
}

export { messages, RBAC_MESSAGES, RBAC_Roles, RBAC_Permissions, access_permissions, RBAC_group };