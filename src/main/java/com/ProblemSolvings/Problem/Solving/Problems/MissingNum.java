package com.ProblemSolvings.Problem.Solving.Problems;

import java.util.HashMap;
import java.util.Map;

public class MissingNum {
    public static void main(String[] args) {
       String str = "ashutosh";
        Map<Character, Integer> freqencyMap = new HashMap<>();

        for (char c: str.toCharArray()){
            freqencyMap.put(c, freqencyMap.getOrDefault(c,0) +1);
        }
        for (Map.Entry<Character, Integer> entry:freqencyMap.entrySet()){
            System.out.println(entry.getKey()+ ": "+ entry.getValue());
        }
    }

}
