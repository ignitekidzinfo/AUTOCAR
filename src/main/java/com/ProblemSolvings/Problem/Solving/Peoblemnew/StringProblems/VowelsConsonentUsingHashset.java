package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

public class VowelsConsonentUsingHashset
{

    void VandCHashset (String str1)
    {
        int iCnt  = 0, VowelCount = 0, ConsonentCount = 0;

        String lStr = str1.toLowerCase();

        Set <Character> hObj= Set.of('a','o','u','i','e');

        for(iCnt = 0; iCnt < lStr.length();iCnt++)
        {
            char ch = lStr.charAt(iCnt);

            if(Character.isLetter(ch))
            {
                if(hObj.contains(ch))
                {
                    VowelCount ++;
                }
                else
                {
                    ConsonentCount++;
                }
            }
        }
        System.out.println("Total number of Vowels : " + VowelCount);
        System.out.println("Total numbers of Consonents : " + ConsonentCount);
    }
    public static void main(String[] args)
    {
        String str = "\0";

        VowelsConsonentUsingHashset robj = new VowelsConsonentUsingHashset();
        Scanner sobj = new Scanner(System.in);

        System.out.println("Please enter the string : ");
        str = sobj.nextLine();

        robj.VandCHashset(str);

    }
}
