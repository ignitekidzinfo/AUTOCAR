package com.ProblemSolvings.Problem.Solving.Problems;


import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public class Salary {
    public static void main(String[] args) {
    record Employee(int id, String name, BigDecimal salary){}
        List<Employee>persons = List.of(
         new Employee(
                 1, "Alice",new BigDecimal("5000")),
                new Employee(2, "Bob",new BigDecimal("7000")),
                new Employee(3, "Charlie",new BigDecimal("4000")),
                new Employee(4, "David",new BigDecimal("8000")),
                new Employee(5, "Eve",new BigDecimal("6000"))
        );
        Optional<BigDecimal> secondHighestSalary = persons.stream()
                .map(Employee::salary)
                .distinct()
                .sorted((a, b) -> b.compareTo(a))
                .skip(1)
                .findFirst();

                secondHighestSalary.ifPresentOrElse(
                        salary -> System.out.println("Second Highest Salary " + salary),
                        ()-> System.out.println("No Second Highest Salary Found")
                );

    }
}
