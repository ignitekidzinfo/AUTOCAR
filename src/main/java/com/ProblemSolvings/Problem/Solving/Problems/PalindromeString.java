package com.ProblemSolvings.Problem.Solving.Problems;

import java.util.Scanner;

public class PalindromeString {

    public static void newmethod() {
        // Initialize an empty string to hold the reversed version of the input
        String str = "";

        // Prompt the user for input
        System.out.println("Enter the input String ");

        // Create a Scanner object to read input from the console
        Scanner scanner = new Scanner(System.in);

        // Read the entire line of input from the user
        String original = scanner.nextLine();

        // Loop through the original string backwards
        for (int i = original.length() - 1; i >= 0; i--) {
            // Append each character to the str, building the reversed string
            str = str + original.charAt(i);
        }

        // Check if the original string is equal to its reversed version
        if (original.equals(str)) {
            // If true, the string is a palindrome
            System.err.println("The Given String is Palindrome");
        } else {
            // If false, the string is not a palindrome
            System.err.println("The Given String is not Palindrome");
        }
    }

    public static void m1() throws Exception {
        throw new Exception();
    }
}
