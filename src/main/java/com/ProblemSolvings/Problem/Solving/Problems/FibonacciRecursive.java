package com.ProblemSolvings.Problem.Solving.Problems;

public class FibonacciRecursive {

    public static int factorial(int n) {
        if (n == 1) return 1; // Base case
        return n * factorial(n - 1); // Recursive call
    }

    public static int fibonacci(int n) {
        if (n == 0) return 0; // Base case
        if (n == 1) return 1; // Base case
        return fibonacci(n - 1) + fibonacci(n - 2); // Recursive call
    }

    public static void main(String[] args) {
        int num = 7;
        System.out.println("Fibonacci of " + num + " is: " + fibonacci(num));
        int num1 = 5;
        System.out.println("Factorial of " + num1 + " is: " + factorial(num1));
    }

}
