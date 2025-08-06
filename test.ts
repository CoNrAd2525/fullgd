// Simple TypeScript test file
console.log('TypeScript is working!');

// Test basic types
const message: string = 'Hello, TypeScript!';
const count: number = 42;
const isWorking: boolean = true;

// Test array and object types
const numbers: number[] = [1, 2, 3, 4, 5];
const user: { name: string; age: number } = { name: 'Test User', age: 30 };

// Test function types
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(message);
console.log(count);
console.log(isWorking);
console.log(numbers);
console.log(user);
console.log(greet('TypeScript'));