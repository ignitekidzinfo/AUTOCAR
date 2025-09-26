package com.ProblemSolvings.Problem.Solving.Problems;

import java.util.Scanner;

public class SelectionSort
{
    void SelectionSort (int Brr[], int iSize)
    {
        int i = 0, j = 0, min_index = 0, temp = 0;

        for (i = 0; i < iSize - 1; i++)
        {
            min_index = i;
            for (j = i + 1; j < iSize ; j++)
            {
                if(Brr[j] < Brr[min_index])
                {
                    min_index = j;
                }
            }
            temp =  Brr[i];
            Brr[i] = Brr[min_index];
            Brr[min_index] = temp;
        }
        System.out.println("Array After Sorting : ");
        for(i = 0; i < iSize; i++)
        {
            System.out.println(Brr[i] + "\t");
        }
    }

    public static void main(String[] args)
    {
        int iLength = 0, iCnt = 0;

        int Arr[];
        Scanner sobj = new Scanner(System.in);

        System.out.println("Enter Size of Array : ");
        iLength = sobj.nextInt();
        Arr = new int[iLength];

        for(iCnt = 0; iCnt < iLength; iCnt++)
        {
            System.out.println("Enter the element : " + (iCnt + 1) );
            Arr[iCnt] = sobj.nextInt();
        }
        SelectionSort ssobj = new SelectionSort();
        ssobj.SelectionSort(Arr, iLength);

    }
}
