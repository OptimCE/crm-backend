export const SharingOperationParameters = {
    SharingOperationId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID of the sharing operation',
        example: 1
    },
    SharingOperationPartialQuery: {
        name: 'filters',
        in: 'query',
        description: 'Pagination and filter options for sharing operations',
        required: false,
        schema: { $ref: '#/components/schemas/SharingOperationPartialQuery' },
        style: 'form',
        explode: true,
        example: {
            name: "Partage Résidence",
            type: 1, // Peer-to-Peer
            sort_name: "ASC",
            page: 1,
            limit: 10
        }
    },
    SharingOperationConsumptionQuery: {
        name: 'filters',
        in: 'query',
        description: 'Date range filters for sharing operation consumptions',
        required: false,
        schema: { $ref: '#/components/schemas/SharingOperationConsumptionQuery' },
        style: 'form',
        explode: true,
        example: {
            date_start: "2023-01-01T00:00:00Z",
            date_end: "2023-01-31T23:59:59Z"
        }
    }
};

export const SharingOperationResponses = {
    SharingOperationListSuccess: {
        description: "Successful list of sharing operations",
        content: {
            "application/json": {
                schema: {
                    error_code: 0,
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SharingOperationPartialDTO" }
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                },
                example: {
                    error_code: 0,
                    data: [
                        {
                            id: 1,
                            name: "Partage Résidence",
                            type: 1 // Peer-to-Peer
                        },
                        {
                            id: 2,
                            name: "Partage Local",
                            type: 2
                        }
                    ],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 2
                    }
                }
            }
        }
    },
    SharingOperationGetSuccess: {
        description: "Successful sharing operation retrieval",
        content: {
            "application/json": {
                schema: {
                    error_code: 0,
                    data: { $ref: "#/components/schemas/SharingOperationDTO" }
                },
                example: {
                    error_code: 0,
                    data: {
                        id: 1,
                        name: "Partage Résidence",
                        type: 1,
                        key: {
                            id: 10,
                            key: {
                                id: 5,
                                name: "Clé Principale"
                            },
                            start_date: "2023-01-01T00:00:00Z",
                            end_date: "2023-12-31T23:59:59Z",
                            status: 1
                        },
                        history_keys: [],
                        key_waiting_approval: null
                    }
                }
            }
        }
    },
    SharingOperationConsumptionsGetSuccess: {
        description: "Successful sharing operation consumptions retrieval",
        content: {
            "application/json": {
                schema: {
                    error_code: 0,
                    data: { $ref: "#/components/schemas/SharingOpConsumptionDTO" }
                },
                example: {
                    error_code: 0,
                    data: {
                        id: 1,
                        timestamps: ["2023-01-01T00:00:00Z", "2023-01-01T00:15:00Z"],
                        gross: [10.5, 11.2],
                        net: [10.5, 11.2],
                        shared: [5.0, 5.5],
                        inj_gross: [2.0, 2.1],
                        inj_net: [1.8, 1.9],
                        inj_shared: [1.0, 1.0]
                    }
                }
            }
        }
    },
    SharingOperationConsumptionsDownloadSuccess: {
        description: "Successful sharing operation consumptions download",
        content: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: {
                    type: "string",
                    format: "binary"
                }
            }
        }
    },
    SharingOperationCreateSuccess: {
        description: "Sharing operation successfully created",
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
    },
    SharingOperationAddKeySuccess: {
        description: "Key successfully added to waiting list",
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
    },
    SharingOperationAddMeterSuccess: {
        description: "Meter successfully added to waiting list",
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
    },
    SharingOperationAddConsumptionsSuccess: {
        description: "Consumptions successfully added",
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
    },
    SharingOperationPatchKeySuccess: {
        description: "Key status successfully patched",
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
    },
    SharingOperationPatchMeterSuccess: {
        description: "Meter status successfully patched",
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
    },
    SharingOperationDeleteSuccess: {
        description: "Sharing operation successfully deleted",
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
    },
    SharingOperationRemoveMeterSuccess: {
        description: "Meter successfully removed from sharing operation",
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
