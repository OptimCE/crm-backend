// src/swagger/global.swagger.ts
export const GlobalSchemas = {
    Pagination: {
        description: "Pagination informations for partial responses",
        content: {
            "application/json": {
                schema:{
                    page: {
                        type: "number",
                        minimum: 1,
                        example: 1
                    },
                    limit: {
                        type: "number",
                        example: 10
                    },
                    total: {
                        type: "number",
                        example: 40
                    },
                    total_pages: {
                        type: "number",
                        example: 4
                    }
                }
            }
        }
    }
}
export const GlobalErrorResponses = {
    // 400: Thrown by idChecker (UNAUTHENTICATED) & communityIdChecker (AUTHORIZATION_MISSING)
    BadRequest: {
        description: "Bad Request - Authentication or Community Context missing",
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        error: { type: "string", example: "UNAUTHENTICATED" },
                        statusCode: { type: "integer", example: 400 }
                    }
                }
            }
        }
    },

    // 401: Thrown by roleChecker when role is missing entirely
    Unauthorized: {
        description: "Unauthorized - Role context missing",
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        error: { type: "string", example: "AUTHORIZATION_MISSING" },
                        statusCode: { type: "integer", example: 401 }
                    }
                }
            }
        }
    },

    // 403: Thrown by roleChecker when role exists but is insufficient
    Forbidden: {
        description: "Forbidden - Insufficient Role permissions",
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        error: { type: "string", example: "UNAUTHORIZED" },
                        statusCode: { type: "integer", example: 403 }
                    }
                }
            }
        }
    }
};

export const Tags = [
    {
        name:"Communities",
        description: "Operation related to managing Communities CRUD operations",
    },
    {
        name:"Documents",
        description: "Operation related to managing Documents CRUD operations and interaction with the external storage service",
    },
    {
        name:"Invitations",
        description: "Operation related to managing invitation of new user in the community",
    },
    {
        name:"Keys",
        description: "Operation related to managing allocation key of communities",
    },
    {
        name: "Members",
        description: "Operations related to managing CRM members (individuals and companies)"
    },
    {
        name: "Meters",
        description: "Physical meter management and reading history"
    },
    {
        name:"SharingOperations",
        description: "Operation related to managing Sharing Operation living within the community",
    },
    {
        name:"Users",
        description: "Operation related to managing users of the application",
    },

]