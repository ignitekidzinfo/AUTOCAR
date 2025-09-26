package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Scanner;

public class RemoveSpaces
{
    public String RemoveSp(String str1)
    {
        int iCnt = 0;

        StringBuilder sb = new StringBuilder();
        for(iCnt = 0; iCnt < str1.length(); iCnt++ )
        {
            char ch = str1.charAt(iCnt);
            if(ch != ' ')
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

        RemoveSpaces rObj = new RemoveSpaces();
        String newstr = rObj.RemoveSp(str);

        System.out.println("Modified String is : " + newstr);

    }
}
