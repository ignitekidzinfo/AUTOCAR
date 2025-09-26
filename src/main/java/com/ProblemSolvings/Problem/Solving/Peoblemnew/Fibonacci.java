package com.ProblemSolvings.Problem.Solving.Peoblemnew;

public class Fibonacci {
    public static void main(String[] args) {
        int n = 10, t1 = 0, t2 = 1;
        System.out.print("Fibonacci: " + t1 + " " + t2);
        for (int i = 2; i < n; i++) {
            int next = t1 + t2;
            System.out.print(" " + next);
            t1 = t2;
            t2 = next;
        }
    }
}

