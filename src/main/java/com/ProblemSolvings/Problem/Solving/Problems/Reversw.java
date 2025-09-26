package com.ProblemSolvings.Problem.Solving.Problems;

import java.util.Arrays;

public class Reversw {
    public static void main(String[] args) {
        int[] a= {2,3,4,6,7,93,86};

        int start = 0;
        int end = a.length -1;

        while (start < end){
            int temp = a [start];
            a[start] = a[end];
            a[end] = temp;
            start++;
            end--;

        }
        System.out.println("Reversed from Array" + Arrays.toString(a));

        System.out.println("Reversed Array");
        for(int i =0; i<a.length; i++){
            System.out.print(a[i] + " ");
        }
    }

}
