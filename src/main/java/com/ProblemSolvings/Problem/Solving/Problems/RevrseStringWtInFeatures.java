package com.ProblemSolvings.Problem.Solving.Problems;

public class RevrseStringWtInFeatures {

    //Not using any inbuild method to reverse

    public static void main(String[] args) {
        String str = "madam";

        String normalstr = str.toLowerCase();

        String revrsed = isPlaindrome(normalstr);

        if (normalstr.equals(revrsed)) {
            System.out.println(str + "is a plaindrome");
        } else
            System.out.println(str + "is not a plaindrome");
    }

    public static String isPlaindrome(String str) {
        StringBuilder revrsed = new StringBuilder();
        for (int i = str.length() - 1; i >= 0; i--) {
            revrsed.append(str.charAt(i));

        }
        return revrsed.toString();
    }
}