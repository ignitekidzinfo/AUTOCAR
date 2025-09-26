package com.ProblemSolvings.Problem.Solving.Peoblemnew;

import java.util.Arrays;
import java.util.List;

public class StreamsParallelAndSequential {

    public static void main(String[] args) {
        List<String> names = Arrays.asList("John", "Alice", "Bob", "David");

        // Sequential stream (Single-threaded)
        names.stream()
                .forEach(name -> System.out.println(Thread.currentThread().getName() + " : " + name));

        // Parallel stream (Multi-threaded)
        names.parallelStream()
                .forEach(name -> System.out.println(Thread.currentThread().getName() + " : " + name));

    }
}
