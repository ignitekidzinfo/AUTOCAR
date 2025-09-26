package com.ProblemSolvings.Problem.Solving.Peoblemnew;

import java.util.Arrays;

public class CustomSort {

    // Quick Sort implementation
    public static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            // Partition the array around the pivot
            int pivotIndex = partition(arr, low, high);

            // Recursively sort the sub-arrays
            quickSort(arr, low, pivotIndex - 1);  // Sort left side
            quickSort(arr, pivotIndex + 1, high); // Sort right side
        }
    }

    // Partition method
    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high]; // Choosing the last element as the pivot
        int i = low - 1;       // Index of smaller element

        for (int j = low; j < high; j++) {
            // If the current element is smaller than or equal to the pivot
            if (arr[j] <= pivot) {
                i++;
                // Swap arr[i] and arr[j]
                swap(arr, i, j);
            }
        }

        // Swap arr[i+1] and the pivot (arr[high])
        swap(arr, i + 1, high);
        return i + 1; // Return the pivot index
    }

    // Swap helper method
    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    // Main method to test the custom sort
    public static void main(String[] args) {
        int[] numbers = {12, 7, -5, 14, 0, 3, 4};
        System.out.println("Original array: " + Arrays.toString(numbers));

        // Perform quick sort
        quickSort(numbers, 0, numbers.length - 1);

        System.out.println("Sorted array: " + Arrays.toString(numbers));
    }
}

