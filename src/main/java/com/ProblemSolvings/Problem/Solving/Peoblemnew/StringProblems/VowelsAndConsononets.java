package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Scanner;

public class VowelsAndConsononets
{
    void FindVAndC(String str1)
    {
        int iCnt = 0, Vowels = 0, Consonent = 0;

        String lStr = str1.toLowerCase();
        //char [] cArr  = lStr.toCharArray(); this will create array which will consume the memory


        for (iCnt = 0; iCnt < str1.length(); iCnt++)
        {
            char ch = lStr.charAt(iCnt);

            if(ch >= 'a' && ch <= 'z')
            {
                if("aieou".indexOf(ch) != -1)
                {
                    Vowels ++;
                }
                else
                {
                    Consonent ++;
                }
            }

        }
        System.out.println("Total number of Vowels : " + Vowels);
        System.out.println("Total numbers of Consonents : " + Consonent);
    }

    public static void main(String[] args)
    {
        String str = "\0";

        VowelsAndConsononets robj = new VowelsAndConsononets();
        Scanner sobj = new Scanner(System.in);

        System.out.println("Please enter the string : ");
        str = sobj.nextLine();

        robj.FindVAndC(str);

    }
}
