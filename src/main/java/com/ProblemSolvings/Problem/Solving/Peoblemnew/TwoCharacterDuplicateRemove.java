package com.ProblemSolvings.Problem.Solving.Peoblemnew;

import java.util.HashMap;
import java.util.Map;

public class TwoCharacterDuplicateRemove {

        public static void main(String[] args) {
            String input = "mahindra and mahindra";
            findDuplicatePairs(input);
        }

        public static void findDuplicatePairs(String input) {
            // Remove spaces to focus on letters
            input = input.replaceAll("\\s+", "");

            Map<String, Integer> pairCount = new HashMap<>();

            // Iterate through the string to extract pairs
            for (int i = 0; i < input.length() - 1; i++) {
                String pair = input.substring(i, i + 2); // Extract a pair of two characters
                pairCount.put(pair, pairCount.getOrDefault(pair, 0) + 1);
            }

            // Find and print duplicate pairs
            System.out.println("Duplicate pairs:");
            for (Map.Entry<String, Integer> entry : pairCount.entrySet()) {
                if (entry.getValue() > 1) {
                    System.out.println(entry.getKey() + " appears " + entry.getValue() + " times");
                }
            }
        }
    }

