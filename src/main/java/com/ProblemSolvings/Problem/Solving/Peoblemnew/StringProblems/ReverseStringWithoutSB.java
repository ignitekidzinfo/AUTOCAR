package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import com.ProblemSolvings.Problem.Solving.Problems.ReverseString;

import java.util.Scanner;

public class ReverseStringWithoutSB
{
    // Solution 1 st
//    public void ReverseString (String ss)
//    {
//        int i = 0;
//        char[] cArr = new char[ss.length()];
//
//        for (i = ss.length()-1; i >= 0; i-- )
//        {
//            cArr[ss.length()-1 -i] = ss.charAt(i);
//        }
//
//        System.out.print("Reversed Array is : ");
//        for ( i = 0; i < ss.length(); i++)
//        {
//            System.out.print(cArr[i]);
//        }
//
//    }

    // Solution 2 nd
//    public String ReverseString (String str1)
//    {
//        int i = 0, j = 0;
//        char temp;
//
//        char[] cArr = str1.toCharArray();
//
//        for (i = 0; i < str1.length(); i++)
//        {
//            for( j = str1.length() - 1 - i; j > i; j--)
//            {
//               temp = cArr[i];
//               cArr[i] = cArr[j];
//               cArr[j] = temp;
//               break;
//
//            }
//        }
//        return new String(cArr);
//    }

    // Solution 3 rd

    public String ReverseString (String str1)
    {
        char []cArr = str1.toCharArray();
        int i = 0, j = str1.length()-1;
        char temp = '\0';

        while(i < j)
        {
            temp = cArr[i];
            cArr[i] = cArr[j];
            cArr[j] = temp;
            i++;
            j--;
        }
        return new String(cArr);
    }

    public static void main(String[] args)
    {
        String str = "\0";
        ReverseStringWithoutSB robj = new ReverseStringWithoutSB();
        Scanner sobj = new Scanner(System.in);

        System.out.println("Please enter the string : ");
        str = sobj.nextLine();

        String str2 = robj.ReverseString(str);
        System.out.println("Reversed String is : " + str2);
    }
}
