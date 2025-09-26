package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Scanner;

public class FirstNonRepetitiveCharacterString
{

    public char FindFirstNonRepChar(String str1)
    {
        int iCnt = 0;
        String lStr = str1.toLowerCase();

        int[] iArr = new int[26];

        for(iCnt = 0; iCnt < lStr.length(); iCnt++)
        {
            char ch = lStr.charAt(iCnt);
            if (ch >= 'a' && ch <='z')
            {
                iArr[ch - 'a'] ++;
            }
        }
        for(iCnt = 0; iCnt< lStr.length(); iCnt++)
        {
            char ch = lStr.charAt(iCnt);
            if (ch >= 'a' && ch <= 'z' && iArr[iCnt] < 1)
            {
                return ch;
            }
        }

    }
    public static void main(String[] args)
    {
        char cRet = '\0';

        String sRet = "";
        Scanner sobj = new Scanner(System.in);
        System.out.println("Enter the String 1 : ");
        String str = sobj.nextLine();

        FirstNonRepetitiveCharacterString sOb = new FirstNonRepetitiveCharacterString();

        cRet =

    }
}
