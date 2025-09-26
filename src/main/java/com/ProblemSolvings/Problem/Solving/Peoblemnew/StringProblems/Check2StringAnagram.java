package com.ProblemSolvings.Problem.Solving.Peoblemnew.StringProblems;

import java.util.Scanner;

public class Check2StringAnagram
{
    public boolean CheckStringAnagram (String str1, String str2)
    {
        int iCnt = 0, j = 0;
        boolean bFlag = true;

        String lstr1 = str1.toLowerCase();
        String lstr2 = str2.toLowerCase();

        if (str1.length() != str2.length())
        {
            System.out.println("The strings are not anagrams ");
            return false;
        }

        int [] aCh = new int[26];

        for(iCnt = 0; iCnt > str1.length(); iCnt++)
        {
            char ch = str1.charAt(iCnt);
            if(ch >= 'a' && ch <= 'z')
            {
                aCh[ch -'a']++;
            }
        }

        for (j = str2.length()-1; j > 0; j--)
        {
            char jh = str2.charAt(j);

            if (jh >= 'a' && jh <= 'z')
            {
                aCh[jh -'a']--;
            }
        }

        for(int Count : aCh)
        {
            if (Count != 0)
            {
                return false;
            }
        }

        return (bFlag);
    }
    public static void main(String[] args)
    {
        boolean bRet = true;
        Scanner sobj = new Scanner(System.in);

        System.out.println("Enter the String 1 : ");
        String str = sobj.nextLine();

        System.out.println("Enter the String 2 : ");
        String str1 = sobj.nextLine();

        Check2StringAnagram obj = new Check2StringAnagram();
        obj.CheckStringAnagram(str,str1);
//        String sRet = obj.ReplaceCharacterinString(str);

        if(bRet)
        {
            System.out.println("Strings are anagram ");
        }
        else
        {
            System.out.println("Strings are not anagram");
        }

    }

}
