package com.ProblemSolvings.Problem.Solving.Peoblemnew;

public class CompareString {

    public static void main(String[] args) {
        String str1 = "ash";
        String str2 = "ash";

        // First, check if the lengths are different
       if (str1.length() != str2.length()) {
           System.out.println("Strings are not equal in length");
           return;
       }
       boolean areEqual = true;

       // Now compare the characters one by one
       for (int i =0; i <str1.length(); i++) {
       if (str1.charAt(i) != str2.charAt(i)){
           areEqual = false;
           break;
       }

       }
        if(areEqual){
            System.out.println("str1 " + " is equal to " + "str2");
        } else {
            System.out.println("str1 " + " is not equals to "+ "str2");
        }

    }

    }

