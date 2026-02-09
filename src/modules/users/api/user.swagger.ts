export const UserParameters = {};

export const UserResponses = {
    UserGetSuccess: {
        description: "Successful user profile retrieval",
        content: {
            "application/json": {
                schema: {
                    error_code: 0,
                    data: { $ref: "#/components/schemas/UserDTO" }
                },
                example: {
                    error_code: 0,
                    data: {
                        id: 42,
                        first_name: "Jean",
                        last_name: "Dupont",
                        nrn: "80010112345",
                        phone_number: "+32470123456",
                        email: "jean.dupont@example.com",
                        iban: "BE12345678901234",
                        home_address: {
                            street: "Rue de la Gare",
                            number: "10",
                            box: "A",
                            city: "Brussels",
                            zip_code: "1000",
                            country: "Belgium"
                        },
                        billing_address: {
                            street: "Rue de la Gare",
                            number: "10",
                            box: "A",
                            city: "Brussels",
                            zip_code: "1000",
                            country: "Belgium"
                        }
                    }
                }
            }
        }
    },
    UserUpdateSuccess: {
        description: "User profile successfully updated",
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
