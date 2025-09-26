package com.ProblemSolvings.Problem.Solving.Problems;

import java.util.HashSet;
import java.util.Set;

public class RemoveDuplicate {

    public static String RemoveDuplicates( String name){
        Set<Character> ms = new HashSet();
        int fc= 11;
        RemoveDuplicate cdd = new RemoveDuplicate();
        cdd.testScope();
        fc =1;
        System.out.println(fc);
        StringBuilder as = new StringBuilder();

        for (int i=0; i<name.length(); i++){
            char c = name.charAt(i);
            if (!ms.contains(c)  ) {
                ms.add(c);
                as.append(c);
            }
        }
        System.out.println(as.toString());
        return as.toString();

      }
    public void testScope() {
        int num = 10; // Local variable accessible throughout the method

        if (num > 5) {
          num= 11; // Local variable accessed inside if block
            System.out.println("Inside if block: " + num); // This works
        }

        // System.out.println(insideIf); // This will cause a compilation error
        System.out.println("Outside if block: " + num); // This works
    }
}
