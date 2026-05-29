export const AuditLogResponses = {
  AuditLogExportSuccess: {
    description: "Audit log CSV export",
    content: {
      "text/csv": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
    headers: {
      "Content-Disposition": {
        description: "Attachment filename",
        schema: {
          type: "string",
          example: 'attachment; filename="audit-log_10.csv"',
        },
      },
    },
  },
};
