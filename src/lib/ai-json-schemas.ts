export const generatedTasksJsonSchema = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
          },
          dueDate: {
            type: "string",
            description: "ISO date in YYYY-MM-DD format when appropriate.",
          },
          assignee: { type: "string" },
          subtasks: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["title", "description", "priority", "subtasks"],
      },
    },
  },
  required: ["tasks"],
};

export const breakdownTaskJsonSchema = {
  type: "object",
  properties: {
    subtasks: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
          },
          dueDate: {
            type: "string",
            description: "ISO date in YYYY-MM-DD format when appropriate.",
          },
        },
        required: ["title", "description", "priority"],
      },
    },
  },
  required: ["subtasks"],
};

export const prioritizeTasksJsonSchema = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
          },
          rationale: { type: "string" },
          suggestedDueDate: {
            type: "string",
            description: "ISO date in YYYY-MM-DD format when appropriate.",
          },
        },
        required: ["title", "priority", "rationale"],
      },
    },
  },
  required: ["tasks"],
};
