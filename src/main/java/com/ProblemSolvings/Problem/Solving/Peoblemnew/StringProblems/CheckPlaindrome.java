package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Scanner;

public class CheckPlaindrome
{

    public boolean Palindrome (String str1)
    {
        char[] sArr = str1.toCharArray();
        int i = 0, j = str1.length() -1;

        boolean bFlag = true;

        while (i < j)
        {
            if( sArr[i] != sArr[j])
            {
                bFlag = false;
                break;
            }
            i++;
            j--;
        }

        return bFlag;
    }
    public static void main(String[] args)
    {
        boolean bRet = false;
        Scanner sobj = new Scanner(System.in);

        System.out.println("Please enter the string : ");
        String str = sobj.nextLine();

        CheckPlaindrome cobj = new CheckPlaindrome();
        bRet = cobj.Palindrome(str);

        if (bRet == true)
        {
            System.out.println("String is Palindrome");
        }
        else
        {
            System.out.println("String is not Palindrome");
        }

    }
}
