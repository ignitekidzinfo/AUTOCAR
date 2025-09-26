package com.ProblemSolvings.Problem.Solving.Problems;

public class ReverseThrWordsInString {
    public String str = "Welcome to the world of programming";

   public void reversewords () {

       String[] s = str.split(" ");

       for (int i =s.length-1; i>=0; i--) {

           System.err.println(s[i]);

       }
   }
}
