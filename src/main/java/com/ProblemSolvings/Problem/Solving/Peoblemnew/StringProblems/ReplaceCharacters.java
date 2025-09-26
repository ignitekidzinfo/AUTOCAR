package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Scanner;

public class ReplaceCharacters
{
    public String ReplaceCharacterinString(String str1)
    {
        int iCnt = 0; char c = 'r';
        String lStr = str1.toLowerCase();

        StringBuilder sb = new StringBuilder();
        for (iCnt = 0; iCnt < lStr.length(); iCnt++)
        {
            char ch = lStr.charAt(iCnt);
            if (c == ch)
            {
                sb.append('X');
            }
            else
            {
                sb.append(ch);
            }
        }

        return sb.toString();
    }

    public static void main(String[] args)
    {
        Scanner sobj = new Scanner(System.in);

        System.out.println("Enter the String : ");
        String str = sobj.nextLine();

        ReplaceCharacters obj = new ReplaceCharacters();
        String sRet = obj.ReplaceCharacterinString(str);

        System.out.println("Modified String is : " + sRet);

    }
}
