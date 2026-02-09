export const InvitationParameters = {
    InvitationId: {
        name: 'id_invitation',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID of the invitation',
        example: 789
    },
    UserMemberInvitationQuery: {
        name: 'filters',
        in: 'query',
        description: 'Pagination and filter options for member invitations',
        required: false,
        schema: { $ref: '#/components/schemas/UserMemberInvitationQuery' },
        style: 'form',
        explode: true,
        example: {
            name: "Doe",
            to_be_encoded: true,
            sort_date: "DESC",
            page: 1,
            limit: 10
        }
    },
    UserManagerInvitationQuery: {
        name: 'filters',
        in: 'query',
        description: 'Pagination and filter options for manager invitations',
        required: false,
        schema: { $ref: '#/components/schemas/UserManagerInvitationQuery' },
        style: 'form',
        explode: true,
        example: {
            name: "Smith",
            sort_date: "DESC",
            page: 1,
            limit: 10
        }
    }
};

export const InvitationResponses = {
    MemberInvitationsListSuccess: {
        description: "Successful list of member invitations",
        content: {
            "application/json": {
                schema: {
                    error_code: 0,
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/UserMemberInvitationDTO" }
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                },
                example: {
                    error_code: 0,
                    data: [
                        {
                            id: 789,
                            member_id: 42,
                            member_name: "Jean Dupont",
                            user_email: "jean.dupont@example.com",
                            created_at: "2023-11-15T09:00:00Z",
                            to_be_encoded: false,
                            community: {
                                id: 10,
                                name: "Résidence des Fleurs"
                            }
                        }
                    ],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1
                    }
                }
            }
        }
    },
    ManagerInvitationsListSuccess: {
        description: "Successful list of manager invitations",
        content: {
            "application/json": {
                schema: {
                    error_code: 0,
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/UserManagerInvitationDTO" }
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                },
                example: {
                    error_code: 0,
                    data: [
                        {
                            id: 800,
                            user_email: "manager@example.com",
                            created_at: "2023-11-10T14:00:00Z",
                            community: {
                                id: 10,
                                name: "Résidence des Fleurs"
                            }
                        }
                    ],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1
                    }
                }
            }
        }
    },
    InvitationSuccess: {
        description: "Operation successful",
        content: {
            "application/json": {
                schema: {
                    data: { type: "string", example: "success" }
                },
                example: {
                    data: "success"
                }
            }
        }
    }
};
