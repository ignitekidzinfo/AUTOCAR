package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Arrays;
import java.util.Scanner;

public class FirstWordUppercase
{
    public String UpperCase(String str1)
    {
        int iCnt = 0;

        String [] str2 = str1.split(" ");

        StringBuilder sb = new StringBuilder();

        for (iCnt = 0; iCnt < str2.length; iCnt++)
        {
            for (iCnt = 0; iCnt < str2.length; iCnt ++)
            {
                if (str2[iCnt].length() > 0)
                {
                    String result = str2[iCnt].substring(0,1).toUpperCase() + str2[iCnt].substring(1);
                    sb.append(result);

                }
                if (iCnt < str2.length - 1) {
                    sb.append(" ");
                }
            }

        }
        return sb.toString();
    }

    public static void main(String[] args)
    {
        String sRet = "";
        Scanner sobj = new Scanner(System.in);

        System.out.println("Enter the String 1 : ");
        String str = sobj.nextLine();

        FirstWordUppercase sob= new FirstWordUppercase();
        sRet = sob.UpperCase(str);

        System.out.println("Updated String is : " + sRet);
    }
}
