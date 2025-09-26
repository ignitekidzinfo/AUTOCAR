package com.ProblemSolvings.Problem.Solving.Peoblemnew;

public class ReverseEachWord {
    public static void main(String[] args) {
        String str = "Hello to my world";
        String lowerCase = str.toLowerCase();
        String revers = revers(lowerCase);
        System.out.println("Reversed String "+ revers);


//        String [] words= str.split(" ");
//        StringBuilder result = new StringBuilder();
//
//        for (String word: words) {
//        StringBuilder sb = new StringBuilder(word);
//        result.append(sb.reverse()).append(" ");
//        }
//        System.out.println(result.toString().trim());
    }
    public static String revers (String ss) {
        StringBuilder sb = new StringBuilder();
        for(int i =ss.length()-1; i>=0; i--){
            sb.append(ss.charAt(i));
        }
        return sb.toString();
    }
}
