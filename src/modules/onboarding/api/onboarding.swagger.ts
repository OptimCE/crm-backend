export const OnboardingParameters = {
  OnboardingTourKey: {
    name: "tour_key",
    in: "path",
    required: true,
    schema: { type: "string", enum: ["welcome", "community_member", "community_manager", "community_admin"] },
    description: "The onboarding tour",
    example: "welcome",
  },
};

export const OnboardingResponses = {
  OnboardingStatesSuccess: {
    description: "The current user's onboarding states (an absent tour was never offered)",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/OnboardingStateDTO" } },
            error_code: { type: "integer", example: 0 },
          },
        },
      },
    },
  },
  OnboardingStateSuccess: {
    description: "The onboarding state after the write",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/OnboardingStateDTO" },
            error_code: { type: "integer", example: 0 },
          },
        },
      },
    },
  },
};
