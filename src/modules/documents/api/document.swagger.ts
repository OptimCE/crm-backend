export const DocumentParameters = {
    MemberId: {
        name: 'member_id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID of the member',
        example: 42
    },
    DocumentId: {
        name: 'document_id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID of the document',
        example: 10
    },
    DocumentQuery: {
        name: 'filters',
        in: 'query',
        description: 'Pagination, filter and sort options for documents',
        required: false,
        schema: { $ref: '#/components/schemas/DocumentQueryDTO' },
        style: 'form',
        explode: true,
        example: {
            file_name: "contrat_location.pdf",
            file_type: "application/pdf",
            sort_upload_date: "DESC",
            page: 1,
            limit: 20
        }
    }
};

export const DocumentResponses = {
    DocumentListSuccess: {
        description: "Successful list of documents",
        content: {
            "application/json": {
                schema: {
                    error_code: 0,
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/DocumentExposedDTO" }
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                },
                example: {
                    error_code: 0,
                    data: [
                        {
                            id: 10,
                            file_name: "contrat_location.pdf",
                            file_size: 102400,
                            upload_date: "2023-10-27T10:00:00Z",
                            file_type: "application/pdf"
                        },
                        {
                            id: 11,
                            file_name: "facture_electricite.png",
                            file_size: 204800,
                            upload_date: "2023-11-01T14:30:00Z",
                            file_type: "image/png"
                        }
                    ],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 2
                    }
                }
            }
        }
    },
    DocumentDownloadSuccess: {
        description: "Successful document download",
        content: {
            "application/octet-stream": {
                schema: {
                    type: "string",
                    format: "binary"
                }
            },
            "application/pdf": {
                schema: {
                    type: "string",
                    format: "binary"
                }
            },
            "image/png": {
                schema: {
                    type: "string",
                    format: "binary"
                }
            },
            "image/jpeg": {
                schema: {
                    type: "string",
                    format: "binary"
                }
            }
        }
    },
    DocumentUploadSuccess: {
        description: "Document successfully uploaded",
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
    DocumentDeleteSuccess: {
        description: "Document successfully deleted",
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
