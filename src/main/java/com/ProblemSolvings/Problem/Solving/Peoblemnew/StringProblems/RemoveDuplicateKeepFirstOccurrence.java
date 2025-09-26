package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Scanner;

public class RemoveDuplicateKeepFirstOccurrence
{
    public String KeepOneOccurrence(String str1)
    {
        int iCnt = 0;

        String lStr = str1.toLowerCase();

        StringBuilder sb = new StringBuilder();

        int [] iArr = new int[26];

        for(iCnt = 0; iCnt < lStr.length(); iCnt++)
        {
            char ch = lStr.charAt(iCnt);

            if(ch >= 'a' && ch <= 'z')
            {
                if (iArr [ch -'a'] == 0)
                {
                    sb.append(ch);
                    iArr[ch - 'a'] = 1;
                }
            }else
            {
                sb.append(ch);
            }
        }
        return  sb.toString();
    }

    public static void main(String[] args)
    {
        String sRet = "";
        Scanner sobj = new Scanner(System.in);
        System.out.println("Enter the String 1 : ");
        String str = sobj.nextLine();

        RemoveDuplicateKeepFirstOccurrence rObj= new RemoveDuplicateKeepFirstOccurrence();

        sRet = rObj.KeepOneOccurrence(str);
        System.out.println("Updated String is : " + sRet);

    }
}
