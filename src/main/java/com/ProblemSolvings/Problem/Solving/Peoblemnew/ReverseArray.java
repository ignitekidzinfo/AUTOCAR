package com.ProblemSolvings.Problem.Solving.Peoblemnew;


import java.util.Arrays;

public class ReverseArray {
    static int[] arr ={1,2,3,4,5,6,7,99,67};

    static int start = 0;
    static int end = arr.length-1;
    public static void main(String[] args) {

        while(start<end){
        int temp = arr[start];
        arr[start]= arr[end];
        arr[end] = temp;
        start++;
        end--;

        }
        System.out.println("Reversed Array " + Arrays.toString(arr));
    }
}
