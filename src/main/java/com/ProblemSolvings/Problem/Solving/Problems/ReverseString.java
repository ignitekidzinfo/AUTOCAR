package com.ProblemSolvings.Problem.Solving.Problems;

public class ReverseString {
    public static void main(String[] args) {

        String str = "Hello World";
        String reversedstr = "";

    for (int i = str.length()-1; i>=0; i--) {
    reversedstr += str.charAt(i);

}
        System.out.println("Original string: " + str);
        System.out.println("Reversed string: " + reversedstr);
    }
}
