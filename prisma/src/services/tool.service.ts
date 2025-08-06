// When creating or updating Tool, ensure category is included:
await prisma.tool.create({
  data: {
    // ...other fields
    category: 'someCategory', // or undefined/null if optional
  }
});